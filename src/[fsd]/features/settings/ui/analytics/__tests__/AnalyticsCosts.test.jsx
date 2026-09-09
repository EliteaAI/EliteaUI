// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsCostsQuery } from '@/api';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AnalyticsCosts from '../AnalyticsCosts';
import { AnalyticsTestWrapper as Wrapper } from '../_testHelpers';

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

vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  AnalyticCommonHelpers: {
    fmtCost: v => `$${v ?? 0}`,
    fmtNum: v => String(v ?? 0),
    axisTick: stroke => ({ fill: stroke, fontSize: 11 }),
  },
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  ChartTooltip: () => null,
  InfoBanner: ({ children }) => <div data-testid="info-banner">{children}</div>,
  infoBannerTextSx: {},
  KPICard: ({ label, value, subtitle }) => (
    <div data-testid={`kpi-${label}`}>
      <span>{value}</span>
      {subtitle && <span data-testid={`kpi-${label}-subtitle`}>{subtitle}</span>}
    </div>
  ),
}));

const MOCK_DATA = {
  kpis: {
    total_cost: 42.56,
    total_input_cost: 20.0,
    total_output_cost: 22.0,
    total_cache_read_cost: 0.5,
    total_cache_creation_cost: 0.06,
    total_tokens: 1250000,
    total_input_tokens: 800000,
    total_output_tokens: 450000,
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
  by_agent: [
    {
      entity_id: 1,
      entity_name: 'Code Review Bot',
      total_cost: 10.5,
      total_tokens: 500000,
      calls: 42,
      avg_cost: 0.25,
    },
  ],
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
    expect(screen.getByTestId('kpi-INPUT TOKEN COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-OUTPUT TOKEN COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-CACHE READ COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-CACHE WRITE COST')).toBeTruthy();
  });

  it('renders the model breakdown as a table of display names and shares', () => {
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
    // display_name wins over the raw model_name so the table stays readable
    expect(screen.getByText('GPT-4o')).toBeTruthy();
    expect(screen.getByText('Claude 3.5 Sonnet')).toBeTruthy();
    // 25.00 and 17.56 of a 42.56 total
    expect(screen.getByText('58.7%')).toBeTruthy();
    expect(screen.getByText('41.3%')).toBeTruthy();
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
    expect(bar).toHaveAttribute('data-name', 'Total Cost');
  });

  it('does not render the daily chart when its series is empty', () => {
    const noChartData = { ...MOCK_DATA, daily: [] };
    useAnalyticsCostsQuery.mockReturnValue({ data: noChartData, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByTestId('bar-total_cost')).toBeNull();
    expect(screen.getByText('No data')).toBeTruthy();
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

  it('renders a per-section empty state when every list is empty', () => {
    const emptyData = {
      kpis: {
        total_cost: 0,
        total_input_cost: 0,
        total_output_cost: 0,
        total_cache_read_cost: 0,
        total_cache_creation_cost: 0,
        total_tokens: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
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
    // Each of the four sections carries its own empty state.
    expect(screen.getByText('No data')).toBeTruthy(); // daily chart
    expect(screen.getByText('No user cost data is available for the selected date range.')).toBeTruthy();
    expect(screen.getByText('No model cost data is available for the selected date range.')).toBeTruthy();
    expect(
      screen.getByText('No agent & pipeline cost data is available for the selected date range.'),
    ).toBeTruthy();
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

  it('renders the estimated-cost disclaimer above the KPI row', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: MOCK_DATA, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText(/estimated from a local model-price table/i)).toBeTruthy();
  });

  it('labels every cost KPI as estimated', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: MOCK_DATA, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('kpi-TOTAL COST-subtitle').textContent).toMatch(/estimated/i);
    expect(screen.getByTestId('kpi-INPUT TOKEN COST-subtitle').textContent).toMatch(/estimated/i);
    expect(screen.getByTestId('kpi-OUTPUT TOKEN COST-subtitle').textContent).toMatch(/estimated/i);
    expect(screen.getByTestId('kpi-CACHE READ COST-subtitle').textContent).toMatch(/estimated/i);
    expect(screen.getByTestId('kpi-CACHE WRITE COST-subtitle').textContent).toMatch(/estimated/i);
  });

  it('renders the per-agent cost breakdown row', () => {
    useAnalyticsCostsQuery.mockReturnValue({ data: MOCK_DATA, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Cost by Agent & Pipeline')).toBeTruthy();
    expect(screen.getByText('Code Review Bot')).toBeTruthy();
    // The single agent and the single user each account for their whole section's cost
    expect(screen.getAllByText('100.0%')).toHaveLength(2);
  });

  it('renders an em dash for share when the agent cost total is zero', () => {
    const dataNoCost = {
      ...MOCK_DATA,
      by_agent: [{ entity_id: 1, entity_name: 'Zero Cost Agent', total_cost: 0, total_tokens: 0 }],
    };
    useAnalyticsCostsQuery.mockReturnValue({ data: dataNoCost, isFetching: false, isError: false });
    render(
      <AnalyticsCosts
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Zero Cost Agent')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
  });
});
