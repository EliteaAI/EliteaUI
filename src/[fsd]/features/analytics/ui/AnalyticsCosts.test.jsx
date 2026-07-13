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
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

vi.mock('@/[fsd]/features/analytics/lib/constants', () => ({
  AnalyticsCommonConstants: {
    CHART_COLORS: ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#9C27B0'],
    TOP_LIST_SIZE: 10,
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

  it('renders model breakdown chart section', () => {
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
  });

  it('renders daily cost trend chart section', () => {
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
    expect(screen.getAllByText('No data').length).toBeGreaterThanOrEqual(2);
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
