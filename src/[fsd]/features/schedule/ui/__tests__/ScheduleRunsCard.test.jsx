// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRunsCard from '../ScheduleRunsCard';

// the Runs card: header buttons, notes, error banner, filters and the list

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
vi.mock('../ScheduleRunsFilters', () => ({ default: () => <div data-testid="filters-stub" /> }));

const theme = createTheme(getDesignTokens('light'));
const saved = { id: 9, allowed_actions: ['run'] };
const run = (id, extra = {}) => ({ id, status: 'success', trigger: 'manual', ...extra });

const makeView = (runs = [run(2), run(1)], extra = {}) => ({
  runs,
  shownRuns: runs,
  total: runs.length,
  versionNames: {},
  expandedRunId: null,
  onExpand: vi.fn(),
  filters: { trigger: '', status: '' },
  statusOptions: [],
  onFilterChange: vi.fn(),
  onClearFilters: vi.fn(),
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

  it('opens the card that the view names', () => {
    renderCard({ view: makeView(undefined, { expandedRunId: 1 }) });

    expect(screen.getAllByTestId('run-card-stub').map(card => card.textContent)).toEqual([
      '2 latest',
      '1 open',
    ]);
  });

  it('Run Now and Test Run call their handlers for a saved schedule', () => {
    const { onRunNow, onTestRun } = renderCard();

    fireEvent.click(screen.getByTestId('schedule-run-now'));
    fireEvent.click(screen.getByTestId('schedule-test-run'));

    expect(onRunNow).toHaveBeenCalledTimes(1);
    expect(onTestRun).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('schedule-runs-note')).toHaveTextContent(/recorded as Manual/);
  });

  it('shows only Test Run for a new schedule', () => {
    renderCard({ schedule: undefined, view: makeView([]) });

    expect(screen.queryByTestId('schedule-run-now')).not.toBeInTheDocument();
    expect(screen.getByTestId('schedule-test-run')).toBeEnabled();
    expect(screen.getByTestId('schedule-runs-note')).not.toHaveTextContent(/Manual/);
    expect(screen.getByText('No runs yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('filters-stub')).not.toBeInTheDocument();
  });

  it('disables both buttons while a run is active', () => {
    renderCard({ view: makeView([run(2, { status: 'running' })]) });

    expect(screen.getByTestId('schedule-run-now')).toBeDisabled();
    expect(screen.getByTestId('schedule-test-run')).toBeDisabled();
  });

  it('disables Run Now without the run action and Test Run without the run permission', () => {
    mocks.canRun = false;
    renderCard({ schedule: { id: 9, allowed_actions: [] } });

    expect(screen.getByTestId('schedule-run-now')).toBeDisabled();
    expect(screen.getByTestId('schedule-test-run')).toBeDisabled();
  });

  it('shows the error of the Run Now and of the Test Run', () => {
    renderCard({ runNowError: 'Run Now failed' });
    expect(screen.getByText('Run Now failed')).toBeInTheDocument();
    cleanup();

    renderCard({ testRunError: 'Test failed' });
    expect(screen.getByText('Test failed')).toBeInTheDocument();
  });

  it('says so when the filters match no run', () => {
    renderCard({ view: makeView(undefined, { shownRuns: [] }) });

    expect(screen.getByText('No runs match the filters.')).toBeInTheDocument();
    expect(screen.getByTestId('filters-stub')).toBeInTheDocument();
  });
});
