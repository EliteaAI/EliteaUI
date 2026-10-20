// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ResultsSummaryCards from '../ResultsSummaryCards';
import RunEfficiencyStrip from '../RunEfficiencyStrip';

const theme = createTheme({ palette: lightPalette });

const withTheme = node => render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);

describe('RunEfficiencyStrip', () => {
  afterEach(cleanup);

  it('renders nothing for a run that predates the rollups', () => {
    withTheme(<RunEfficiencyStrip meta={{}} />);

    expect(screen.queryByTestId('evaluation-run-efficiency')).not.toBeInTheDocument();
  });

  it('shows the figures, an estimate chip and the judge apart', () => {
    withTheme(
      <RunEfficiencyStrip
        meta={{
          trajectory_rollup: {
            cases: 2,
            recorded_cases: 1,
            timed_out_cases: 1,
            p50_latency_ms: 900,
            p95_latency_ms: 2500,
          },
          agent_usage: {
            cases: 2,
            recorded_cases: 2,
            totals: { input_tokens: 10 },
            token_source: 'estimate',
          },
          judge_usage: { recorded_cases: 2, totals: { input_tokens: 5 }, cost: 0.5 },
        }}
      />,
    );

    expect(screen.getByText('900 ms / 2.5 s')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 cases')).toBeInTheDocument();
    expect(screen.getByTestId('evaluation-efficiency-estimate')).toBeInTheDocument();
    expect(screen.getByTestId('evaluation-efficiency-judge')).toHaveTextContent(
      'Evaluation overhead: judge $0.5000',
    );
  });
});

describe('ResultsSummaryCards — timeouts next to the headline', () => {
  afterEach(cleanup);

  it('flags timed-out cases and the partial coverage', () => {
    withTheme(
      <ResultsSummaryCards
        totalScore={80}
        cases={2}
        timeoutNote={{ message: '1 of 2 cases timed out at 10 s. Scores cover the other 1 case: …' }}
      />,
    );

    expect(screen.getByTestId('evaluation-summary-timeouts')).toHaveTextContent(
      '1 of 2 cases timed out at 10 s',
    );
  });

  it('says nothing without timeouts', () => {
    withTheme(
      <ResultsSummaryCards
        totalScore={80}
        cases={2}
      />,
    );

    expect(screen.queryByTestId('evaluation-summary-timeouts')).not.toBeInTheDocument();
  });
});
