// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRunsCard from '../ScheduleRunsCard';

// the Runs card: header buttons, notes, error banner and the list

const mocks = vi.hoisted(() => ({ canRun: true, cardProps: [] }));

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => mocks.canRun }),
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
    <ThemeProvider theme={theme}>
      <ScheduleRunsCard
        schedule={saved}
        entityType="agent"
        applicationId={3}
        view={makeView()}
        {...handlers}
        {...props}
      />
    </ThemeProvider>,
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
});
