// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import SuiteRunEstimate from '../SuiteRunEstimate';

const queryState = vi.hoisted(() => ({ data: undefined, args: null }));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 1 }));
vi.mock('../../../api/evaluationApi', () => ({
  useEvalSuiteEstimateQuery: (args, options) => {
    queryState.args = { args, options };
    return { data: options.skip ? undefined : queryState.data };
  },
}));

const theme = createTheme({ palette: lightPalette });

const renderEstimate = (props = { suiteId: 48, versionId: 32 }) =>
  render(
    <ThemeProvider theme={theme}>
      <SuiteRunEstimate {...props} />
    </ThemeProvider>,
  );

describe('SuiteRunEstimate', () => {
  afterEach(() => {
    cleanup();
    queryState.data = undefined;
  });

  it('asks for the selected version and shows the estimate with the remaining budget', () => {
    queryState.data = {
      available: true,
      history_run_id: 149,
      estimate: {
        cases: 2,
        includes_judge: true,
        tokens: { low: 100, expected: 150, high: 200 },
        cost: { low: 1, expected: 1.5, high: 2 },
        unpriced_cases: 0,
      },
      budget: { scope: 'project', remaining: 1 },
      exceeds_budget: true,
    };
    renderEstimate();

    expect(queryState.args.args).toEqual({ projectId: 1, suiteId: 48, versionId: 32 });
    expect(screen.getByTestId('evaluation-run-estimate-value')).toHaveTextContent(
      'Estimated $1.50 · Range $1.00–$2.00',
    );
    expect(screen.getByTestId('evaluation-run-estimate-budget')).toHaveTextContent(
      'Remaining project budget: $1.00',
    );
    expect(screen.getByTestId('evaluation-run-estimate-warning')).toBeInTheDocument();
  });

  it('shows the no-estimate state without a finished run', () => {
    queryState.data = { available: false, estimate: null, budget: null };
    renderEstimate();

    expect(screen.getByTestId('evaluation-run-estimate-none')).toHaveTextContent('No estimate (first run)');
    expect(screen.queryByTestId('evaluation-run-estimate-warning')).not.toBeInTheDocument();
  });

  it('waits for a version before asking', () => {
    renderEstimate({ suiteId: 48, versionId: null });

    expect(queryState.args.options.skip).toBe(true);
    expect(screen.queryByTestId('evaluation-run-estimate')).not.toBeInTheDocument();
  });
});
