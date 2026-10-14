// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { useAnalyticsCostsQuery } from '@/api';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import AnalyticsTokens from '../AnalyticsTokens';
import { AnalyticsTestWrapper as Wrapper } from './_testHelpers';

vi.mock('@/api', () => ({
  useAnalyticsCostsQuery: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', async () => ({
  AnalyticCommonHelpers: {
    fmtCost: v => `$${v ?? 0}`,
    fmtNum: v => String(v ?? 0),
    axisTick: stroke => ({ fill: stroke, fontSize: 11 }),
    barChartCursor: () => ({}),
  },
  SkillAnalyticsHelpers: await vi.importActual(
    '@/[fsd]/features/settings/lib/helpers/skillAnalytics.helpers.js',
  ),
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
  ChartTooltip: () => null,
  KPICard: ({ label, value }) => <div data-testid={`kpi-${label}`}>{value}</div>,
}));

const MOCK_DATA = {
  kpis: { total_tokens: 1000 },
  by_user: [{ user_id: 1, user_email: 'alice@example.com', total_tokens: 1000 }],
  by_model: [{ model_name: 'gpt-4o', total_tokens: 1000 }],
  by_agent: [{ entity_id: 1, entity_name: 'Code Review Bot', total_tokens: 600 }],
  by_skill: [
    {
      skill_id: 5,
      skill_project_id: 1,
      skill_name: 'Summarizer',
      deleted: false,
      input_tokens: 70,
      output_tokens: 20,
      cache_read_tokens: 8,
      cache_creation_tokens: 2,
      total_tokens: 100,
    },
    {
      skill_id: 6,
      skill_project_id: 1,
      skill_name: 'Translator',
      deleted: true,
      input_tokens: 150,
      output_tokens: 50,
      cache_read_tokens: 0,
      cache_creation_tokens: 0,
      total_tokens: 250,
    },
  ],
  daily: [],
};

const RUN_SCOPE = {
  queryArgs: { runId: '555' },
  tooltips: { tokens: {} },
  scopeLabel: 'this run',
  noDataMessage: 'No analytics data is available for this run.',
};

describe('AnalyticsTokens — token usage by skill (#7030)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsCostsQuery.mockReturnValue({ data: MOCK_DATA, isFetching: false, isError: false });
  });

  afterEach(() => {
    cleanup();
  });

  it('lists skills by tokens with shares relative to the project token total', () => {
    render(
      <AnalyticsTokens
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
        canViewSkills
      />,
      { wrapper: Wrapper },
    );
    const table = within(screen.getByTestId('analytics-tokens-by-skill'));
    expect(table.getByText('Token Usage by Skill')).toBeTruthy();
    expect(table.getByText('SKILL')).toBeTruthy();
    const names = table.getAllByText(/Summarizer|Translator/).map(node => node.textContent);
    expect(names).toEqual(['Translator (deleted)', 'Summarizer']);
    expect(table.getByText('25.0%')).toBeTruthy();
    expect(table.getByText('10.0%')).toBeTruthy();
    expect(table.getByText('70')).toBeTruthy();
    expect(table.getByText('8')).toBeTruthy();
    expect(table.getByTestId('info-tooltip')).toHaveAttribute(
      'data-title',
      AnalyticsCommonConstants.TOOLTIP_TEXTS.tokens.BY_SKILL,
    );
  });

  it('places the skill table right after the agent & pipeline table', () => {
    render(
      <AnalyticsTokens
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
        canViewSkills
      />,
      { wrapper: Wrapper },
    );
    const agentTitle = screen.getByText('Token Usage by Agent & Pipeline');
    const skillTable = screen.getByTestId('analytics-tokens-by-skill');
    expect(agentTitle.compareDocumentPosition(skillTable) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders the empty state when no skill used tokens', () => {
    useAnalyticsCostsQuery.mockReturnValue({
      data: { ...MOCK_DATA, by_skill: [] },
      isFetching: false,
      isError: false,
    });
    render(
      <AnalyticsTokens
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
        canViewSkills
      />,
      { wrapper: Wrapper },
    );
    expect(
      within(screen.getByTestId('analytics-tokens-by-skill')).getByText(
        'No token usage is available for the selected date range.',
      ),
    ).toBeTruthy();
  });

  it('hides the skill table without the skills permission', () => {
    render(
      <AnalyticsTokens
        projectId={1}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByTestId('analytics-tokens-by-skill')).toBeNull();
    expect(screen.queryByText('Token Usage by Skill')).toBeNull();
  });

  it('hides the skill table in run scope', () => {
    render(
      <AnalyticsTokens
        projectId={1}
        runScope={RUN_SCOPE}
        canViewSkills
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Token Usage by User')).toBeTruthy();
    expect(screen.queryByTestId('analytics-tokens-by-skill')).toBeNull();
  });
});
