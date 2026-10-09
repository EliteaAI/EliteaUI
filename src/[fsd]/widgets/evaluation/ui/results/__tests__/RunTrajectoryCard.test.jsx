// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RunTrajectoryCard from '../RunTrajectoryCard';

const theme = createTheme({ palette: lightPalette });

const renderCard = rollup =>
  render(
    <ThemeProvider theme={theme}>
      <RunTrajectoryCard rollup={rollup} />
    </ThemeProvider>,
  );

describe('RunTrajectoryCard', () => {
  afterEach(cleanup);

  it('renders nothing for a run that predates the rollup', () => {
    renderCard(undefined);

    expect(screen.queryByTestId('evaluation-run-trajectory')).not.toBeInTheDocument();
  });

  it('shows the averages and the cases left out of them', () => {
    renderCard({
      cases: 3,
      recorded_cases: 2,
      averages: { llm_calls: 2, tool_calls: 1 },
      step_limit_hits: 0,
      excluded_cases: { count: 1, budget_blocked: 1 },
    });

    expect(screen.getByText('Averaged over 2 of 3 cases')).toBeInTheDocument();
    expect(screen.getByText('LLM calls / case')).toBeInTheDocument();
    expect(screen.getByTestId('evaluation-trajectory-excluded')).toHaveTextContent(
      '1 case not recorded (1 blocked by budget)',
    );
  });

  it('has no excluded note when every case was recorded', () => {
    renderCard({ cases: 2, recorded_cases: 2, averages: { llm_calls: 1 }, excluded_cases: { count: 0 } });

    expect(screen.queryByTestId('evaluation-trajectory-excluded')).not.toBeInTheDocument();
  });
});
