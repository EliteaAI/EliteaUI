// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsAgentDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import AnalyticsAgentDetailed from '../AnalyticsAgentDetailed';
import { AnalyticsTestWrapper as Wrapper } from './_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  useAnalyticsAgentDetailQuery: vi.fn(),
}));

vi.mock('@/components/Icons/ArrowBackIcon', () => ({ default: () => null }));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

vi.mock('@/[fsd]/shared/ui/tooltip', () => ({
  InfoTooltip: ({ infoTooltip }) => (
    <span
      data-testid="info-tooltip"
      data-title={infoTooltip.title}
    />
  ),
}));

vi.mock('@/[fsd]/features/settings/ui/analytics', async () => ({
  SkillBreakdownTable: (await vi.importActual('../components/SkillBreakdownTable')).default,
  DeletedChip: (await vi.importActual('../components/DeletedChip')).default,
  ChartTooltip: () => null,
  KPICard: ({ label, value, subtitle }) => (
    <div data-testid={`kpi-${label}`}>
      <span>{value}</span>
      {subtitle && <span data-testid={`kpi-${label}-subtitle`}>{subtitle}</span>}
    </div>
  ),
}));

vi.mock('@/[fsd]/features/settings/lib/helpers', async () => ({
  AnalyticCommonHelpers: {
    fmtNum: v => (v == null ? '0' : String(v)),
    fmtCost: v => (v == null ? '$0.00' : `$${v.toFixed(4)}`),
    fmtDuration: v => (v == null ? '0ms' : `${v}ms`),
  },
}));

const MOCK = {
  entity_name: 'CodeReviewBot',
  kpis: {
    total_events: 100,
    unique_users: 3,
    avg_duration_ms: 1500,
    errors: 0,
    error_rate: 0,
    input_tokens: 12345,
    output_tokens: 6789,
    total_tokens: 19134,
    cache_read_tokens: 2222,
    cache_creation_tokens: 1111,
    llm_cost: 0.4321,
    input_cost: 0.1234,
    output_cost: 0.3087,
    cache_read_cost: 0.0022,
    cache_creation_cost: 0.0011,
  },
  users: [],
  tools: [],
  daily_usage: [],
};

describe('AnalyticsAgentDetailed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentDetailQuery.mockReturnValue({ data: MOCK, isFetching: false });
  });

  afterEach(() => cleanup());

  it('renders the token and cost KPI cards', () => {
    render(
      <AnalyticsAgentDetailed
        projectId={1}
        entityId={42}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('kpi-TOTAL TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-INPUT TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-OUTPUT TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-CACHE READ TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-CACHE WRITE TOKENS')).toBeTruthy();
    expect(screen.getByTestId('kpi-TOTAL COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-INPUT TOKEN COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-OUTPUT TOKEN COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-CACHE READ COST')).toBeTruthy();
    expect(screen.getByTestId('kpi-CACHE WRITE COST')).toBeTruthy();
  });

  it('labels every cost KPI as estimated', () => {
    render(
      <AnalyticsAgentDetailed
        projectId={1}
        entityId={42}
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

  it('renders formatted token and cost values from kpis', () => {
    render(
      <AnalyticsAgentDetailed
        projectId={1}
        entityId={42}
        dateFrom="2026-01-01"
        dateTo="2026-01-31"
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('19134')).toBeTruthy(); // total_tokens
    expect(screen.getByText('12345')).toBeTruthy(); // input_tokens
    expect(screen.getByText('6789')).toBeTruthy(); // output_tokens
    expect(screen.getByText('2222')).toBeTruthy(); // cache_read_tokens
    expect(screen.getByText('1111')).toBeTruthy(); // cache_creation_tokens
    expect(screen.getByText('$0.4321')).toBeTruthy(); // llm_cost
    expect(screen.getByText('$0.1234')).toBeTruthy(); // input_cost
    expect(screen.getByText('$0.3087')).toBeTruthy(); // output_cost
    expect(screen.getByText('$0.0022')).toBeTruthy(); // cache_read_cost
    expect(screen.getByText('$0.0011')).toBeTruthy(); // cache_creation_cost
  });
});

const SKILLS = [
  { skill_id: 5, skill_project_id: 1, skill_name: 'Summarizer', deleted: false, uses: 12, runs: 4 },
  { skill_id: 6, skill_project_id: 2, skill_name: 'Translator', deleted: true, uses: 3, runs: 1 },
];

const renderDetail = props =>
  render(
    <AnalyticsAgentDetailed
      projectId={1}
      entityId={42}
      dateFrom="2026-01-01"
      dateTo="2026-01-31"
      {...props}
    />,
    { wrapper: Wrapper },
  );

describe('AnalyticsAgentDetailed — skills panel (#7030)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentDetailQuery.mockReturnValue({ data: { ...MOCK, skills: SKILLS }, isFetching: false });
  });

  afterEach(() => cleanup());

  it('lists the skills the agent used with their use counts', () => {
    renderDetail({ canViewSkills: true });

    const panel = screen.getByTestId('analytics-agent-detail-skills-panel');
    expect(within(panel).getByText('Skills')).toBeTruthy();
    expect(within(panel).getByText('2 skills used by this agent / pipeline')).toBeTruthy();
    const rows = within(panel).getAllByTestId('analytics-agent-detail-skills-panel-row');
    expect(rows.map(row => row.textContent)).toEqual(['Summarizer12', 'TranslatorDeleted3']);
    expect(within(rows[0]).queryByTestId('analytics-agent-detail-skill-deleted')).toBeNull();
    expect(within(rows[1]).getByTestId('analytics-agent-detail-skill-deleted')).toBeTruthy();
    expect(within(panel).getByTestId('info-tooltip')).toHaveAttribute(
      'data-title',
      AnalyticsCommonConstants.TOOLTIP_TEXTS.agentDetail.SKILLS_SECTION,
    );
  });

  it('says how many skills the agent used in total when the list is capped', () => {
    useAnalyticsAgentDetailQuery.mockReturnValue({
      data: { ...MOCK, skills: SKILLS, skills_total: 35, skills_truncated: true },
      isFetching: false,
    });
    renderDetail({ canViewSkills: true });

    const panel = screen.getByTestId('analytics-agent-detail-skills-panel');
    expect(within(panel).getByText('Top 2 of 35 skills used by this agent / pipeline')).toBeTruthy();
  });

  it('places the skills panel after the tools panel', () => {
    renderDetail({ canViewSkills: true });

    const tools = screen.getByTestId('analytics-agent-detail-tools-panel');
    const skills = screen.getByTestId('analytics-agent-detail-skills-panel');
    expect(tools.compareDocumentPosition(skills) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the empty text when the agent used no skill', () => {
    useAnalyticsAgentDetailQuery.mockReturnValue({ data: MOCK, isFetching: false });
    renderDetail({ canViewSkills: true });

    expect(screen.getByTestId('analytics-agent-detail-skills-panel-empty')).toHaveTextContent(
      'No skill data',
    );
  });

  it('hides the skills panel without the skills permission', () => {
    renderDetail();

    expect(screen.queryByTestId('analytics-agent-detail-skills-panel')).toBeNull();
  });
});
