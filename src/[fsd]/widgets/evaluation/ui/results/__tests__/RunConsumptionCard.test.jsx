// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import RunConsumptionCard from '../RunConsumptionCard';

const theme = createTheme({ palette: lightPalette });

const renderCard = meta =>
  render(
    <ThemeProvider theme={theme}>
      <RunConsumptionCard meta={meta} />
    </ThemeProvider>,
  );

const usage = (overrides = {}) => ({
  cases: 4,
  recorded_cases: 4,
  totals: { input_tokens: 1200, output_tokens: 300, reasoning_tokens: 0 },
  cost: 0.0123,
  unpriced_cases: 0,
  ...overrides,
});

describe('RunConsumptionCard', () => {
  afterEach(cleanup);

  it('renders nothing for a run that predates usage recording', () => {
    renderCard({});

    expect(screen.queryByTestId('evaluation-run-consumption')).not.toBeInTheDocument();
  });

  it('shows agent and judge figures with their coverage', () => {
    renderCard({
      agent_usage: usage(),
      judge_usage: usage({ recorded_cases: 3, cost: null, unpriced_cases: 3 }),
    });

    const agent = within(screen.getByTestId('evaluation-consumption-agent'));
    expect(agent.getByText('1,500')).toBeInTheDocument();
    expect(agent.getByText('$0.0123')).toBeInTheDocument();

    const judge = within(screen.getByTestId('evaluation-consumption-judge'));
    expect(judge.getByText('Not priced')).toBeInTheDocument();
    expect(
      judge.getByText(
        '3 of 4 cases recorded · 3 cases not priced · all AI dimensions together, not split per dimension',
      ),
    ).toBeInTheDocument();
  });

  it('shows each budget limit with its verdict', () => {
    renderCard({
      agent_usage: usage(),
      budget_verdict: {
        verdict: 'breached',
        per_case: {
          tokens: { limit: 500, cases: 4, breached_cases: 1, unknown_cases: 0, verdict: 'breached' },
        },
        per_run: { cost: { limit: 1, value: 0.5, verdict: 'pass' } },
      },
    });

    const perCase = within(screen.getByTestId('evaluation-budget-per_case.tokens'));
    expect(perCase.getByText('500 tokens · 1 of 4 cases over')).toBeInTheDocument();
    expect(perCase.getByText('Over limit')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('evaluation-budget-per_run.cost')).getByText('Within limit'),
    ).toBeInTheDocument();
  });

  it('labels where the figures come from', () => {
    renderCard({ agent_usage: usage(), settlement: { state: 'unavailable', reason: 'ledger_unreadable' } });

    expect(screen.getByTestId('evaluation-settlement-unavailable')).toHaveTextContent('Runtime figures');
  });
});
