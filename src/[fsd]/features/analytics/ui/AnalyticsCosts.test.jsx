// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { useAnalyticsCostsQuery } from '@/api';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AnalyticsCosts from './AnalyticsCosts';

vi.mock('@/api', () => ({
  useAnalyticsCostsQuery: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  // Surface the series so tests can assert the chart actually rendered with data
  // (via the Bar's dataKey) rather than only checking the static section title.
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ dataKey, name }) => (
    <div
      data-testid={`bar-${dataKey}`}
      data-name={name}
    />
  ),
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

vi.mock('@/[fsd]/features/analytics/lib/constants', () => ({
  AnalyticsCommonConstants: {
    CHART_COLORS: ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#9C27B0'],
    TOP_LIST_SIZE: 10,
    MODEL_CHART_SIZE: 15,
  },
}));

vi.mock('@/[fsd]/features/analytics/lib/helpers', () => ({
  AnalyticCommonHelpers: {
    fmtCost: v => `$${v ?? 0}`,
    fmtNum: v => String(v ?? 0),
  },
}));

vi.mock('@/[fsd]/features/analytics/ui', () => ({
  ChartTooltip: () => null,
  KPICard: ({ label, value }) => <div data-testid={`kpi-${label}`}>{value}</div>,
}));

const theme = createTheme();
const Wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;

const MOCK_DATA = {
  kpis: {
    total_cost: 42.56,
    total_tokens: 1250000,
    total_input_tokens: 800000,
    total_output_tokens: 450000,
    avg_cost_per_call: 0.0085,
  },
  by_model: [
    {
      model_name: 'gpt-4o',
      display_name: 'GPT-4o',
      calls: 2000,
      input_tokens: 500000,
      output_tokens: 300000,
      total_cost: 25.0,
    },
    {
      model_name: 'claude-3-5-sonnet',
      display_name: 'Claude 3.5 Sonnet',
      calls: 1500,
      input_tokens: 300000,
      output_tokens: 150000,
      total_cost: 17.56,
    },
  ],
  by_agent: [{ entity_id: 1, entity_name: 'Code Review Bot', total_cost: 10.5, total_tokens: 500000 }],
  by_user: [{ user_id: 42, user_email: 'alice@example.com', total_cost: 8.2, total_tokens: 400000 }],
  daily: [{ date: '2026-01-15', total_cost: 5.0, total_tokens: 250000 }],
};

describe('AnalyticsCosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading state with CircularProgress', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: undefined, isFetching: true, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('renders error state with message', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: undefined, isFetching: false, isError: true });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Failed to load cost analytics. Please try again later.')).toBeTruthy();
  });

  it('renders all KPI cards with data', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: MOCK_DATA, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('kpi-TOTAL COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-TOTAL TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-INPUT TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-OUTPUT TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-AVG COST / CALL')).toBeTruthy();
  });

  it('renders the model breakdown bar chart with a human-readable series name', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: MOCK_DATA, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Cost by Model')).toBeTruthy();
    // Bar for the model chart uses dataKey="cost" and must carry a readable name
    // so the tooltip doesn't leak the raw field name.
    const bar = screen.getByTestId('bar-cost');
    expect(bar).toBeTruthy();
    expect(bar).toHaveAttribute('data-name', 'Cost');
  });

  it('renders the daily cost trend bar chart with a human-readable series name', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: MOCK_DATA, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Daily Cost Trend')).toBeTruthy();
    const bar = screen.getByTestId('bar-total_cost');
    expect(bar).toBeTruthy();
    expect(bar).toHaveAttribute('data-name', 'Cost');
  });

  it('does not render the charts when their series are empty', () => {
    const noChartData = { ...MOCK_DATA, by_model: [], daily: [] };
    useAnalyticsCostsQuery.mockReturnValue({ data: noChartData, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByTestId('bar-cost')).toBeNull();
    expect(screen.queryByTestId('bar-total_cost')).toBeNull();
  });

  it('renders cost by agent list with entity names', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: MOCK_DATA, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Code Review Bot')).toBeTruthy();
  });

  it('renders cost by user list with emails', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: MOCK_DATA, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('alice@example.com')).toBeTruthy();
  });

  it('renders No data when lists are empty', () => {
    const emptyData = {
      kpis: {
        total_cost: 0,
        total_tokens: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
        avg_cost_per_call: 0,
      },
      by_model: [],
      by_agent: [],
      by_user: [],
      daily: [],
    };
    useAnalyticsCostsQuery.mockReturnValue({ data: emptyData, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    // All four sections (model chart, daily chart, by-agent list, by-user list)
    // fall back to "No data" when their series are empty.
    expect(screen.getAllByText('No data')).toHaveLength(4);
  });

  it('returns null when data is undefined and not fetching', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: undefined, isFetching: false, isError: false });
    const { container } = render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(container.firstChild).toBeNull();
  });
});
