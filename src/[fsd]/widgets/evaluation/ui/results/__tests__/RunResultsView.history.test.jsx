// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RunResultsView from '../RunResultsView';

const RUN_ID = 41;

vi.mock('../../../api', () => ({
  useEvalRunResultsQuery: () => ({
    data: { run: { id: RUN_ID }, results: [], human_scores: [], headline_score: 80 },
    isLoading: false,
    isError: false,
  }),
  useEvalCaseExecutionsQuery: () => ({ data: undefined }),
  useEvalRunCompareQuery: () => ({ data: undefined }),
  useEvalDimensionsQuery: () => ({ data: [], isLoading: false }),
  usePlatformDimensionCatalogQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 4 }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => false }) }));

// The cards below the summary read their own data; only the summary section is under test here.
vi.mock('../CaseResultsList', () => ({ default: () => null }));
vi.mock('../ResultsDimensionTable', () => ({ default: () => null }));
vi.mock('../RunEfficiencyStrip', () => ({ default: () => null }));
vi.mock('../RunPerformanceDiff', () => ({ default: () => null }));
vi.mock('../RunConsumptionCard', () => ({ default: () => null }));
vi.mock('../RunTrajectoryCard', () => ({ default: () => null }));
vi.mock('../CaseDetailsModal', () => ({ default: () => null }));
vi.mock('../HumanEvaluationModal', () => ({ default: () => null }));

const theme = createTheme({ palette: lightPalette });

const HISTORY_META = { history: { sampled: 12, conversations: 5, window_days: 28, reference_free: true } };

const renderView = run =>
  render(
    <ThemeProvider theme={theme}>
      <RunResultsView
        run={{ id: RUN_ID, status: 'finished', headline_score: 80, progress: { done: 0, total: 0 }, ...run }}
        applicationId={5}
      />
    </ThemeProvider>,
  );

describe('RunResultsView history note', () => {
  afterEach(cleanup);

  it('says a history run was scored from stored chat turns', () => {
    renderView({ trigger_type: 'history', meta: HISTORY_META });

    const note = screen.getByTestId('evaluation-run-history-note');
    expect(note).toHaveTextContent('Scored from stored chat turns, without running the agent');
    expect(note).toHaveTextContent('12 turns · 5 chats · 28 days');
    expect(note).toHaveTextContent('reference-based checks are skipped');
  });

  it('shows no note for a run that executed the agent', () => {
    renderView({ trigger_type: 'scheduled', meta: HISTORY_META });

    expect(screen.getByTestId('evaluation-run-results')).toBeInTheDocument();
    expect(screen.queryByTestId('evaluation-run-history-note')).not.toBeInTheDocument();
  });
});
