// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRunsPanel from '../ScheduleRunsPanel';

// EL-7011 US-32 R3, R4, owner CR 2026-10-21: the Test schedule and Runs card of the Edit schedule page.

const mocks = vi.hoisted(() => ({ useGetScheduleRunsQuery: vi.fn(), toastError: vi.fn() }));

vi.mock('@/[fsd]/entities/schedule', () => ({ useGetScheduleRunsQuery: mocks.useGetScheduleRunsQuery }));
vi.mock('@/[fsd]/entities/run-history/ui', async importOriginal => ({
  ...(await importOriginal()),
  RunHistoryChat: ({ selectedHistoryItem }) => <div data-testid="run-chat">{selectedHistoryItem}</div>,
}));
vi.mock('@/[fsd]/features/chat', () => ({ ChatMessageList: () => null }));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastError: mocks.toastError }),
}));
vi.mock('@/common/utils.jsx', async importOriginal => ({
  ...(await importOriginal()),
  buildErrorMessage: () => 'boom',
}));
vi.mock('@/[fsd]/shared/ui/banner-message/BannerMessage', () => ({
  default: ({ message }) => <div role="alert">{message}</div>,
}));

const NOTE = 'A test never changes Last run or Next run.';
const schedule = { id: 9, allowed_actions: ['edit', 'run'] };
const olderTest = {
  id: 1,
  trigger: 'test',
  status: 'success',
  conversation_id: 70,
  started_at: '2026-10-14T10:00:00Z',
};
const newestTest = {
  id: 2,
  trigger: 'test',
  status: 'failed',
  reason: 'Model unavailable',
  conversation_id: 71,
  started_at: '2026-10-14T12:00:00Z',
};
const cron = {
  id: 3,
  trigger: 'cron',
  status: 'running',
  conversation_id: 72,
  started_at: '2026-10-14T13:00:00Z',
};

const theme = createTheme(getDesignTokens('dark'));
const mockRuns = rows => mocks.useGetScheduleRunsQuery.mockReturnValue({ currentData: { rows } });
const pollingOf = () => mocks.useGetScheduleRunsQuery.mock.lastCall[1].pollingInterval;
const renderPanel = (props = {}) => {
  const onTestRun = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRunsPanel
        schedule={schedule}
        onTestRun={onTestRun}
        testRunPending={false}
        testRunError=""
        {...props}
      />
    </ThemeProvider>,
  );
  return onTestRun;
};
const openRuns = () => fireEvent.click(screen.getByRole('button', { name: 'Runs' }));

describe('ScheduleRunsPanel (EL-7011 US-32, owner CR 2026-10-21)', () => {
  beforeEach(() => mockRuns([olderTest, newestTest]));
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('R3 opens on the Test schedule tab with the Test run button and the note', () => {
    renderPanel();

    expect(screen.getByRole('button', { name: 'Test schedule' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('schedule-test-run')).toBeEnabled();
    expect(screen.getByText(NOTE)).toBeInTheDocument();
  });

  it('R3.3 hides the Test schedule tab without the run action and opens on Runs', () => {
    renderPanel({ schedule: { ...schedule, allowed_actions: ['edit'] } });

    expect(screen.queryByRole('button', { name: 'Test schedule' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('schedule-test-run')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('schedule-run-row')).toHaveLength(2);
    expect(screen.getByText(NOTE)).toBeInTheDocument();
  });

  it('R3.1 Test run calls the form handler and is disabled while the run is pending', () => {
    const onTestRun = renderPanel();
    fireEvent.click(screen.getByTestId('schedule-test-run'));
    expect(onTestRun).toHaveBeenCalledTimes(1);
    cleanup();

    renderPanel({ testRunPending: true });
    expect(screen.getByTestId('schedule-test-run')).toBeDisabled();
  });

  it('R3.5 shows the server reason of a refused run in the banner', () => {
    renderPanel({ testRunError: 'Already running' });
    expect(screen.getByRole('alert')).toHaveTextContent('Already running');
  });

  it('R3 shows the status, reason and output of the newest test run', () => {
    renderPanel();

    expect(screen.getByTestId('schedule-run-status')).toHaveTextContent('Failed');
    expect(screen.getByText('Model unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('run-chat')).toHaveTextContent('71');
  });

  it('R3 says so when the schedule has no test run yet', () => {
    mockRuns([cron]);
    renderPanel();

    expect(screen.getByText('No test runs yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('run-chat')).not.toBeInTheDocument();
  });

  it('R4.1 the Runs tab lists every run of this schedule with the note', () => {
    mockRuns([olderTest, newestTest, cron]);
    renderPanel();
    openRuns();

    expect(screen.getAllByTestId('schedule-run-row')).toHaveLength(3);
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(mocks.useGetScheduleRunsQuery).toHaveBeenCalledWith(
      { projectId: 5, scheduleId: 9, page: 0, pageSize: 100 },
      { skip: false },
    );
  });

  it('R4.3 refreshes every 3 seconds while a run is running, and not otherwise', () => {
    mockRuns([cron]);
    renderPanel();
    expect(pollingOf()).toBe(3000);
    cleanup();

    mockRuns([olderTest]);
    renderPanel();
    expect(pollingOf()).toBe(0);
  });

  it('R4.3 stops polling and shows an error when a poll fails', () => {
    mocks.useGetScheduleRunsQuery.mockReturnValue({
      currentData: { rows: [cron] },
      isError: true,
      error: { status: 500 },
    });
    renderPanel();

    expect(pollingOf()).toBe(0);
    expect(mocks.toastError).toHaveBeenCalledWith('boom');
  });
});
