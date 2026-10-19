// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  analyticsApi,
  useAnalyticsAgentDetailQuery,
  useAnalyticsAgentRunsQuery,
} from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { exportToExcel } from '@/[fsd]/shared/lib/utils';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import AnalyticsAgentDetailed from '../AnalyticsAgentDetailed';
import { AnalyticsRouterTestWrapper as Wrapper } from './_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/shared/lib/utils', async importOriginal => ({
  ...(await importOriginal()),
  exportToExcel: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  analyticsApi: { endpoints: { analyticsAgentRuns: { initiate: vi.fn() } } },
  useAnalyticsAgentDetailQuery: vi.fn(),
  useAnalyticsAgentRunsQuery: vi.fn(),
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
  AnalyticsBreakdownTable: (await vi.importActual('../components/AnalyticsBreakdownTable')).default,
  AgentRecentRunsTable: (await vi.importActual('../components/AgentRecentRunsTable')).default,
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
  AgentAnalyticsHelpers: await vi.importActual(
    '@/[fsd]/features/settings/lib/helpers/agentAnalytics.helpers.js',
  ),
  AnalyticsExportHelpers: await vi.importActual(
    '@/[fsd]/features/settings/lib/helpers/analyticsExport.helpers.js',
  ),
  AnalyticCommonHelpers: {
    ...(await vi.importActual('@/[fsd]/features/settings/lib/helpers/analyticsCommon.helpers.js')),
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
    useAnalyticsAgentRunsQuery.mockReturnValue({ data: undefined, isFetching: false });
    useAnalyticsAgentDetailQuery.mockReturnValue(detailQuery(MOCK));
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

const detailQuery = detail => ({ data: detail, currentData: detail, isFetching: false });

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
    useAnalyticsAgentRunsQuery.mockReturnValue({ data: undefined, isFetching: false });
    useAnalyticsAgentDetailQuery.mockReturnValue(detailQuery({ ...MOCK, skills: SKILLS }));
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
    useAnalyticsAgentDetailQuery.mockReturnValue(
      detailQuery({ ...MOCK, skills: SKILLS, skills_total: 35, skills_truncated: true }),
    );
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
    useAnalyticsAgentDetailQuery.mockReturnValue(detailQuery(MOCK));
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

const TABLES = {
  ...MOCK,
  kind: 'agent',
  skills: SKILLS,
  by_version: [
    { version_id: 31, version_name: 'base', runs: 9, total_tokens: 900, cost: 0.009 },
    { version_id: null, version_name: null, runs: 100, total_tokens: 100, cost: 0.001 },
    { version_id: 32, version_name: 'v2', runs: 10, total_tokens: 1000, cost: 0.01 },
  ],
  by_model: [
    { model_name: 'gpt-4o', display_name: 'GPT-4o', runs: 3, calls: 7, total_tokens: 9, cost: 0.001 },
    { model_name: null, display_name: null, runs: 1, calls: 1, total_tokens: 100, cost: 0.002 },
  ],
  by_trigger_source: [
    { trigger_source: 'scheduled', runs: 2, total_tokens: 300, cost: 0.003 },
    { trigger_source: 'manual', runs: 12, total_tokens: 1700, cost: 0.017 },
  ],
};

const RUN_ROWS = [
  {
    run_id: 'run-1',
    root_project_id: 1,
    started_at: '2026-01-15T09:12:03+00:00',
    user_id: 11,
    user_email: 'a@b.c',
    version_id: 31,
    version_name: 'base',
    models: [
      { model_name: 'gpt-4o', display_name: 'GPT-4o' },
      { model_name: 'claude', display_name: 'Claude Sonnet' },
    ],
    total_tokens: 1200,
    cost: 0.0123,
    is_error: true,
    conversation_id: 1701,
  },
  {
    run_id: 'run-2',
    root_project_id: 1,
    started_at: '2026-01-14T09:12:03+00:00',
    user_id: 12,
    user_email: null,
    version_id: null,
    version_name: null,
    models: [],
    total_tokens: 10,
    cost: 0,
    is_error: false,
    conversation_id: null,
  },
];

const firstCells = testId =>
  screen.getAllByTestId(`${testId}-row`).map(row => row.firstElementChild.textContent);

describe('AnalyticsAgentDetailed — versions, models, triggers and recent runs (#7033)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentDetailQuery.mockReturnValue(detailQuery(TABLES));
    useAnalyticsAgentRunsQuery.mockReturnValue({ data: { total: 2, rows: RUN_ROWS }, isFetching: false });
  });

  afterEach(() => cleanup());

  it('renders the tables in the ticket order with Skills beside Trigger Sources', () => {
    useAnalyticsAgentDetailQuery.mockReturnValue(
      detailQuery({ ...TABLES, daily_usage: [{ date: '2026-01-15', events: 1, errors: 0 }] }),
    );
    renderDetail({ canViewSkills: true });

    const order = [
      'analytics-agent-detail-chart-title',
      'analytics-agent-detail-versions',
      'analytics-agent-detail-models',
      'analytics-agent-detail-users-panel',
      'analytics-agent-detail-tools-panel',
      'analytics-agent-detail-skills-panel',
      'analytics-agent-detail-triggers',
      'analytics-agent-detail-recent-runs',
    ];
    const elements = order.map(testId => screen.getByTestId(testId));
    elements.slice(1).forEach((element, index) => {
      expect(
        elements[index].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });

  it('labels the rows with no version, model or trigger', () => {
    renderDetail();

    expect(firstCells('analytics-agent-detail-versions')).toContain('Unknown version');
    expect(firstCells('analytics-agent-detail-models')).toContain('Unknown model');
    expect(firstCells('analytics-agent-detail-triggers')).toEqual(['Manual', 'Scheduled Pipelines']);
  });

  it('sorts Versions by runs and Models by tokens by default', () => {
    renderDetail();

    expect(firstCells('analytics-agent-detail-versions')).toEqual(['Unknown version', 'v2', 'base']);
    expect(firstCells('analytics-agent-detail-models')).toEqual(['Unknown model', 'GPT-4o']);
  });

  it('sorts the version column by its label, Unknown version included', () => {
    renderDetail();

    fireEvent.click(screen.getByTestId('analytics-agent-detail-versions-sort-version_name'));

    expect(firstCells('analytics-agent-detail-versions')).toEqual(['v2', 'Unknown version', 'base']);
  });

  it('shows the LLM calls of each model', () => {
    renderDetail();

    const gptRow = screen.getAllByTestId('analytics-agent-detail-models-row')[1];
    expect(Array.from(gptRow.children).map(cell => cell.textContent)).toEqual([
      'GPT-4o',
      '3',
      '7',
      '9',
      '$0.0010',
    ]);
  });

  it('carries the ticket tooltips, the Models one noting it covers LLM calls only', () => {
    renderDetail();

    const tooltipOf = testId =>
      within(screen.getByTestId(testId)).getByTestId('info-tooltip').getAttribute('data-title');
    const tt = AnalyticsCommonConstants.TOOLTIP_TEXTS.agentDetail;
    expect(tooltipOf('analytics-agent-detail-versions')).toBe(tt.VERSIONS_SECTION);
    expect(tooltipOf('analytics-agent-detail-models')).toMatch(/Only LLM calls are included/);
    expect(tooltipOf('analytics-agent-detail-triggers')).toBe(tt.TRIGGERS_SECTION);
    expect(tooltipOf('analytics-agent-detail-recent-runs')).toBe(tt.RECENT_RUNS_SECTION);
  });

  it('shows the ticket empty state in a table with no rows', () => {
    useAnalyticsAgentDetailQuery.mockReturnValue(detailQuery({ ...TABLES, by_version: [] }));
    renderDetail();

    expect(screen.getByTestId('analytics-agent-detail-versions-empty')).toHaveTextContent(
      'No data is available for this Agent or Pipeline in the selected date range.',
    );
  });

  it('shows the ticket empty state when the agent has no data in the range', () => {
    useAnalyticsAgentDetailQuery.mockReturnValue({
      data: undefined,
      currentData: undefined,
      isFetching: false,
      error: { status: 404 },
    });
    renderDetail();

    expect(screen.getByTestId('analytics-agent-detail-empty')).toHaveTextContent(
      'No data is available for this Agent or Pipeline in the selected date range.',
    );
    expect(screen.getByTestId('analytics-agent-detail-back-button')).toBeInTheDocument();
  });

  it('asks the runs endpoint for the newest runs first, 20 per page', () => {
    renderDetail();

    expect(useAnalyticsAgentRunsQuery).toHaveBeenLastCalledWith(
      {
        projectId: 1,
        entityId: 42,
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        limit: 20,
        offset: 0,
        sortBy: 'started_at',
        sortOrder: 'desc',
      },
      { skip: false },
    );
  });

  it('sorts runs on the server by the column sort key', () => {
    renderDetail();

    fireEvent.click(screen.getByTestId('analytics-agent-detail-recent-runs-sort-user_email'));

    expect(useAnalyticsAgentRunsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'user', sortOrder: 'desc', offset: 0 }),
      { skip: false },
    );
  });

  it('pages runs on the server', () => {
    useAnalyticsAgentRunsQuery.mockReturnValue({ data: { total: 45, rows: RUN_ROWS }, isFetching: false });
    renderDetail();

    fireEvent.click(screen.getByTestId('analytics-agent-detail-runs-pagination-next'));

    expect(useAnalyticsAgentRunsQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 20, offset: 20 }),
      { skip: false },
    );
  });

  it('links each run start to its own run analytics, adding the conversation when there is one', () => {
    renderDetail();

    const links = screen.getAllByTestId('analytics-agent-detail-run-link');
    expect(links).toHaveLength(2);
    expect(links[0].tagName).toBe('A');
    expect(links[0]).toHaveAttribute(
      'href',
      '/agents/all/42/history/analytics?usage_run_id=run-1&history_run_id=1701',
    );
    expect(links[1]).toHaveAttribute('href', '/agents/all/42/history/analytics?usage_run_id=run-2');
  });

  it('opens a pipeline run on the pipeline route', () => {
    useAnalyticsAgentDetailQuery.mockReturnValue(detailQuery({ ...TABLES, kind: 'pipeline' }));
    renderDetail();

    expect(screen.getAllByTestId('analytics-agent-detail-run-link')[0].getAttribute('href')).toMatch(
      /^\/pipelines\/all\/42\/history\/analytics\?/,
    );
  });

  it('links the local run and leaves a Catalog run with the same agent id as text', () => {
    useAnalyticsAgentRunsQuery.mockReturnValue({
      data: {
        total: 2,
        rows: [
          { ...RUN_ROWS[0], root_project_id: 1 },
          { ...RUN_ROWS[1], root_project_id: 7 },
        ],
      },
      isFetching: false,
    });
    renderDetail();

    const [localRow, catalogRow] = screen.getAllByTestId('analytics-agent-detail-recent-runs-row');
    expect(within(localRow).getByTestId('analytics-agent-detail-run-link')).toHaveAttribute(
      'href',
      '/agents/all/42/history/analytics?usage_run_id=run-1&history_run_id=1701',
    );
    expect(within(catalogRow).queryByTestId('analytics-agent-detail-run-link')).toBeNull();
    expect(within(catalogRow).queryByRole('link')).toBeNull();
  });

  it('lists every model of a run, with status, user and version labels', () => {
    renderDetail();

    const [first, second] = screen.getAllByTestId('analytics-agent-detail-recent-runs-row');
    expect(within(first).getByTestId('analytics-agent-detail-run-models')).toHaveTextContent(
      'GPT-4o, Claude Sonnet',
    );
    expect(first).toHaveTextContent('Error');
    expect(second).toHaveTextContent('Success');
    expect(second).toHaveTextContent('User 12');
    expect(second).toHaveTextContent('Unknown version');
  });
});

describe('AnalyticsAgentDetailed — export (#7033)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentDetailQuery.mockReturnValue(detailQuery(TABLES));
    useAnalyticsAgentRunsQuery.mockReturnValue({ data: { total: 2, rows: RUN_ROWS }, isFetching: false });
    analyticsApi.endpoints.analyticsAgentRuns.initiate.mockImplementation(args => ({
      unwrap: () => Promise.resolve({ total: 2, rows: args.offset === 0 ? RUN_ROWS : [] }),
      unsubscribe: vi.fn(),
    }));
  });

  afterEach(() => cleanup());

  it('exports every table with every run and its absolute run URL', async () => {
    renderDetail({ canViewSkills: true });

    fireEvent.click(screen.getByTestId('analytics-agent-detail-export-button'));

    await waitFor(() => expect(exportToExcel).toHaveBeenCalledTimes(1));
    const [fileName, [sheet]] = exportToExcel.mock.calls[0];
    expect(fileName).toMatch(/^Test_project_agent_CodeReviewBot_/);
    expect(sheet.sections.map(section => section.title)).toEqual([
      'KPIs',
      'Daily',
      'Users',
      'Tools',
      'Skills',
      'Versions',
      'Models',
      'Trigger Sources',
      'Recent Runs',
    ]);
    const runs = sheet.sections.at(-1).rows;
    expect(runs.map(run => run.run_url)).toEqual([
      `${window.location.origin}/1/agents/all/42/history/analytics?usage_run_id=run-1&history_run_id=1701`,
      `${window.location.origin}/1/agents/all/42/history/analytics?usage_run_id=run-2`,
    ]);
    expect(analyticsApi.endpoints.analyticsAgentRuns.initiate).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 1, entityId: 42, limit: 100, offset: 0 }),
    );
  });

  it('marks the Recent Runs sheet when the export stops at its limit', async () => {
    analyticsApi.endpoints.analyticsAgentRuns.initiate.mockImplementation(args => ({
      unwrap: () =>
        Promise.resolve({
          total: 25_000,
          rows: Array.from({ length: 100 }, (_, index) => ({
            ...RUN_ROWS[1],
            run_id: `r${args.offset + index}`,
          })),
        }),
      unsubscribe: vi.fn(),
    }));
    renderDetail();

    fireEvent.click(screen.getByTestId('analytics-agent-detail-export-button'));

    await waitFor(() => expect(exportToExcel).toHaveBeenCalledTimes(1));
    const [, [sheet]] = exportToExcel.mock.calls[0];
    expect(sheet.sections.at(-1).title).toBe('Recent Runs (first 10,000 of 25,000 runs)');
    expect(sheet.sections.at(-1).rows).toHaveLength(10_000);
  });

  it('leaves the run URL of a Catalog run blank in the export', async () => {
    analyticsApi.endpoints.analyticsAgentRuns.initiate.mockImplementation(args => ({
      unwrap: () =>
        Promise.resolve({
          total: 2,
          rows:
            args.offset === 0
              ? [
                  { ...RUN_ROWS[0], root_project_id: 1 },
                  { ...RUN_ROWS[1], root_project_id: 7 },
                ]
              : [],
        }),
      unsubscribe: vi.fn(),
    }));
    renderDetail();

    fireEvent.click(screen.getByTestId('analytics-agent-detail-export-button'));

    await waitFor(() => expect(exportToExcel).toHaveBeenCalledTimes(1));
    const [, [sheet]] = exportToExcel.mock.calls[0];
    expect(sheet.sections.at(-1).rows.map(run => run.run_url)).toEqual([
      `${window.location.origin}/1/agents/all/42/history/analytics?usage_run_id=run-1&history_run_id=1701`,
      '',
    ]);
  });

  it('reports a failed export', async () => {
    exportToExcel.mockRejectedValueOnce(new Error('disk full'));
    renderDetail();

    fireEvent.click(screen.getByTestId('analytics-agent-detail-export-button'));

    expect(await screen.findByTestId('analytics-agent-detail-export-error')).toBeInTheDocument();
  });
});

describe('AnalyticsAgentDetailed — switching to a range without data (#7033)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnalyticsAgentRunsQuery.mockReturnValue({ data: { total: 0, rows: [] }, isFetching: false });
  });

  afterEach(() => cleanup());

  it('drops the previous range numbers and shows the empty state with Back', () => {
    const onBack = vi.fn();
    useAnalyticsAgentDetailQuery.mockReturnValue(detailQuery(TABLES));
    const { rerender } = renderDetail({ onBack });

    expect(screen.getByText('19134')).toBeInTheDocument();

    useAnalyticsAgentDetailQuery.mockReturnValue({
      data: TABLES,
      currentData: undefined,
      isFetching: false,
      error: { status: 404 },
    });
    rerender(
      <AnalyticsAgentDetailed
        projectId={1}
        entityId={42}
        dateFrom="2020-01-01"
        dateTo="2020-12-31"
        onBack={onBack}
      />,
    );

    expect(screen.queryByText('19134')).toBeNull();
    expect(screen.queryByTestId('analytics-agent-detail-versions')).toBeNull();
    expect(screen.getByTestId('analytics-agent-detail-empty')).toHaveTextContent(
      'No data is available for this Agent or Pipeline in the selected date range.',
    );
    fireEvent.click(screen.getByTestId('analytics-agent-detail-back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('says loading failed on any other error', () => {
    useAnalyticsAgentDetailQuery.mockReturnValue({
      data: TABLES,
      currentData: undefined,
      isFetching: false,
      error: { status: 500 },
    });
    renderDetail();

    expect(screen.getByTestId('analytics-agent-detail-empty')).toHaveTextContent(
      'Failed to load Agent or Pipeline analytics.',
    );
  });

  it('shows the spinner, not the previous range, while the new range loads', () => {
    useAnalyticsAgentDetailQuery.mockReturnValue({ data: TABLES, currentData: undefined, isFetching: true });
    renderDetail();

    expect(screen.getByTestId('analytics-agent-detail-loading-indicator')).toBeInTheDocument();
    expect(screen.queryByText('19134')).toBeNull();
  });
});
