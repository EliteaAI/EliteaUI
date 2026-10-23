// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import ScheduleRunsPanel from '../ScheduleRunsPanel';

// EL-7011 US-32 R3, US-41, owner CR 2026-10-21 test panel log: the one live Test schedule panel

const mocks = vi.hoisted(() => ({
  useScheduleRun: vi.fn(),
  conversation: {},
  decide: vi.fn(),
}));

vi.mock('../../lib/hooks/useScheduleRuns.hooks', () => ({
  useScheduleRun: mocks.useScheduleRun,
  useScheduleRunConversation: () => mocks.conversation,
}));
vi.mock('../../lib/hooks/useWaitingRunDecision.hooks', () => ({ useWaitingRunDecision: () => mocks.decide }));
vi.mock('react-redux', async importOriginal => ({ ...(await importOriginal()), useDispatch: () => vi.fn() }));

const INFO =
  "A test run uses the same account, tools and risk check as a scheduled run. It shows the log here and is marked as 'test'.";
const NOTE = 'A test never changes Last run or Next run.';
const schedule = {
  id: 9,
  created_by: 1,
  version_id: 4,
  prompt: 'Summarize {{region}}',
  variables: [{ name: 'region', value: 'EMEA' }],
  allowed_actions: ['edit', 'run'],
};
const olderTest = { id: 1, trigger: 'test', status: 'success', started_at: '2026-10-21T08:00:00Z' };
const newestTest = { id: 2, trigger: 'test', status: 'running', started_at: '2026-10-21T10:42:00Z' };
const cron = {
  id: 3,
  trigger: 'cron',
  status: 'success',
  conversation_id: 72,
  started_at: '2026-10-21T09:00:00Z',
};
const event = (kind, text, second = 1) => ({
  at: `2026-10-21T10:42:${String(second).padStart(2, '0')}Z`,
  kind,
  text,
});
const STARTED = event('started', 'Test run started · trigger: test · version v3');
const PAUSED = event('paused', 'Paused: Teams · post_message needs approval', 19);
const FINISHED = event('finished', 'Run finished', 39);

const theme = createTheme(getDesignTokens('dark'));
const mockDetail = (run, extra = {}) =>
  mocks.useScheduleRun.mockReturnValue({ run, refetch: vi.fn(), ...extra });
const renderPanel = (props = {}) => {
  const handlers = { onTestRun: vi.fn(), onRunHistory: vi.fn(), onBackToTest: vi.fn() };
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <ScheduleRunsPanel
          schedule={schedule}
          runs={[olderTest, newestTest, cron]}
          versionNames={{ 4: 'v3' }}
          testRunPending={false}
          testRunError=""
          {...handlers}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );
  return handlers;
};
const logLines = () => screen.queryAllByTestId('schedule-run-log-line').map(line => line.textContent);
const runTest = () => screen.queryByRole('button', { name: 'Run test' });

describe('ScheduleRunsPanel EL-7011 owner CR 2026-10-21 test panel log', () => {
  beforeEach(() => {
    mocks.conversation = {};
    mockDetail({ ...newestTest, events: [STARTED] });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('has the Test schedule header and Run History, and no tab switch', () => {
    const { onRunHistory } = renderPanel();

    expect(screen.getByRole('heading', { name: 'Test schedule' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Runs' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /run history/i }));
    expect(onRunHistory).toHaveBeenCalledTimes(1);
  });

  // CR-21 option A: the info box shows only before the first test run; after it the "i" button holds it
  it('CR-21 shows the info box with the note before the first test run, and no "i" button', () => {
    mockDetail(undefined);
    renderPanel({ runs: [cron] });

    expect(screen.getByText(INFO)).toBeInTheDocument();
    // the visible note in the info box, and the screen-reader description of Run test
    expect(screen.getAllByText(NOTE)).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'About test runs' })).not.toBeInTheDocument();
  });

  it('CR-21 hides the info box after the first test run and shows the info and the note in the "i" tooltip', async () => {
    renderPanel();

    expect(screen.queryByText(INFO)).not.toBeInTheDocument();
    // only the screen-reader description of Run test is left
    expect(screen.getAllByText(NOTE)).toHaveLength(1);
    fireEvent.mouseOver(screen.getByRole('button', { name: 'About test runs' }));
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(INFO);
    expect(tooltip).toHaveTextContent(NOTE);
  });

  it('CR-21 draws the "i" icon in the info colour of the theme', () => {
    renderPanel();

    // BaseBtn tertiary fills the icon path with this variable
    const button = screen.getByRole('button', { name: 'About test runs' });
    expect(getComputedStyle(button).getPropertyValue('--btn-icon-fill').trim()).toBe(theme.palette.icon.info);
  });

  it('CR-21 reads the note with Run test', () => {
    mockDetail({ ...olderTest, events: [STARTED, FINISHED] });
    renderPanel({ runs: [olderTest] });

    expect(runTest()).toHaveAccessibleDescription(NOTE);
  });

  it('follows the newest test run of the schedule and streams its log', () => {
    renderPanel();

    expect(mocks.useScheduleRun).toHaveBeenCalledWith(9, 2);
    expect(logLines()).toEqual([expect.stringContaining(STARTED.text)]);
    expect(screen.getByTestId('schedule-run-log-status')).toHaveTextContent('Running');
    expect(screen.queryByTestId('schedule-run-result')).not.toBeInTheDocument();
  });

  it('Run test calls the form handler; it is disabled with the note while a test runs', () => {
    const { onTestRun } = renderPanel();
    expect(runTest()).toBeDisabled();
    expect(screen.getByText('A test is running.')).toBeInTheDocument();
    cleanup();

    mockDetail({ ...olderTest, events: [STARTED, FINISHED] });
    const handlers = renderPanel({ runs: [olderTest] });
    expect(runTest()).toBeEnabled();
    fireEvent.click(runTest());
    expect(handlers.onTestRun).toHaveBeenCalledTimes(1);
    expect(onTestRun).not.toHaveBeenCalled();
  });

  it('shows the prompt box with the version and variable chips', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Show the full prompt' }));

    expect(screen.getByText('Prompt from the schedule')).toBeInTheDocument();
    expect(screen.getAllByTestId('schedule-prompt-chip').map(chip => chip.textContent)).toEqual([
      'v3',
      'region = EMEA',
    ]);
  });

  it('says No test runs yet. before the first test and keeps Run test enabled', () => {
    mockDetail(undefined);
    renderPanel({ runs: [cron] });

    expect(mocks.useScheduleRun).toHaveBeenCalledWith(9, undefined);
    expect(screen.getByText('No test runs yet.')).toBeInTheDocument();
    expect(runTest()).toBeEnabled();
  });

  it('says Starting test run... and disables Run test while the run starts', () => {
    mockDetail(undefined);
    renderPanel({ runs: [cron], testRunPending: true });

    expect(screen.getByText('Starting test run...')).toBeInTheDocument();
    expect(runTest()).toBeDisabled();
  });

  it('shows the result card with the answer when the run is final', () => {
    mocks.conversation = { answer: 'Three open pull requests' };
    mockDetail({
      ...olderTest,
      conversation_id: 70,
      summary: { duration_ms: 38_000, tokens: 2140, cost_usd: 0.03 },
      events: [STARTED, FINISHED],
    });
    renderPanel({ runs: [olderTest] });

    const result = screen.getByTestId('schedule-run-result');
    expect(result).toHaveTextContent('38 s · 2,140 tokens · $0.03');
    expect(result).toHaveTextContent('Three open pull requests');
    // CR-25: no conversation link on the card
    expect(screen.queryByText('Open conversation')).not.toBeInTheDocument();
  });

  it('US-41 puts Approve and Reject under the paused line of a waiting test', () => {
    mocks.conversation = { conversationUuid: 'conv-uuid', pausedMessageId: 'msg-7' };
    mockDetail({
      ...newestTest,
      status: 'waiting_for_approval',
      conversation_id: 71,
      events: [STARTED, PAUSED],
    });
    renderPanel();

    const [, pausedLine] = screen.getAllByTestId('schedule-run-log-line');
    const actions = pausedLine.nextElementSibling;
    expect(within(actions).getByRole('button', { name: 'Approve' })).toBeEnabled();
    expect(within(actions).getByRole('button', { name: 'Reject' })).toBeEnabled();
    expect(screen.getByTestId('schedule-run-log-status')).toHaveTextContent(/Waiting/);
    expect(runTest()).toBeDisabled();

    fireEvent.click(within(actions).getByRole('button', { name: 'Approve' }));
    expect(mocks.decide).toHaveBeenCalledWith({
      action: 'approve',
      conversationUuid: 'conv-uuid',
      messageId: 'msg-7',
    });
  });

  it('shows a run opened from the Runs table, without the info and prompt boxes, with Back to test', () => {
    mockDetail({ ...cron, events: [event('started', 'Run started · trigger: cron')] });
    const { onBackToTest } = renderPanel({ viewedRun: cron });

    expect(mocks.useScheduleRun).toHaveBeenCalledWith(9, 3);
    expect(screen.getByRole('heading')).toHaveTextContent(/^Run \d{1,2} Oct \d{2}:\d{2} · cron$/);
    expect(screen.queryByText(INFO)).not.toBeInTheDocument();
    expect(screen.queryByText('Prompt from the schedule')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to test' }));
    expect(onBackToTest).toHaveBeenCalledTimes(1);
  });

  it('R3.3 shows only the log and the result without the run permission', () => {
    renderPanel({ schedule: { ...schedule, allowed_actions: ['edit'] } });

    expect(runTest()).not.toBeInTheDocument();
    expect(screen.queryByText('Prompt from the schedule')).not.toBeInTheDocument();
    expect(logLines()).toHaveLength(1);
  });

  it('keeps the last log lines on a load error and offers Retry', () => {
    const refetch = vi.fn();
    mockDetail({ ...newestTest, events: [STARTED] }, { isError: true, refetch });
    renderPanel();

    expect(logLines()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('R3.5 shows the server reason of a refused run', () => {
    renderPanel({ testRunError: 'A run of this schedule is active' });
    expect(screen.getByText('A run of this schedule is active')).toBeInTheDocument();
  });

  it('CR-21 scrolls the body (log, result) inside the card and pins the prompt line with Run test', () => {
    mockDetail({ ...newestTest, events: [STARTED] });
    renderPanel();
    const body = screen.getByTestId('schedule-runs-panel-body');
    const footer = screen.getByTestId('schedule-runs-panel-footer');

    expect(getComputedStyle(body).overflowY).toBe('auto');
    expect(body).toContainElement(screen.getByTestId('schedule-run-log'));
    expect(body).not.toContainElement(runTest());
    expect(footer).toContainElement(runTest());
  });

  it('CR-21 leaves room under the page header for a scroll to the panel header', () => {
    mockDetail(undefined);
    renderPanel();
    expect(getComputedStyle(screen.getByTestId('schedule-runs-panel')).scrollMarginTop).toBe('4.5rem');
  });

  it('CR-21 owner decision: a run without a conversation shows its log and reason, and no conversation link', () => {
    const skipped = {
      id: 8,
      trigger: 'cron',
      status: 'skipped',
      conversation_id: null,
      reason: 'The agent was deleted',
      started_at: '2026-10-21T09:00:00Z',
    };
    mockDetail({ ...skipped, events: [event('started', 'Run skipped before it started')] });
    renderPanel({ viewedRun: skipped });

    expect(mocks.useScheduleRun).toHaveBeenCalledWith(9, 8);
    expect(logLines()).toEqual([expect.stringContaining('Run skipped before it started')]);
    expect(
      within(screen.getByTestId('schedule-run-result')).getByText('The agent was deleted'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Open conversation')).not.toBeInTheDocument();
  });
});
