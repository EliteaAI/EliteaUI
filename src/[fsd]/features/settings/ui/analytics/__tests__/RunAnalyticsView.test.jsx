// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import RunAnalyticsView from '../RunAnalyticsView';
import { AnalyticsTestWrapper, installGlobalStubs } from './_testHelpers';

installGlobalStubs();

const { useProjectAnalyticsQuery } = vi.hoisted(() => ({ useProjectAnalyticsQuery: vi.fn() }));

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  TAG_TYPE_ANALYTICS: 'ANALYTICS',
  analyticsApi: { util: { invalidateTags: tags => ({ type: 'invalidate', tags }) }, endpoints: {} },
  useProjectAnalyticsQuery,
}));

vi.mock('@/[fsd]/features/settings/lib/hooks', () => ({ useRunAnalyticsFetching: () => false }));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 1,
  useSelectedProjectName: () => 'Team',
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  AnalyticsCosts: props => <div data-testid="tab-costs">{JSON.stringify(props.runScope.queryArgs)}</div>,
  AnalyticsTokens: () => <div data-testid="tab-tokens" />,
  AnalyticsTools: () => <div data-testid="tab-tools" />,
  AnalyticsHealth: props => (
    <div
      data-testid="tab-health"
      data-hide-trend={String(props.hideTrend)}
    />
  ),
}));

const EVAL_RUN_SCOPE = {
  queryArgs: { evalRunId: 9 },
  tooltips: { costs: {}, tokens: {} },
  scopeLabel: 'this evaluation run',
  noDataMessage: 'Analytics is unavailable for this evaluation run because tracking data is missing.',
};

const renderView = (props = {}) =>
  render(
    <AnalyticsTestWrapper>
      <RunAnalyticsView
        runScope={EVAL_RUN_SCOPE}
        breadcrumbs={<nav data-testid="breadcrumbs" />}
        infoLines={['Evaluation Run #9 · Suite: Tester', 'Run: 27 Sep 2026, 12:57 PM · Agent version: base']}
        missingRunMessage="No run selected."
        {...props}
      />
    </AnalyticsTestWrapper>,
  );

describe('RunAnalyticsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProjectAnalyticsQuery.mockReturnValue({ data: { health: [] }, isFetching: false, isError: false });
  });

  afterEach(() => cleanup());

  it('shows only the four run tabs, in order, with Costs open by default', () => {
    renderView();

    const tabs = screen.getAllByRole('tab').map(tab => tab.textContent);
    expect(tabs).toEqual(['Costs', 'Tokens', 'Tools', 'Health']);
    expect(screen.getByTestId('tab-costs')).toHaveTextContent('{"evalRunId":9}');
  });

  it('renders the caller breadcrumbs and info lines in place of the date filters', () => {
    renderView();

    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('run-analytics-run-info')).toHaveTextContent(
      'Evaluation Run #9 · Suite: Tester',
    );
    expect(screen.getByTestId('run-analytics-run-info')).toHaveTextContent(
      'Run: 27 Sep 2026, 12:57 PM · Agent version: base',
    );
    expect(screen.queryByTestId('analytics-date-from-input')).not.toBeInTheDocument();
    expect(screen.getByTestId('run-analytics-refresh-button')).toBeInTheDocument();
    expect(screen.getByTestId('run-analytics-export-button')).toBeInTheDocument();
  });

  it('scopes the health request to the run and hides the trend chart', () => {
    useProjectAnalyticsQuery.mockReturnValue({
      data: { health: [{ event_type: 'llm', total: 3 }] },
      isFetching: false,
      isError: false,
    });
    renderView();

    fireEvent.click(screen.getByTestId('run-analytics-tab-health'));

    expect(useProjectAnalyticsQuery).toHaveBeenLastCalledWith(
      { projectId: 1, evalRunId: 9 },
      expect.objectContaining({ skip: false }),
    );
    expect(screen.getByTestId('tab-health')).toHaveAttribute('data-hide-trend', 'true');
  });

  it('shows the run empty state on Health when the run has no health events', () => {
    renderView();

    fireEvent.click(screen.getByTestId('run-analytics-tab-health'));

    expect(screen.getByTestId('run-analytics-health-empty')).toHaveTextContent(EVAL_RUN_SCOPE.noDataMessage);
    expect(screen.queryByTestId('tab-health')).not.toBeInTheDocument();
  });

  it('shows a spinner instead of the stale empty state while Health re-fetches after Refresh', () => {
    useProjectAnalyticsQuery.mockReturnValue({ data: { health: [] }, isFetching: true, isError: false });
    renderView();

    fireEvent.click(screen.getByTestId('run-analytics-tab-health'));

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('run-analytics-health-empty')).not.toBeInTheDocument();
  });

  it('forwards its test id to the page root', () => {
    renderView();

    expect(screen.getByTestId('run-analytics-page')).toContainElement(screen.getByTestId('breadcrumbs'));
  });

  it('shows a spinner instead of the missing-run message while the run is loading', () => {
    renderView({ runScope: null, isRunLoading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('run-analytics-empty')).not.toBeInTheDocument();
  });

  it('shows the missing-run message and fetches nothing without a run scope', () => {
    renderView({ runScope: null });

    expect(screen.getByTestId('run-analytics-empty')).toHaveTextContent('No run selected.');
    expect(screen.queryByTestId('tab-costs')).not.toBeInTheDocument();
    expect(screen.getByTestId('run-analytics-refresh-button')).toBeDisabled();
  });
});
