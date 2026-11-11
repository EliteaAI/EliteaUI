// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleEntitySection from '../ScheduleEntitySection';

const listQuery = vi.fn();
const toolkitQuery = vi.fn();
const indexQuery = vi.fn();
let selectProps;
let indexSelectProps;

vi.mock('@/api/applications', () => ({
  useApplicationListQuery: (args, options) => listQuery(args, options),
}));
vi.mock('@/api/toolkits', () => ({ useToolkitsListQuery: (args, options) => toolkitQuery(args, options) }));
vi.mock('@/hooks/application/useLibraryToolkits', () => ({ useGetToolkitIconMeta: () => () => ({}) }));
vi.mock('@/[fsd]/entities/schedule', () => ({
  TOOLKIT_INDEX_TYPE: 'toolkit_index',
  useGetToolkitIndexOptionsQuery: (args, options) => indexQuery(args, options),
}));
vi.mock('@/[fsd]/shared/ui/icon', () => ({ EntityIcon: () => null }));
vi.mock('@/[fsd]/shared/ui/select/SingleSelect', () => ({
  default: props => {
    indexSelectProps = props;
    return <div data-testid={props['data-testid']}>{props.label}</div>;
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));
vi.mock('@/[fsd]/shared/ui/icon/EntityTypeIcon', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui/banner-message/BannerMessage', () => ({
  default: ({ message }) => <div data-testid="banner">{message}</div>,
}));
vi.mock('../ScheduleSegmentedToggle', () => ({
  default: ({ items, onChange, disabled, testId }) => (
    <div data-testid={testId}>
      {items.map(item => (
        <button
          key={item.value}
          type="button"
          data-testid={`${testId}-${item.value}`}
          disabled={disabled}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('@/[fsd]/shared/ui/select/LazySelect', () => ({
  default: props => {
    selectProps = props;
    return <div data-testid="entity-select">{props.label}</div>;
  },
}));

const emptyToolkits = { data: { rows: [], total: 0 } };

const renderSection = (props = {}) =>
  render(
    <ScheduleEntitySection
      type="agent"
      applicationId=""
      lockActive={false}
      lockFailed={false}
      readOnly={false}
      error=""
      onTypeChange={vi.fn()}
      onEntityChange={vi.fn()}
      onToolkitChange={vi.fn()}
      onIndexChange={vi.fn()}
      {...props}
    />,
  );

describe('ScheduleEntitySection', () => {
  beforeEach(() => {
    toolkitQuery.mockReturnValue(emptyToolkits);
    indexQuery.mockReturnValue({ data: undefined });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lists the classic agents of the project for the agent type', () => {
    listQuery.mockReturnValue({ data: { rows: [{ id: 7, name: 'Digest agent' }], total: 1 } });
    renderSection();

    expect(listQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ projectId: 5, page: 0, params: { query: '', agents_type: 'classic' } }),
      { skip: false },
    );
    expect(selectProps.options).toEqual([expect.objectContaining({ value: 7, label: 'Digest agent' })]);
    expect(screen.getByTestId('entity-select')).toHaveTextContent('Agent');
  });

  it('reports a type change', () => {
    listQuery.mockReturnValue({ data: { rows: [], total: 0 } });
    const onTypeChange = vi.fn();
    renderSection({ onTypeChange });

    fireEvent.click(screen.getByTestId('schedule-type-pipeline'));

    expect(onTypeChange).toHaveBeenCalledWith('pipeline');
  });

  it('reports the chosen entity', () => {
    listQuery.mockReturnValue({ data: { rows: [{ id: 7, name: 'Digest agent' }], total: 1 } });
    const onEntityChange = vi.fn();
    renderSection({ onEntityChange });

    selectProps.onValueChange(7);

    expect(onEntityChange).toHaveBeenCalledWith(7);
  });

  it('shows the field error and the unavailable entity banner', () => {
    listQuery.mockReturnValue({ data: { rows: [], total: 0 } });
    renderSection({ error: 'Choose an agent or a pipeline', lockFailed: true });

    expect(screen.getByTestId('banner')).toHaveTextContent('The entity is not available.');
    expect(screen.getByText('Choose an agent or a pipeline')).toBeInTheDocument();
  });

  it('disables the select of a read-only schedule', () => {
    listQuery.mockReturnValue({ data: { rows: [], total: 0 } });
    renderSection({ readOnly: true });

    expect(selectProps.disabled).toBe(true);
  });
  describe('toolkit index type', () => {
    const indexRows = [
      { name: 'free', scheduled: false, schedulable: true },
      { name: 'taken', scheduled: true, schedulable: true },
      { name: 'fresh', scheduled: false, schedulable: false },
    ];

    it('offers a Toolkit Index segment and reports it', () => {
      listQuery.mockReturnValue({ data: { rows: [], total: 0 } });
      const onTypeChange = vi.fn();
      renderSection({ onTypeChange });

      fireEvent.click(screen.getByTestId('schedule-type-toolkit_index'));

      expect(onTypeChange).toHaveBeenCalledWith('toolkit_index');
    });

    it('lists only toolkits that have an index and skips the application list', () => {
      listQuery.mockReturnValue({ data: undefined });
      toolkitQuery.mockReturnValue({ data: { rows: [{ id: 3, name: 'confluence' }], total: 1 } });
      renderSection({ type: 'toolkit_index', toolkitId: '' });

      expect(toolkitQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ projectId: 5, params: { query: '', has_indexes: true } }),
        { skip: false },
      );
      expect(listQuery).toHaveBeenLastCalledWith(expect.anything(), { skip: true });
      expect(selectProps.options).toEqual([expect.objectContaining({ value: 3, label: 'confluence' })]);
      expect(screen.getByTestId('entity-select')).toHaveTextContent('Toolkit');
    });

    it('disables the index select with a hint until a toolkit is chosen', () => {
      renderSection({ type: 'toolkit_index', toolkitId: '' });

      expect(indexSelectProps.disabled).toBe(true);
      expect(screen.getByText('Select a toolkit first to choose an index.')).toBeInTheDocument();
      expect(indexQuery).toHaveBeenLastCalledWith(expect.anything(), { skip: true });
    });

    it('disables an index that has a schedule or no saved settings and says why', () => {
      indexQuery.mockReturnValue({ data: indexRows });
      renderSection({ type: 'toolkit_index', toolkitId: 3 });

      const byName = Object.fromEntries(indexSelectProps.options.map(option => [option.value, option]));
      expect(indexSelectProps.disabled).toBe(false);
      expect(byName.free.disabled).toBe(false);
      expect(byName.taken).toMatchObject({
        disabled: true,
        description: 'This index already has a schedule',
      });
      expect(byName.fresh).toMatchObject({
        disabled: true,
        description: 'This index has no saved settings. Run it once first.',
      });
      expect(screen.queryByText('Select a toolkit first to choose an index.')).not.toBeInTheDocument();
    });

    it('reports the chosen toolkit and index', () => {
      indexQuery.mockReturnValue({ data: indexRows });
      const onToolkitChange = vi.fn();
      const onIndexChange = vi.fn();
      renderSection({ type: 'toolkit_index', toolkitId: 3, onToolkitChange, onIndexChange });

      selectProps.onValueChange(3);
      indexSelectProps.onValueChange('free');

      expect(onToolkitChange).toHaveBeenCalledWith(3);
      expect(onIndexChange).toHaveBeenCalledWith('free');
    });

    it('shows the index field error', () => {
      renderSection({ type: 'toolkit_index', toolkitId: 3, indexError: 'Choose an index' });

      expect(screen.getByText('Choose an index')).toBeInTheDocument();
    });
  });
});
