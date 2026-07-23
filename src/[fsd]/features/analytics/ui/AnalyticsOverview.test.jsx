// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AnalyticsOverview from './AnalyticsOverview';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

vi.mock('@/[fsd]/features/analytics/ui', () => ({
  ChartTooltip: () => null,
  KPICard: ({ label, value }) => <div data-testid={`kpi-${label}`}>{value}</div>,
  ModelUsageTable: ({ models }) => (
    <div data-testid="model-usage-table">
      {models.map((m, i) => (
        <span key={i}>{m.model_name}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/[fsd]/features/analytics/lib/constants', () => ({
  AnalyticsCommonConstants: {
    CHART_COLORS: ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#9C27B0'],
    MEDAL_COLORS: ['#FFD700', '#C0C0C0', '#CD7F32'],
  },
}));

vi.mock('@/[fsd]/features/analytics/lib/helpers', () => ({
  AnalyticCommonHelpers: {
    fmtCost: v => `$${v ?? 0}`,
    fmtNum: v => String(v ?? 0),
  },
}));

vi.mock('@/[fsd]/features/interactive-tours', () => ({
  ANALYTICS_TOUR_TARGET_IDS: { kpiCards: 'analytics-kpi-cards' },
}));

const theme = createTheme({
  palette: {
    status: { draft: '#1976d2', published: '#388e3c' },
    border: { table: '#e0e0e0' },
    background: { userInputBackground: '#f5f5f5', conversation: { hover: '#fafafa' } },
    text: { metrics: '#9e9e9e', button: { primary: '#ffffff' } },
  },
});

const Wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;

const MOCK_DATA = {
  kpis: {
    unique_users: 12,
    total_project_users: 30,
    ai_active_users: 8,
    adoption_rate: 27,
    llm_calls: 5400,
    tool_runs: 1200,
    chat_msgs: 890,
    agent_runs: 340,
    total_tokens: 1250000,
    total_llm_cost: 42.56,
  },
  top_ai_users: [
    {
      user_id: 1,
      user_email: 'alice@example.com',
      llm_calls: 200,
      tool_runs: 50,
      agent_runs: 30,
      ai_events: 280,
    },
    {
      user_id: 2,
      user_email: 'bob@example.com',
      llm_calls: 150,
      tool_runs: 40,
      agent_runs: 20,
      ai_events: 210,
    },
  ],
  daily_activity: [
    { date: '2026-01-15', events: 120, users: 8 },
    { date: '2026-01-16', events: 145, users: 10 },
  ],
  models: [
    { model_name: 'gpt-4o', calls: 3000, input_tokens: 800000, output_tokens: 400000 },
    { model_name: 'claude-3-5-sonnet', calls: 2400, input_tokens: 600000, output_tokens: 300000 },
  ],
};

describe('AnalyticsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all KPI cards including token and cost', () => {
    render(<AnalyticsOverview data={MOCK_DATA} />, { wrapper: Wrapper });
    expect(screen.getByTestId('kpi-TEAM')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-AI ACTIVE')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-LLM CALLS')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-TOOL RUNS')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-CHAT MSG')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-AGENT RUNS')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-TOKENS')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-LLM COST')).toBeInTheDocument();
  });

  it('renders daily activity chart section', () => {
    render(<AnalyticsOverview data={MOCK_DATA} />, { wrapper: Wrapper });
    expect(screen.getByText('Daily Activity')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders top AI adopters leaderboard', () => {
    render(<AnalyticsOverview data={MOCK_DATA} />, { wrapper: Wrapper });
    expect(screen.getByText('Top 5 AI Adopters')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('renders model usage table', () => {
    render(<AnalyticsOverview data={MOCK_DATA} />, { wrapper: Wrapper });
    expect(screen.getByTestId('model-usage-table')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    expect(screen.getByText('claude-3-5-sonnet')).toBeInTheDocument();
  });

  it('renders empty state when no top AI users', () => {
    const emptyData = { ...MOCK_DATA, top_ai_users: [] };
    render(<AnalyticsOverview data={emptyData} />, { wrapper: Wrapper });
    expect(screen.getByText('No AI activity data.')).toBeInTheDocument();
  });

  it('calls onUserClick when leaderboard row is clicked', () => {
    const onUserClick = vi.fn();
    render(
      <AnalyticsOverview
        data={MOCK_DATA}
        onUserClick={onUserClick}
      />,
      { wrapper: Wrapper },
    );
    const emailElement = screen.getByText('alice@example.com');
    fireEvent.click(emailElement.closest('[class*="MuiBox"]'));
    expect(onUserClick).toHaveBeenCalledWith(1);
  });
});
