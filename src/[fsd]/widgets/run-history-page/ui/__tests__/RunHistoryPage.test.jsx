// @vitest-environment jsdom
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import RunHistoryPage from '../RunHistoryPage';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const containerProps = vi.hoisted(() => ({ current: null }));

vi.mock('@/[fsd]/entities/run-history/ui', () => ({
  RunHistoryContainer: props => {
    containerProps.current = props;
    return (
      <button
        data-testid="open-analytics"
        onClick={() => props.handleOpenAnalytics(77)}
      />
    );
  },
}));

vi.mock('@/[fsd]/features/chat', () => ({ ChatMessageList: () => null }));

vi.mock('@/[fsd]/features/settings/ui/drawer-page', () => ({ DrawerPageHeader: () => null }));

vi.mock('@/[fsd]/features/toolkits', () => ({ ToolkitsHelpers: { prettifyToolkitConversation: vi.fn() } }));

vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => null }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 2 }));

vi.mock('@/api/applications', () => ({ useApplicationDetailsQuery: () => ({ data: undefined }) }));

const scheduleList = vi.hoisted(() => ({ args: null, rows: [{ id: 4, name: 'Daily digest' }] }));

vi.mock('@/[fsd]/entities/schedule', async () => ({
  ...(await vi.importActual('@/[fsd]/entities/schedule/lib/helpers')),
  useGetScheduleListQuery: (args, options) => {
    scheduleList.args = { args, options };
    return { data: options?.skip ? undefined : { rows: scheduleList.rows } };
  },
}));

vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: ({ label, options, value, onValueChange }) => (
    <select
      aria-label={label}
      value={value}
      onChange={event => onValueChange(event.target.value)}
    >
      {options.map(option => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const AnalyticsProbe = () => {
  const { pathname, search } = useLocation();
  return <div data-testid="analytics-page">{`${pathname}${search}`}</div>;
};

const renderAt = (url, extraProps) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/agents/:tab/:agentId/history"
          element={
            <RunHistoryPage
              source="application"
              detailRoute="/agents/:tab/:agentId"
              analyticsRoute="/agents/:tab/:agentId/history/analytics"
              {...extraProps}
            />
          }
        />
        <Route
          path="/agents/:tab/:agentId/history/analytics"
          element={<AnalyticsProbe />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('RunHistoryPage opening run analytics', () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => cleanup());

  it('opens the chosen conversation without the single analytics run it was reached from', () => {
    renderAt('/agents/all/127/history?usage_run_id=run-x&history_run_id=9');

    fireEvent.click(screen.getByTestId('open-analytics'));

    expect(screen.getByTestId('analytics-page')).toHaveTextContent(
      '/agents/all/127/history/analytics?history_run_id=77',
    );
  });

  it('keeps the other search params of a plain Run History visit', () => {
    renderAt('/agents/all/127/history?viewMode=owner');

    fireEvent.click(screen.getByTestId('open-analytics'));

    expect(screen.getByTestId('analytics-page')).toHaveTextContent(
      '/agents/all/127/history/analytics?viewMode=owner&history_run_id=77',
    );
  });
});

describe('RunHistoryPage execution type column (R1.1, EL-7011 US-38)', () => {
  afterEach(() => cleanup());

  it('passes the column label and row decorator through to the container', () => {
    const decorateRow = vi.fn();
    renderAt('/agents/all/127/history', { eventColumnLabel: 'Execution type', decorateRow });

    expect(containerProps.current.eventColumnLabel).toBe('Execution type');
    expect(containerProps.current.decorateRow).toBe(decorateRow);
  });

  it('leaves the column label and decorator unset when the caller gives none', () => {
    renderAt('/agents/all/127/history');

    expect(containerProps.current.eventColumnLabel).toBeUndefined();
    expect(containerProps.current.decorateRow).toBeUndefined();
  });
});

describe('RunHistoryPage schedule filter and links (EL-7011 CR-22)', () => {
  afterEach(() => cleanup());

  it('CR-22 ?schedule_id=4 sends schedule_id to the list and preselects the filter', () => {
    renderAt('/agents/all/127/history?schedule_id=4', { scheduleEntityType: 'agent' });

    expect(scheduleList.args.args).toMatchObject({ projectId: 2, entityType: 'agent', entityId: '127' });
    expect(containerProps.current.queryParams).toEqual({ schedule_id: 4 });
    expect(screen.getByLabelText('Schedule')).toHaveValue('4');

    fireEvent.change(screen.getByLabelText('Schedule'), { target: { value: '' } });
    expect(containerProps.current.queryParams).toEqual({});
  });

  it('CR-22 a schedule not in the caller list shows a plain name', () => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });
    const [scheduleColumn] = containerProps.current.extraColumns;

    expect(scheduleColumn.render({ schedule_run: { schedule_id: 9, schedule_name: 'Hidden' } })).toBe(
      'Hidden',
    );
    expect(scheduleColumn.render({ schedule_run: null })).toBe('-');
    render(
      <MemoryRouter>
        {scheduleColumn.render({ schedule_run: { schedule_id: 4, schedule_name: 'Daily digest' } })}
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Daily digest' })).toHaveAttribute(
      'href',
      '/agents/all/127/schedules/4',
    );
  });

  it('CR-22 histories without schedules show no filter and no extra columns', () => {
    renderAt('/agents/all/127/history');

    expect(screen.queryByLabelText('Schedule')).not.toBeInTheDocument();
    expect(containerProps.current.extraColumns).toBeUndefined();
    expect(scheduleList.args.options.skip).toBe(true);
  });
});
