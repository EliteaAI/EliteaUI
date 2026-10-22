import { describe, expect, it, vi } from 'vitest';

// The helper reaches @/common/utils, which pulls in the redux store and cannot load
// in this environment; only isNullOrUndefined is actually needed here.
vi.mock('@/common/utils', () => ({
  isNullOrUndefined: value => value === null || value === undefined,
}));

const {
  budgetStatus,
  buildDailySheet,
  buildKpiSheet,
  buildMembersSheet,
  buildModelSheet,
  buildMomSheet,
  buildSpendBySourceSheet,
  buildSpendOverTimeSheet,
  buildSummarySheet,
  buildToolSpendSheet,
  buildTopAgentsSheet,
  buildTopSkillsSheet,
  buildUsageSheets,
  usageExportFileName,
} = await import('../usageExport.helpers');

/** A limited team-project payload, shaped like the live /usage response. */
const limitedUsage = () => ({
  scope: 'project',
  period_start: '2026-07-01',
  period_end: '2026-07-31',
  limit_source: 'explicit',
  effective_limit: 10,
  spend: 7.5,
  percent_used: 75,
  total_tokens: 317011,
  api_requests: 16,
  warning_pct: 80,
  can_see_amounts: true,
  daily: [{ date: '2026-07-01', spend: 7.5, total_tokens: 317011, api_requests: 16 }],
  models: [
    { model: 'gpt-5', display_name: 'GPT-5', spend: 5, total_tokens: 300000, api_requests: 10 },
    {
      model: 'bedrock/eu.anthropic.claude-sonnet-4-6',
      display_name: 'Claude 4.6 Sonnet',
      spend: 2.5,
      total_tokens: 100000,
      api_requests: 6,
    },
  ],
});

const unlimitedUsage = () => ({
  ...limitedUsage(),
  limit_source: 'unlimited',
  effective_limit: null,
  percent_used: null,
});

const summaryRow = payload =>
  buildSummarySheet({
    data: payload,
    projectName: 'Bugs and Features',
    isPersonalProject: false,
    scope: payload.scope,
  }).rows[0];

describe('budgetStatus', () => {
  it('reports a limit reached at and above 100%', () => {
    expect(budgetStatus(100, 80)).toBe('Limit reached');
    expect(budgetStatus(150, 80)).toBe('Limit reached');
  });

  it('warns from the configured threshold up to the limit', () => {
    expect(budgetStatus(80, 80)).toBe('Warning threshold reached');
    expect(budgetStatus(99.9, 80)).toBe('Warning threshold reached');
  });

  it('respects a threshold other than the default', () => {
    expect(budgetStatus(55, 50)).toBe('Warning threshold reached');
    // The default would have warned here; the configured value must win
    expect(budgetStatus(85, 95)).toBe('Within budget');
  });

  it('is within budget below the threshold', () => {
    expect(budgetStatus(79.9, 80)).toBe('Within budget');
    expect(budgetStatus(0, 80)).toBe('Within budget');
  });

  it('reports unlimited when there is no percentage to judge', () => {
    expect(budgetStatus(null, 80)).toBe('Unlimited');
    expect(budgetStatus(undefined, 80)).toBe('Unlimited');
  });
});

describe('summary sheet', () => {
  it('carries the scope and project identity', () => {
    const row = summaryRow(limitedUsage());

    expect(row.projectName).toBe('Bugs and Features');
    expect(row.projectType).toBe('Team');
    expect(row.usageScope).toBe('Whole project');
    expect(row.budgetSource).toBe('Explicit');
  });

  it('labels the personal project as private', () => {
    const sheet = buildSummarySheet({
      data: limitedUsage(),
      projectName: 'Private',
      isPersonalProject: true,
      scope: 'project',
    });

    expect(sheet.rows[0].projectType).toBe('Private');
  });

  it('names the member scope when exporting my usage', () => {
    const sheet = buildSummarySheet({
      data: { ...limitedUsage(), scope: 'user' },
      projectName: 'Team',
      isPersonalProject: false,
      scope: 'user',
    });

    expect(sheet.rows[0].usageScope).toBe('My usage');
  });

  it('keeps money and percentages numeric so the sheet can be calculated on', () => {
    const row = summaryRow(limitedUsage());

    expect(row.budgetLimit).toBe(10);
    expect(row.spent).toBe(7.5);
    expect(row.usedPercent).toBe(75);
    expect(row.tokens).toBe(317011);
    expect(row.calls).toBe(16);
  });

  // A zero would read as "nothing used" when the truth is there is nothing to measure
  it('leaves percentage columns empty for an unlimited budget', () => {
    const row = summaryRow(unlimitedUsage());

    expect(row.budgetLimit).toBe('Unlimited');
    expect(row.usedPercent).toBe('');
    expect(row.warningThreshold).toBe('');
    expect(row.budgetStatus).toBe('Unlimited');
  });

  it('reports the budget status from the configured threshold', () => {
    expect(summaryRow({ ...limitedUsage(), percent_used: 85 }).budgetStatus).toBe(
      'Warning threshold reached',
    );
    expect(summaryRow({ ...limitedUsage(), percent_used: 101 }).budgetStatus).toBe('Limit reached');
  });

  // Members who may not see cost get a payload with those fields stripped out
  it('emits blanks rather than zeros for a redacted payload', () => {
    const redacted = { ...limitedUsage() };
    delete redacted.spend;
    delete redacted.effective_limit;

    const row = summaryRow(redacted);

    expect(row.spent).toBe('');
    expect(row.budgetLimit).toBe('Unlimited');
  });

  it('always states a monthly period', () => {
    expect(summaryRow(limitedUsage()).budgetPeriod).toBe('Monthly');
  });
});

describe('daily sheet', () => {
  it('fills quiet days so the sheet matches the chart', () => {
    const sheet = buildDailySheet({
      period_start: '2026-07-01',
      period_end: '2026-07-03',
      daily: [{ date: '2026-07-01', spend: 1, total_tokens: 10, api_requests: 2 }],
    });

    expect(sheet.rows.length).toBeGreaterThan(1);
    expect(sheet.rows[0].date).toBe('2026-07-01');
  });

  it('produces headers with no rows when there is no usage', () => {
    const sheet = buildDailySheet({ daily: [], period_start: null, period_end: null });

    expect(sheet.rows).toEqual([]);
    expect(sheet.columns.map(column => column.header)).toEqual(['Date', 'Spent (USD)', 'Tokens', 'Calls']);
  });

  it('adds prev-period columns without mutating source rows', () => {
    const data = {
      period_start: '2026-07-01',
      period_end: '2026-07-02',
      daily: [{ date: '2026-07-01', spend: 5, total_tokens: 100, api_requests: 3 }],
    };
    const comparisonData = {
      period_start: '2026-06-01',
      period_end: '2026-06-02',
      daily: [{ date: '2026-06-01', spend: 3, total_tokens: 80, api_requests: 2 }],
    };
    const originalRow = data.daily[0];
    const sheet = buildDailySheet(data, comparisonData);

    expect(sheet.columns.map(c => c.header)).toContain('Prev. period spent (USD)');
    expect(sheet.columns.map(c => c.header)).toContain('Prev. period tokens');
    expect(sheet.rows[0].prevSpend).toBe(3);
    expect(sheet.rows[0].prevTokens).toBe(80);
    expect(originalRow).not.toHaveProperty('prevSpend');
    expect(originalRow).not.toHaveProperty('prevTokens');
  });
});

describe('model sheet', () => {
  it('orders by spend, highest first', () => {
    const rows = buildModelSheet(limitedUsage()).rows;

    expect(rows.map(row => row.model)).toEqual(['GPT-5', 'Claude 4.6 Sonnet']);
  });

  it('shares by token count, totalling a hundred percent', () => {
    const rows = buildModelSheet(limitedUsage()).rows;
    const total = rows.reduce((sum, row) => sum + row.share, 0);

    expect(total).toBeCloseTo(100, 1);
    expect(rows[0].share).toBeCloseTo(75, 1);
  });

  it('falls back to a formatted technical name when no display name exists', () => {
    const sheet = buildModelSheet({
      models: [{ model: 'bedrock/eu.anthropic.claude-opus-5', spend: 1, total_tokens: 5 }],
    });

    expect(sheet.rows[0].model).toBe('eu.anthropic.claude-opus-5');
  });

  it('does not divide by zero when nothing was used', () => {
    const sheet = buildModelSheet({ models: [{ model: 'gpt-5', spend: 0, total_tokens: 0 }] });

    expect(sheet.rows[0].share).toBe(0);
  });

  it('produces headers with no rows when there is no usage', () => {
    expect(buildModelSheet({ models: [] }).rows).toEqual([]);
  });

  it('uses token delta for vs Prior when spend is redacted for a member', () => {
    const data = {
      models: [{ model: 'gpt-5', display_name: 'GPT-5', spend: null, total_tokens: 500 }],
    };
    const comparisonData = {
      models: [{ model: 'gpt-5', spend: null, total_tokens: 400 }],
    };
    const sheet = buildModelSheet(data, comparisonData);

    // Token delta: 500 vs 400 = +25% — direction is not 'none', so vsPrior is not '—'
    expect(sheet.rows[0].vsPrior).not.toBe('—');
    expect(sheet.rows[0].vsPrior).toMatch(/\+|↑/);
  });
});

describe('members sheet', () => {
  const rows = [
    {
      user_id: 1,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      effective_limit: 10,
      spend: 9,
      percent_used: 90,
      limit_source: 'explicit',
    },
    {
      user_id: 2,
      name: null,
      email: 'grace@example.com',
      effective_limit: null,
      spend: 3,
      percent_used: null,
      limit_source: 'unlimited',
    },
  ];

  it('keeps member identity and numeric spend', () => {
    const sheet = buildMembersSheet(rows, 80);

    expect(sheet.rows[0].name).toBe('Ada Lovelace');
    expect(sheet.rows[0].email).toBe('ada@example.com');
    expect(sheet.rows[0].spent).toBe(9);
  });

  it('falls back to the email when a member has no name', () => {
    expect(buildMembersSheet(rows, 80).rows[1].name).toBe('grace@example.com');
  });

  it('applies the member threshold to the status', () => {
    expect(buildMembersSheet(rows, 80).rows[0].budgetStatus).toBe('Warning threshold reached');
    expect(buildMembersSheet(rows, 95).rows[0].budgetStatus).toBe('Within budget');
  });

  it('marks an unlimited member without inventing a percentage', () => {
    const row = buildMembersSheet(rows, 80).rows[1];

    expect(row.budgetLimit).toBe('Unlimited');
    expect(row.usedPercent).toBe('');
    expect(row.budgetStatus).toBe('Unlimited');
  });

  it('tolerates no members at all', () => {
    expect(buildMembersSheet(undefined, 80).rows).toEqual([]);
  });
});

describe('sheet selection per scope', () => {
  const names = args =>
    buildUsageSheets({ data: limitedUsage(), projectName: 'P', ...args }).map(s => s.sheetName);

  it('includes members only for a team whole-project export', () => {
    expect(names({ isPersonalProject: false, scope: 'project', memberRows: [] })).toEqual([
      'Usage Summary',
      'KPI Summary',
      'Daily Usage',
      'Spend Over Time',
      'Usage by Model',
      'Members',
    ]);
  });

  it('omits members for my usage', () => {
    expect(names({ isPersonalProject: false, scope: 'user' })).toEqual([
      'Usage Summary',
      'KPI Summary',
      'Daily Usage',
      'Spend Over Time',
      'Usage by Model',
    ]);
  });

  // A private project's only member is its owner, so per-member data is meaningless
  it('omits members for a private project', () => {
    expect(names({ isPersonalProject: true, scope: 'project' })).toEqual([
      'Usage Summary',
      'KPI Summary',
      'Daily Usage',
      'Spend Over Time',
      'Usage by Model',
    ]);
  });

  it('exports every member row it is given', () => {
    const sheets = buildUsageSheets({
      data: limitedUsage(),
      projectName: 'P',
      isPersonalProject: false,
      scope: 'project',
      memberRows: [
        { user_id: 1, name: 'A', effective_limit: null },
        { user_id: 2, name: 'B', effective_limit: null },
        { user_id: 3, name: 'C', effective_limit: null },
      ],
    });

    expect(sheets.find(sheet => sheet.sheetName === 'Members').rows).toHaveLength(3);
  });
});

describe('paid tools sheet', () => {
  const webSearch = {
    feature: 'web_search',
    label: 'Web search',
    spend: 2.5,
    effective_limit: 10,
    percent_used: 25,
    calls: 31,
  };

  it('is added only when the payload lists paid tools', () => {
    const names = data =>
      buildUsageSheets({ data, projectName: 'P', isPersonalProject: false, scope: 'user' }).map(
        s => s.sheetName,
      );

    expect(names(limitedUsage())).not.toContain('Paid Tools');
    expect(names({ ...limitedUsage(), tool_spend: [webSearch] })).toContain('Paid Tools');
  });

  it('carries spend, limit, percent and calls per tool', () => {
    expect(buildToolSpendSheet({ tool_spend: [webSearch] }).rows).toEqual([
      { label: 'Web search', spend: 2.5, limit: 10, percent: 25, calls: 31 },
    ]);
  });

  // Redacted payloads drop amounts entirely; the sheet must not invent zeros or "Unlimited"
  it('leaves amounts blank for members who cannot see cost', () => {
    const redacted = { feature: 'web_search', label: 'Web search', percent_used: 25, calls: 31 };

    expect(buildToolSpendSheet({ tool_spend: [redacted] }).rows[0]).toEqual({
      label: 'Web search',
      spend: '',
      limit: '',
      percent: 25,
      calls: 31,
    });
  });
});

describe('KPI summary sheet', () => {
  const kpiUsage = () => ({
    ...limitedUsage(),
    api_requests: 16,
    input_tokens: 250000,
    cache_read_tokens: 0,
    daily: [
      { date: '2026-07-01', spend: 4, total_tokens: 160000, api_requests: 8 },
      { date: '2026-07-02', spend: 3.5, total_tokens: 157011, api_requests: 8 },
    ],
  });

  it('always emits exactly 5 rows (Spent, Forecast/Limit, Avg/day, Tokens, API calls)', () => {
    const sheet = buildKpiSheet({ data: kpiUsage(), canSeeAmounts: true, isCurrentPeriod: true });

    expect(sheet.rows).toHaveLength(5);
    expect(sheet.rows.map(r => r.metric)).toEqual(['Spent', 'Forecast', 'Avg / day', 'Tokens', 'API calls']);
  });

  it('uses "Budget used" and "Avg tokens / day" when canSeeAmounts is false', () => {
    const sheet = buildKpiSheet({ data: kpiUsage(), canSeeAmounts: false, isCurrentPeriod: true });

    expect(sheet.rows[0].metric).toBe('Budget used');
    expect(sheet.rows[2].metric).toBe('Avg tokens / day');
  });

  it('uses "Limit" instead of "Forecast" for a past period', () => {
    const sheet = buildKpiSheet({ data: kpiUsage(), canSeeAmounts: true, isCurrentPeriod: false });

    expect(sheet.rows[1].metric).toBe('Limit');
    expect(sheet.rows[1].value).toBe(10);
  });

  it('carries the API calls count', () => {
    const sheet = buildKpiSheet({ data: kpiUsage(), canSeeAmounts: true, isCurrentPeriod: true });

    expect(sheet.rows[4].metric).toBe('API calls');
    expect(sheet.rows[4].value).toBe(16);
  });

  it('includes the sheet in buildUsageSheets output', () => {
    const names = buildUsageSheets({
      data: limitedUsage(),
      projectName: 'P',
      isPersonalProject: true,
      scope: 'project',
    }).map(s => s.sheetName);

    expect(names).toContain('KPI Summary');
    expect(names.indexOf('KPI Summary')).toBe(1); // second sheet, right after Usage Summary
  });
});

describe('spend over time sheet', () => {
  const dataWithSources = {
    period_start: '2026-07-01',
    period_end: '2026-07-02',
    daily: [
      { date: '2026-07-01', spend: 4, total_tokens: 100, api_requests: 2, by_source: { agents: 3, chat: 1 } },
      { date: '2026-07-02', spend: 6, total_tokens: 200, api_requests: 4, by_source: { agents: 5, chat: 1 } },
    ],
  };

  const bySource = [
    { source: 'agents', spend: 8 },
    { source: 'chat', spend: 2 },
  ];

  it('emits one row per day', () => {
    expect(buildSpendOverTimeSheet(dataWithSources, bySource).rows).toHaveLength(2);
  });

  it('adds a column per source found in daily rows', () => {
    const sheet = buildSpendOverTimeSheet(dataWithSources, bySource);
    const keys = sheet.columns.map(c => c.key);

    expect(keys).toContain('src_agents');
    expect(keys).toContain('src_chat');
  });

  it('carries per-source spend on each day', () => {
    const rows = buildSpendOverTimeSheet(dataWithSources, bySource).rows;

    expect(rows[0].src_agents).toBe(3);
    expect(rows[0].src_chat).toBe(1);
  });

  it('leaves source columns empty for days with no breakdown', () => {
    const sparse = {
      period_start: '2026-07-01',
      period_end: '2026-07-01',
      daily: [{ date: '2026-07-01', spend: 4, total_tokens: 100, api_requests: 2 }],
    };
    const rows = buildSpendOverTimeSheet(sparse, bySource).rows;

    expect(rows[0].src_agents).toBe('');
  });

  it('tolerates no daily data', () => {
    expect(buildSpendOverTimeSheet({ daily: [] }, []).rows).toEqual([]);
  });
});

describe('spend by source sheet', () => {
  const bySource = [
    { source: 'agents', spend: 6, total_tokens: 300, api_requests: 10 },
    { source: 'chat', spend: 4, total_tokens: 200, api_requests: 8 },
  ];

  it('orders by spend, highest first', () => {
    const rows = buildSpendBySourceSheet(bySource).rows;

    expect(rows[0].source).toBe('Agents');
    expect(rows[1].source).toBe('Chat');
  });

  it('sums share percentages to 100', () => {
    const rows = buildSpendBySourceSheet(bySource).rows;
    const total = rows.reduce((sum, r) => sum + r.share, 0);

    expect(total).toBeCloseTo(100, 1);
  });

  it('uses display labels, not raw keys', () => {
    const rows = buildSpendBySourceSheet([{ source: 'external', spend: 1 }]).rows;

    expect(rows[0].source).toBe('External API');
  });

  it('tolerates an empty list', () => {
    expect(buildSpendBySourceSheet([]).rows).toEqual([]);
    expect(buildSpendBySourceSheet(undefined).rows).toEqual([]);
  });
});

describe('month vs month sheet', () => {
  const currentDaily = [
    { date: '2026-07-01', spend: 4 },
    { date: '2026-07-02', spend: 6 },
    { date: '2026-07-03', spend: 2 },
  ];
  const prevDaily = [
    { date: '2026-06-01', spend: 3 },
    { date: '2026-06-02', spend: 5 },
  ];

  it('has one row per day of the longer period', () => {
    const sheet = buildMomSheet({ currentDaily, prevDaily });

    expect(sheet.rows).toHaveLength(3); // current is longer
  });

  it('carries cumulative spend, not daily', () => {
    const rows = buildMomSheet({ currentDaily, prevDaily, currentLabel: 'Jul', prevLabel: 'Jun' }).rows;

    expect(rows[0].Jul).toBeCloseTo(4);
    expect(rows[1].Jul).toBeCloseTo(10); // 4 + 6
    expect(rows[2].Jul).toBeCloseTo(12); // 4 + 6 + 2
  });

  it('leaves cells empty for days past the shorter period', () => {
    const rows = buildMomSheet({ currentDaily, prevDaily, currentLabel: 'Jul', prevLabel: 'Jun' }).rows;

    // prevDaily only has 2 days; day 3 should be empty for prior month
    expect(rows[2].Jun).toBe('');
  });

  it('uses custom labels as column headers', () => {
    const sheet = buildMomSheet({ currentDaily, prevDaily, currentLabel: '2026-07', prevLabel: '2026-06' });
    const keys = sheet.columns.map(c => c.key);

    expect(keys).toContain('2026-07');
    expect(keys).toContain('2026-06');
  });

  it('tolerates empty daily arrays', () => {
    const sheet = buildMomSheet({ currentDaily: [], prevDaily: [] });

    expect(sheet.rows).toHaveLength(0);
  });
});

describe('top agents sheet', () => {
  const agents = [
    { name: 'Research bot', id: 1, type: 'agent', spend: 4.5, runs: 10 },
    { name: 'Deploy pipeline', id: 2, type: 'pipeline', spend: 2.0, runs: 5 },
    { name: 'Summariser', id: 3, type: 'agent', spend: 1.0, runs: null },
  ];

  it('orders by spend, highest first', () => {
    const rows = buildTopAgentsSheet(agents).rows;

    expect(rows.map(r => r.name)).toEqual(['Research bot', 'Deploy pipeline', 'Summariser']);
  });

  it('labels agents and pipelines correctly', () => {
    const rows = buildTopAgentsSheet(agents).rows;

    expect(rows[0].type).toBe('Agent');
    expect(rows[1].type).toBe('Pipeline');
  });

  it('computes per-run cost when runs are known', () => {
    const rows = buildTopAgentsSheet(agents).rows;

    expect(rows[0].perRun).toBeCloseTo(0.45, 5);
  });

  it('leaves per-run empty when runs are null', () => {
    const rows = buildTopAgentsSheet(agents).rows;

    expect(rows[2].perRun).toBe('');
  });

  it('tolerates an empty list', () => {
    expect(buildTopAgentsSheet([]).rows).toEqual([]);
    expect(buildTopAgentsSheet(undefined).rows).toEqual([]);
  });
});

describe('top skills sheet', () => {
  const skills = [
    { name: 'Code review', spend: 6.0, uses: 30 },
    { name: 'Summarise', spend: 2.0, call_count: 20 },
    { name: 'Translate', spend: 2.0, uses: null },
  ];

  it('orders by spend, highest first', () => {
    const rows = buildTopSkillsSheet(skills).rows;

    expect(rows[0].name).toBe('Code review');
  });

  it('falls back to call_count when uses is absent', () => {
    const rows = buildTopSkillsSheet(skills).rows;

    expect(rows[1].uses).toBe(20);
  });

  it('computes per-use cost when uses are known', () => {
    const rows = buildTopSkillsSheet(skills).rows;

    expect(rows[0].perUse).toBeCloseTo(0.2, 5);
  });

  it('leaves per-use empty when uses are null', () => {
    const rows = buildTopSkillsSheet(skills).rows;

    expect(rows[2].perUse).toBe('');
  });

  it('sums share percentages to 100', () => {
    const rows = buildTopSkillsSheet(skills).rows;
    const total = rows.reduce((sum, r) => sum + r.share, 0);

    expect(total).toBeCloseTo(100, 1);
  });

  it('tolerates an empty list', () => {
    expect(buildTopSkillsSheet([]).rows).toEqual([]);
    expect(buildTopSkillsSheet(undefined).rows).toEqual([]);
  });
});

describe('sheet selection per scope (with new sheets)', () => {
  it('includes Top Agents and Top Skills when the payload lists them', () => {
    const dataWithMore = {
      ...limitedUsage(),
      top_agents: [{ name: 'A', spend: 1, runs: 1, type: 'agent' }],
      top_skills: [{ name: 'S', spend: 1, uses: 1 }],
    };
    const names = buildUsageSheets({
      data: dataWithMore,
      projectName: 'P',
      isPersonalProject: true,
      scope: 'project',
    }).map(s => s.sheetName);

    expect(names).toContain('Top Agents');
    expect(names).toContain('Top Skills');
  });

  it('omits Top Agents and Top Skills when the payload has none', () => {
    const names = buildUsageSheets({
      data: limitedUsage(),
      projectName: 'P',
      isPersonalProject: true,
      scope: 'project',
    }).map(s => s.sheetName);

    expect(names).not.toContain('Top Agents');
    expect(names).not.toContain('Top Skills');
  });
});

describe('file name', () => {
  const today = new Date('2026-07-28T12:00:00Z');

  it('names the project, scope and date', () => {
    expect(
      usageExportFileName({
        projectName: 'Bugs and Features',
        scope: 'project',
        isPersonalProject: false,
        today,
      }),
    ).toBe('Usage_Bugs_and_Features_Whole_Project_2026-07-28.xlsx');
  });

  it('marks a my-usage export', () => {
    expect(
      usageExportFileName({
        projectName: 'Bugs and Features',
        scope: 'user',
        isPersonalProject: false,
        today,
      }),
    ).toBe('Usage_Bugs_and_Features_My_Usage_2026-07-28.xlsx');
  });

  it('treats a private project as whole-project scope', () => {
    expect(
      usageExportFileName({ projectName: 'Private', scope: 'user', isPersonalProject: true, today }),
    ).toBe('Usage_Private_Whole_Project_2026-07-28.xlsx');
  });

  it('strips characters a filesystem would reject', () => {
    const name = usageExportFileName({
      projectName: 'a/b:c*?"<>|d',
      scope: 'project',
      isPersonalProject: false,
      today,
    });

    expect(name).toBe('Usage_abcd_Whole_Project_2026-07-28.xlsx');
  });

  it('falls back when the project name is missing or only punctuation', () => {
    for (const projectName of [undefined, '', '///']) {
      expect(usageExportFileName({ projectName, scope: 'project', isPersonalProject: false, today })).toBe(
        'Usage_Project_Whole_Project_2026-07-28.xlsx',
      );
    }
  });
});
