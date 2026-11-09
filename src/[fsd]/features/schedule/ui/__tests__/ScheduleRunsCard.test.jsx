// @vitest-environment jsdom
import { createRef } from 'react';

import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ScheduleRunsCard from '../ScheduleRunsCard';

// the Runs card: header buttons, notes, error banner and the list

const mocks = vi.hoisted(() => ({ canRun: true, cardProps: [] }));

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => mocks.canRun }),
}));
vi.mock('../WebhookSampleRunDialog', () => ({
  default: () => <div data-testid="webhook-sample-run-dialog" />,
}));
vi.mock('../ScheduleRunCard', () => ({
  default: props => {
    mocks.cardProps.push(props);
    return (
      <li data-testid="run-card-stub">
        {props.run.id}
        {props.isLatest ? ' latest' : ''}
        {props.expanded ? ' open' : ''}
      </li>
    );
  },
}));

const theme = createTheme(getDesignTokens('light'));
const saved = { id: 9, allowed_actions: ['run'] };
const run = (id, extra = {}) => ({ id, status: 'success', trigger: 'manual', ...extra });

const makeView = (runs = [run(2), run(1)], extra = {}) => ({
  runs,
  total: runs.length,
  versionNames: {},
  expandedRunId: null,
  onExpand: vi.fn(),
  ...extra,
});

const renderCard = (props = {}) => {
  const handlers = { onRunNow: vi.fn(), onTestRun: vi.fn() };
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <ScheduleRunsCard
          schedule={saved}
          entityType="agent"
          applicationId={3}
          view={makeView()}
          {...handlers}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );
  return handlers;
};

describe('ScheduleRunsCard', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.canRun = true;
    mocks.cardProps = [];
  });

  it('shows the count and one card per run, the newest marked as latest', () => {
    renderCard();

    expect(screen.getByTestId('schedule-runs-count')).toHaveTextContent('(2)');
    expect(screen.getAllByTestId('run-card-stub').map(card => card.textContent)).toEqual(['2 latest', '1']);
  });

  it('has no filters for one run, and with several runs filters the cards by type and status', () => {
    renderCard({ view: makeView([run(1)]) });
    expect(screen.queryByTestId('schedule-runs-filter-trigger')).not.toBeInTheDocument();
    cleanup();

    renderCard({ view: makeView([run(3, { trigger: 'cron' }), run(2, { status: 'failed' }), run(1)]) });
    expect(screen.getByTestId('schedule-runs-filter-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-runs-filter-status')).toBeInTheDocument();
    expect(screen.getAllByTestId('run-card-stub')).toHaveLength(3);
  });

  it('says the list is cut and links to Run History when the total exceeds the loaded runs', () => {
    renderCard({ view: makeView([run(2), run(1)], { total: 150 }) });

    expect(screen.getByTestId('schedule-runs-limit-note')).toHaveTextContent(
      'Showing the latest 2 of 150 runs.',
    );
    expect(screen.getByRole('link', { name: 'Open Run History' })).toHaveAttribute(
      'href',
      expect.stringContaining('schedule_id=9'),
    );
  });

  it('shows no limit note when every run is loaded', () => {
    renderCard();

    expect(screen.queryByTestId('schedule-runs-limit-note')).not.toBeInTheDocument();
  });

  it('opens the card that the view names', () => {
    renderCard({ view: makeView(undefined, { expandedRunId: 1 }) });

    expect(screen.getAllByTestId('run-card-stub').map(card => card.textContent)).toEqual([
      '2 latest',
      '1 open',
    ]);
  });

  it('Run Now calls its handler for a saved schedule, which has no Test Run', () => {
    const { onRunNow, onTestRun } = renderCard();

    fireEvent.click(screen.getByTestId('schedule-run-now'));

    expect(onRunNow).toHaveBeenCalledTimes(1);
    expect(onTestRun).not.toHaveBeenCalled();
    expect(screen.queryByTestId('schedule-test-run')).not.toBeInTheDocument();
    expect(screen.getByTestId('schedule-run-now')).toHaveAttribute('title', expect.stringMatching(/Manual/));
  });

  it('stops waiting for a new run when the start fails', async () => {
    const cancelExpectRun = vi.fn();
    const expectRun = vi.fn();
    const onRunNow = vi.fn().mockResolvedValue(false);
    renderCard({ onRunNow, view: makeView(undefined, { expectRun, cancelExpectRun }) });

    fireEvent.click(screen.getByTestId('schedule-run-now'));

    await waitFor(() => expect(cancelExpectRun).toHaveBeenCalledTimes(1));
    expect(expectRun).toHaveBeenCalledTimes(1);
  });

  it('stops waiting for a new run when the start throws', async () => {
    const cancelExpectRun = vi.fn();
    const onRunNow = vi.fn().mockRejectedValue(new Error('boom'));
    renderCard({ onRunNow, view: makeView(undefined, { expectRun: vi.fn(), cancelExpectRun }) });

    fireEvent.click(screen.getByTestId('schedule-run-now'));

    await waitFor(() => expect(cancelExpectRun).toHaveBeenCalledTimes(1));
  });

  it('hands the ref to the card element', () => {
    const ref = createRef();
    renderCard({ ref });

    expect(ref.current).toBe(screen.getByTestId('schedule-runs-card'));
  });

  it('keeps waiting for a new run when the start works', async () => {
    const cancelExpectRun = vi.fn();
    const onRunNow = vi.fn().mockResolvedValue(true);
    renderCard({ onRunNow, view: makeView(undefined, { expectRun: vi.fn(), cancelExpectRun }) });

    fireEvent.click(screen.getByTestId('schedule-run-now'));

    await waitFor(() => expect(onRunNow).toHaveBeenCalled());
    expect(cancelExpectRun).not.toHaveBeenCalled();
  });

  it('shows only Test Run for a new schedule', () => {
    renderCard({ schedule: undefined, view: makeView([]) });

    expect(screen.queryByTestId('schedule-run-now')).not.toBeInTheDocument();
    expect(screen.getByTestId('schedule-test-run')).toBeEnabled();
    expect(screen.getByTestId('schedule-test-run')).not.toHaveAttribute(
      'title',
      expect.stringMatching(/Manual/),
    );
    expect(screen.getByText('No runs yet')).toBeInTheDocument();
  });

  it('disables Run Now while a run is active', () => {
    renderCard({ view: makeView([run(2, { status: 'running' })]) });

    expect(screen.getByTestId('schedule-run-now')).toBeDisabled();
  });

  it('disables Test Run of a new schedule while its test run is active', () => {
    renderCard({ schedule: undefined, view: makeView([run(2, { status: 'running' })]) });

    expect(screen.getByTestId('schedule-test-run')).toBeDisabled();
  });

  it('disables Run Now without the run action', () => {
    renderCard({ schedule: { id: 9, allowed_actions: [] } });

    expect(screen.getByTestId('schedule-run-now')).toBeDisabled();
  });

  it('disables Test Run of a new schedule without the run permission', () => {
    mocks.canRun = false;
    renderCard({ schedule: undefined, view: makeView([]) });

    expect(screen.getByTestId('schedule-test-run')).toBeDisabled();
  });

  it('shows the error of the Run Now and of the Test Run', () => {
    renderCard({ runNowError: 'Run Now failed' });
    expect(screen.getByText('Run Now failed')).toBeInTheDocument();
    cleanup();

    renderCard({ schedule: undefined, view: makeView([]), testRunError: 'Test failed' });
    expect(screen.getByText('Test failed')).toBeInTheDocument();
  });

  // #7456 review: a webhook has no Run Now, so Run again on its failed run opens the sample dialog
  describe('webhook rows', () => {
    const webhook = { id: 19, name: 'On issue', trigger_kind: 'webhook', allowed_actions: ['run'] };

    it('Run again opens the sample dialog and never calls Run Now', () => {
      const { onRunNow } = renderCard({
        schedule: webhook,
        view: makeView([run(1, { status: 'failed', trigger: 'webhook' })]),
      });
      const { onRunAgain } = mocks.cardProps.at(-1);
      expect(onRunAgain).toBeTypeOf('function');
      act(() => onRunAgain());
      expect(screen.getByTestId('webhook-sample-run-dialog')).toBeInTheDocument();
      expect(onRunNow).not.toHaveBeenCalled();
    });

    it('has no Run again for a webhook the caller cannot run', () => {
      renderCard({
        schedule: { ...webhook, allowed_actions: [] },
        view: makeView([run(1, { status: 'failed' })]),
      });
      expect(mocks.cardProps.at(-1).onRunAgain).toBeUndefined();
    });
  });
});
