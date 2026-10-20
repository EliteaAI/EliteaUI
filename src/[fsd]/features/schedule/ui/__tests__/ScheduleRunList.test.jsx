// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ScheduleRunList from '../ScheduleRunList';

// EL-7011 US-32: run list of one schedule on the shared run history (R4.1 to R4.4).

const mocks = vi.hoisted(() => ({
  useGetScheduleRunsQuery: vi.fn(),
  dispatch: vi.fn(),
  invalidateTags: vi.fn(tags => ({ type: 'invalidate', tags })),
  container: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/[fsd]/entities/schedule', () => ({ useGetScheduleRunsQuery: mocks.useGetScheduleRunsQuery }));
vi.mock('@/[fsd]/entities/run-history/ui', () => ({
  RunHistoryContainer: props => {
    mocks.container(props);
    return <div data-testid="run-history" />;
  },
}));
vi.mock('@/[fsd]/entities/run-history/api', () => ({ RunHistoryApi: { HISTORY_ITEMS_TAG: 'HISTORY_TAG' } }));
vi.mock('@/[fsd]/features/chat', () => ({ ChatMessageList: () => null }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastError: mocks.toastError }),
}));
vi.mock('@/api/applications', () => ({
  useApplicationDetailsQuery: () => ({ data: { versions: [{ id: 3, name: 'v1' }] } }),
}));
vi.mock('@/api/eliteaApi.js', () => ({ eliteaApi: { util: { invalidateTags: mocks.invalidateTags } } }));
vi.mock('@/common/utils.jsx', () => ({ buildErrorMessage: () => 'boom' }));
vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }));

const schedule = { id: 9, application_id: 4, entity_type: 'agent' };
const withConversation = {
  id: 1,
  conversation_id: 77,
  status: 'success',
  trigger: 'cron',
  started_at: '2026-10-01T10:00:00Z',
};
const withoutConversation = {
  id: 2,
  conversation_id: null,
  status: 'failed',
  trigger: 'test',
  reason: 'Model unavailable',
  started_at: '2026-10-02T10:00:00Z',
  finished_at: '2026-10-02T10:00:05Z',
};
const running = { ...withoutConversation, id: 3, status: 'running', reason: null, finished_at: null };

const mockRuns = rows => mocks.useGetScheduleRunsQuery.mockReturnValue({ currentData: { rows } });
const lastProps = () => mocks.container.mock.lastCall[0];
const pollingOf = () => mocks.useGetScheduleRunsQuery.mock.lastCall[1].pollingInterval;

describe('ScheduleRunList (EL-7011 US-32)', () => {
  beforeEach(() => mockRuns([withConversation, withoutConversation]));
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('R4.1 lists the runs of this schedule on the shared run history', () => {
    render(<ScheduleRunList schedule={schedule} />);
    expect(screen.getByTestId('run-history')).toBeInTheDocument();
    expect(lastProps()).toMatchObject({
      entityId: 4,
      source: 'agent',
      queryParams: { schedule_id: 9 },
      versions: [{ id: 3, name: 'v1' }],
    });
    expect(mocks.useGetScheduleRunsQuery.mock.calls[0][0]).toMatchObject({ projectId: 5, scheduleId: 9 });
  });

  it('R4.1 EL-7011 shows runs past the first page, up to the server maximum of 100', () => {
    const manyRuns = Array.from({ length: 25 }, (_, index) => ({ ...withoutConversation, id: index + 1 }));
    mockRuns(manyRuns);
    render(<ScheduleRunList schedule={schedule} />);

    const [[firstArgs], [pollingArgs]] = mocks.useGetScheduleRunsQuery.mock.calls.slice(-2);
    expect(firstArgs).toMatchObject({ page: 0, pageSize: 100 });
    expect(pollingArgs).toEqual(firstArgs);
    expect(lastProps().additionalRows).toHaveLength(25);
  });

  it('R4.1 EL-7011 US-32 shows the run detail below the list inside the form section', () => {
    render(<ScheduleRunList schedule={schedule} />);
    expect(lastProps().layout).toBe('stacked');
  });

  it('R4.1 keeps queryParams stable between renders', () => {
    const { rerender } = render(<ScheduleRunList schedule={schedule} />);
    const first = lastProps().queryParams;
    rerender(<ScheduleRunList schedule={schedule} />);
    expect(lastProps().queryParams).toBe(first);
  });

  it('R4.2 adds only runs without a conversation, with status as text and the reason', () => {
    render(<ScheduleRunList schedule={schedule} />);
    const { additionalRows, DetailComponent } = lastProps();
    expect(additionalRows).toHaveLength(1);
    expect(additionalRows[0].event_label).toBe('Failed, test');
    expect(lastProps().decorateRow({ id: 77 }).event_label).toBe('Success, scheduled');

    render(<DetailComponent row={additionalRows[0]} />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Model unavailable')).toBeInTheDocument();
  });

  it('R4.2 shows a run without a status without failing', () => {
    mockRuns([{ ...withoutConversation, status: '' }]);
    render(<ScheduleRunList schedule={schedule} />);
    const { additionalRows, DetailComponent } = lastProps();

    render(<DetailComponent row={additionalRows[0]} />);
    expect(screen.getByText('Model unavailable')).toBeInTheDocument();
  });

  it('R4.3 refreshes every 3 seconds while a run is running', () => {
    mockRuns([running]);
    render(<ScheduleRunList schedule={schedule} />);
    expect(pollingOf()).toBe(3000);
  });

  it('R4.3 does not poll when no run is running', () => {
    render(<ScheduleRunList schedule={schedule} />);
    expect(pollingOf()).toBe(0);
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it('R4.4 shows the final status, stops polling and reloads the conversation rows', () => {
    mockRuns([running]);
    const { rerender } = render(<ScheduleRunList schedule={schedule} />);
    mockRuns([{ ...running, status: 'success', finished_at: '2026-10-02T10:01:00Z' }]);
    rerender(<ScheduleRunList schedule={{ ...schedule }} />); // memo: a new prop object stands for the query update
    expect(pollingOf()).toBe(0);
    expect(lastProps().additionalRows[0].event_label).toBe('Success, test');
    expect(mocks.invalidateTags).toHaveBeenCalledWith(['HISTORY_TAG']);
    expect(mocks.dispatch).toHaveBeenCalledTimes(1);
  });

  it('R4.3 stops polling and shows an error when a poll fails', () => {
    mocks.useGetScheduleRunsQuery.mockReturnValue({
      currentData: { rows: [running] },
      isError: true,
      error: { status: 500, data: { error: 'boom' } },
    });
    render(<ScheduleRunList schedule={schedule} />);
    expect(pollingOf()).toBe(0);
    expect(mocks.toastError).toHaveBeenCalled();
  });
});
