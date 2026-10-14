// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AnalyticsOverview from '../AnalyticsOverview';
import { AnalyticsTestWrapper as Wrapper } from './_testHelpers';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: ({ name }) => <span data-testid={`area-${name}`} />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock('@/[fsd]/shared/ui/tooltip', () => ({
  InfoTooltip: ({ infoTooltip }) => (
    <span
      data-testid="info-tooltip"
      data-title={infoTooltip.title}
    />
  ),
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => ({
  AutomatedActivityTable: () => null,
  ChartTooltip: () => null,
  KPICard: ({ label, value, tooltip }) => (
    <div
      data-testid={`kpi-${label}`}
      data-tooltip={tooltip}
    >
      {value}
    </div>
  ),
  ModelUsageTable: ({ models }) => (
    <div data-testid="model-usage-table">
      {models.map((m, i) => (
        <span key={i}>{m.model_name}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/[fsd]/features/settings/lib/constants', () => ({
  AnalyticsCommonConstants: {
    CHART_COLORS: ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#9C27B0'],
    MEDAL_COLORS: ['#FFD700', '#C0C0C0', '#CD7F32'],
    EVENT_TYPE_COLORS: {
      llm: '#BC8CFF',
      tool: '#F0883E',
      agent: '#3FB950',
      skill: '#F778BA',
    },
    TOOLTIP_TEXTS: {
      overview: {
        DAILY_ACTIVITY: 'Shows daily AI usage for the selected period.',
        DAILY_ACTIVITY_PRIVATE: 'Shows daily AI usage for the selected period.',
        LEADERBOARD: 'Ranks users by combined LLM calls, tool runs, and Agent & Pipeline runs.',
        SKILL_RUNS: 'Total skill runs during the selected date range.',
        DAILY_ACTIVITY_SKILL_RUNS: 'Skill Runs shows skills run on their own.',
        LEADERBOARD_SKILL_RUNS: 'Model and tool calls made by skill runs count toward the score.',
      },
    },
  },
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  AnalyticCommonHelpers: {
    fmtCost: v => `$${v ?? 0}`,
    fmtNum: v => String(v ?? 0),
    axisTick: stroke => ({ fill: stroke, fontSize: 11 }),
  },
}));

vi.mock('@/[fsd]/features/interactive-tours', () => ({
  ANALYTICS_TOUR_TARGET_IDS: { kpiCards: 'analytics-kpi-cards' },
}));

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
    skill_runs: 47,
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
      skill_runs: 3,
      ai_events: 280,
    },
    {
      user_id: 2,
      user_email: 'bob@example.com',
      llm_calls: 150,
      tool_runs: 40,
      agent_runs: 20,
      skill_runs: 0,
      ai_events: 210,
    },
  ],
  daily_activity: [
    { date: '2026-01-15', llm_calls: 80, tool_runs: 30, agent_runs: 10, active_users: 8 },
    { date: '2026-01-16', llm_calls: 95, tool_runs: 35, agent_runs: 15, active_users: 10 },
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
    expect(screen.getByTestId('kpi-AGENT & PIPELINE RUNS')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-TOKENS')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-COST')).toBeInTheDocument();
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

  describe('skill usage (#7030)', () => {
    const tooltipTitles = () =>
      screen.getAllByTestId('info-tooltip').map(node => node.getAttribute('data-title'));

    it('places a Skill Runs KPI card right after Agent & Pipeline Runs', () => {
      render(
        <AnalyticsOverview
          data={MOCK_DATA}
          canViewSkills
        />,
        { wrapper: Wrapper },
      );
      const labels = Array.from(
        screen.getByTestId('analytics-overview-kpi-row').querySelectorAll('[data-testid^="kpi-"]'),
      ).map(node => node.getAttribute('data-testid'));
      expect(labels.indexOf('kpi-SKILL RUNS')).toBe(labels.indexOf('kpi-AGENT & PIPELINE RUNS') + 1);
      expect(screen.getByTestId('kpi-SKILL RUNS')).toHaveTextContent('47');
      expect(screen.getByTestId('kpi-SKILL RUNS')).toHaveAttribute(
        'data-tooltip',
        'Total skill runs during the selected date range.',
      );
    });

    it('adds a Skill Runs series to Daily Activity and explains it in the tooltip', () => {
      render(
        <AnalyticsOverview
          data={MOCK_DATA}
          canViewSkills
        />,
        { wrapper: Wrapper },
      );
      expect(screen.getByTestId('area-Skill Runs')).toBeInTheDocument();
      expect(tooltipTitles()).toContain(
        'Shows daily AI usage for the selected period. Skill Runs shows skills run on their own.',
      );
    });

    it('shows skill runs in the Top 5 AI Adopters breakdown, subtitle and tooltip', () => {
      render(
        <AnalyticsOverview
          data={MOCK_DATA}
          canViewSkills
        />,
        { wrapper: Wrapper },
      );
      const aliceRow = screen.getByText('alice@example.com').parentElement;
      expect(aliceRow).toHaveTextContent('30 Agent / Pipeline · 3 Skill');
      expect(screen.getByText(/Leaderboard by AI events/)).toHaveTextContent(
        'Leaderboard by AI events (LLM + Tool + Agent / Pipeline + Skill)',
      );
      expect(tooltipTitles()).toContain(
        'Ranks users by combined LLM calls, tool runs, and Agent & Pipeline runs. Model and tool calls made by skill runs count toward the score.',
      );
    });

    it('hides every skill figure without the skills permission', () => {
      render(<AnalyticsOverview data={MOCK_DATA} />, { wrapper: Wrapper });
      expect(screen.queryByTestId('kpi-SKILL RUNS')).not.toBeInTheDocument();
      expect(screen.queryByTestId('area-Skill Runs')).not.toBeInTheDocument();
      expect(screen.getByText('alice@example.com').parentElement).not.toHaveTextContent('Skill');
      expect(screen.getByText(/Leaderboard by AI events/)).toHaveTextContent(
        'Leaderboard by AI events (LLM + Tool + Agent / Pipeline)',
      );
      expect(tooltipTitles()).toEqual([
        'Shows daily AI usage for the selected period.',
        'Ranks users by combined LLM calls, tool runs, and Agent & Pipeline runs.',
      ]);
    });
  });
});
