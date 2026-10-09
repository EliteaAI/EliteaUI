// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import EvaluationRunRow from '../EvaluationRunRow';

vi.mock('../RunHistoryActionsMenu', () => ({ default: () => null }));

const theme = createTheme({ palette: lightPalette });

const renderRow = run =>
  render(
    <ThemeProvider theme={theme}>
      <EvaluationRunRow
        run={{ id: 7, status: 'cancelled', created_at: '2026-10-06T10:00:00Z', ...run }}
        suiteName="Suite"
      />
    </ThemeProvider>,
  );

describe('EvaluationRunRow stop indicator', () => {
  afterEach(cleanup);

  it('says why a run stopped early', () => {
    renderRow({ meta: { stop_reason: 'gate_closed', stop_scope: 'member' } });

    expect(screen.getByTestId('evaluation-run-stop-7')).toHaveAttribute(
      'aria-label',
      'Your monthly budget used up',
    );
  });

  it('shows nothing for a run that ran to the end', () => {
    renderRow({ status: 'completed', meta: {} });

    expect(screen.queryByTestId('evaluation-run-stop-7')).not.toBeInTheDocument();
    expect(screen.queryByTestId('evaluation-run-over-budget-7')).not.toBeInTheDocument();
  });

  it('flags a run that went over a suite limit', () => {
    renderRow({
      status: 'completed',
      meta: {
        budget_verdict: {
          verdict: 'breached',
          per_run: { tokens: { limit: 500, value: 1377, verdict: 'breached', on_breach: 'report' } },
        },
      },
    });

    expect(screen.getByTestId('evaluation-run-over-budget-7')).toHaveTextContent('Over budget');
    expect(screen.queryByTestId('evaluation-run-stop-7')).not.toBeInTheDocument();
  });
});

describe('EvaluationRunRow usage and trajectory cells', () => {
  afterEach(cleanup);

  it('shows tokens and steps per case from the run rollups', () => {
    renderRow({
      status: 'completed',
      meta: {
        agent_usage: { cases: 2, recorded_cases: 2, averages: { input_tokens: 1857.5, output_tokens: 63.5 } },
        trajectory_rollup: {
          cases: 2,
          recorded_cases: 2,
          averages: { llm_calls: 1, tool_calls: 0.5 },
          totals: {},
        },
      },
    });

    expect(screen.getByTestId('evaluation-run-tokens-7')).toHaveTextContent('1,921');
    expect(screen.getByTestId('evaluation-run-steps-7')).toHaveTextContent('1.5');
  });

  it('dashes a run that predates the rollups', () => {
    renderRow({ status: 'completed', meta: {} });

    expect(screen.getByTestId('evaluation-run-tokens-7')).toHaveTextContent('—');
    expect(screen.getByTestId('evaluation-run-steps-7')).toHaveTextContent('—');
  });
});
