// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleEntitySection from '../ScheduleEntitySection';

const listQuery = vi.fn();
let selectProps;

vi.mock('@/api/applications', () => ({ useApplicationListQuery: args => listQuery(args) }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));
vi.mock('@/[fsd]/shared/ui/icon/EntityTypeIcon', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui/banner-message/BannerMessage', () => ({
  default: ({ message }) => <div data-testid="banner">{message}</div>,
}));
vi.mock('@/[fsd]/shared/ui/checkbox/RadioButtonGroup', () => ({
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
      {...props}
    />,
  );

describe('ScheduleEntitySection', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lists the classic agents of the project for the agent type', () => {
    listQuery.mockReturnValue({ data: { rows: [{ id: 7, name: 'Digest agent' }], total: 1 } });
    renderSection();

    expect(listQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ projectId: 5, page: 0, params: { query: '', agents_type: 'classic' } }),
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

  it('disables the type switch and the select when the entity is locked', () => {
    listQuery.mockReturnValue({ data: { rows: [], total: 0 } });
    renderSection({ lockActive: true });

    expect(screen.getByTestId('schedule-type-agent')).toBeDisabled();
    expect(selectProps.disabled).toBe(true);
  });
});
