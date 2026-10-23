// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import UsageSpendChart from '../UsageSpendChart';

afterEach(() => cleanup());

vi.mock('@/[fsd]/features/settings/lib/hooks', () => ({
  useUsageChartData: () => ({
    seriesKeys: ['total'],
    chartData: [],
    mergedChartData: [],
    compChartData: [],
    hasData: false,
  }),
}));

vi.mock('@/[fsd]/shared/config/theme', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, CHART_COLORS: ['#aaa'] };
});
vi.mock('../UsageTooltip', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui/tab-group-button/TabGroupButton', () => ({
  default: props => (
    <div data-testid={props['data-testid']}>
      {(props.arrayBtn || []).map(b => (
        <button key={b.value}>{b.label}</button>
      ))}
    </div>
  ),
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Checkbox: {
    BaseCheckbox: props => (
      <input
        type="checkbox"
        checked={props.checked}
        readOnly
      />
    ),
  },
}));

const theme = createTheme({ palette: lightPalette });

const baseProps = {
  daily: [],
  models: [],
  bySource: [],
  canSeeAmounts: true,
  currency: 'USD',
  periodStart: '2026-10-01',
  periodEnd: '2026-10-31',
  scope: 'project',
};

const renderChart = props =>
  render(
    <ThemeProvider theme={theme}>
      <UsageSpendChart
        {...baseProps}
        {...props}
      />
    </ThemeProvider>,
  );

const getGroupByBar = () => screen.getByTestId('usage-groupby-select');

describe('UsageSpendChart — Member button visibility', () => {
  it('hides Member button when daily rows have no by_member field', () => {
    const daily = [
      { date: '2026-10-01', spend: 10 },
      { date: '2026-10-02', spend: 20 },
    ];

    renderChart({ daily });

    const bar = getGroupByBar();

    expect(bar).not.toHaveTextContent('Member');
  });

  it('shows Member button when at least one daily row has by_member', () => {
    const daily = [
      { date: '2026-10-01', spend: 10 },
      { date: '2026-10-02', spend: 20, by_member: { alice: 20 } },
    ];

    renderChart({ daily });

    const bar = getGroupByBar();

    expect(bar).toHaveTextContent('Member');
  });

  it('hides Member button when scope is "user" even if by_member is present', () => {
    const daily = [{ date: '2026-10-01', spend: 10, by_member: { alice: 10 } }];

    renderChart({ daily, scope: 'user' });

    const bar = getGroupByBar();

    expect(bar).not.toHaveTextContent('Member');
  });

  it('hides Member button when canSeeAmounts is false even if by_member is present', () => {
    const daily = [{ date: '2026-10-01', spend: 10, by_member: { alice: 10 } }];

    renderChart({ daily, canSeeAmounts: false });

    const bar = getGroupByBar();

    expect(bar).not.toHaveTextContent('Member');
  });
});
