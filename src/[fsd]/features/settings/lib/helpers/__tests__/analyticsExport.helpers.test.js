// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExcelFormats, exportToExcel } from '@/[fsd]/shared/lib/utils';

import {
  buildAgentAnalyticsExportFileName,
  buildAgentDetailSheet,
  buildAnalyticsSheets,
  buildChatAnalyticsExportFileName,
  buildChatDetailSheet,
  buildChatsSheet,
  buildRunAnalyticsSheets,
  exportChatDetail,
  fetchAllAgentRuns,
  fetchAllChatRuns,
  fetchRunAnalyticsData,
  fmtRunDateTime,
  runAnalyticsExportFileName,
} from '../analyticsExport.helpers';

vi.mock('@/[fsd]/shared/lib/utils', async importOriginal => ({
  ...(await importOriginal()),
  exportToExcel: vi.fn(() => Promise.resolve()),
}));

const RUN_META = {
  scopeRows: [
    ['Project', 'Team'],
    ['Agent', 'Reviewer'],
    ['Run ID', '555'],
    ['Run Date/Time', '2026-09-02 12:23:00'],
    ['Version', 'base'],
  ],
  noDataMessage: 'No analytics data is available for this run.',
  timeZone: 'UTC',
};

const EVAL_META = {
  scopeRows: [
    ['Project', 'Team'],
    ['Agent', 'Reviewer'],
    ['Evaluated Version', 'base'],
    ['Suite', 'Tester'],
    ['Evaluation Run ID', 9],
  ],
  noDataMessage: 'Analytics is unavailable for this evaluation run because tracking data is missing.',
  timeZone: 'UTC',
};

const COSTS = {
  kpis: { total_cost: 2, total_tokens: 300 },
  by_user: [{ user_email: 'a@b.c', total_cost: 2, input_tokens: 200, output_tokens: 100 }],
  by_model: [{ model_name: 'gpt', total_cost: 2, input_tokens: 200, output_tokens: 100 }],
  by_agent: [{ entity_name: 'Reviewer', total_cost: 2 }],
  daily: [{ date: '2026-09-02', total_cost: 2 }],
};

const sectionTitles = sheet => sheet.sections.map(section => section.title);

describe('buildRunAnalyticsSheets', () => {
  const sheets = buildRunAnalyticsSheets({
    costs: COSTS,
    tools: { rows: [{ tool_name: 'search', calls: 3 }] },
    health: { health: [{ event_type: 'llm', total: 3 }], daily_activity: [{ date: '2026-09-02' }] },
    meta: RUN_META,
  });

  it('exports exactly the four run tabs in order', () => {
    expect(sheets.map(sheet => sheet.sheetName)).toEqual(['Costs', 'Tokens', 'Tools', 'Health']);
  });

  it('leaves out daily, per-Agent, most-popular and trend sections', () => {
    const [costs, tokens, tools, health] = sheets;

    expect(sectionTitles(costs)).toEqual(['Summary Metrics', 'Cost by User', 'Cost by Model']);
    expect(sectionTitles(tokens)).toEqual(['Token Summary', 'Token Usage by User', 'Token Usage by Model']);
    expect(sectionTitles(tools)).toEqual(['Tool Details']);
    expect(sectionTitles(health)).toEqual(['Health by Event Type']);
  });

  it('describes the run instead of a date range in the metadata', () => {
    const metadata = Object.fromEntries(sheets[0].metadata);

    expect(metadata).toMatchObject({
      Project: 'Team',
      Agent: 'Reviewer',
      'Run ID': '555',
      'Run Date/Time': '2026-09-02 12:23:00',
      Version: 'base',
      'Exported Tab': 'Costs',
      'Time Zone': 'UTC',
    });
    expect(metadata).not.toHaveProperty('From');
  });

  it('uses the run total as the share denominator', () => {
    const userSection = sheets[0].sections.find(section => section.title === 'Cost by User');

    expect(userSection.rows[0].share).toBe(100);
  });

  it('marks empty run sections with the run empty-state message', () => {
    const [, , tools] = buildRunAnalyticsSheets({ costs: {}, tools: {}, health: {}, meta: RUN_META });

    expect(tools.sections[0].rows[0].tool_name).toBe('No analytics data is available for this run.');
  });

  it('describes an evaluation run with its own identity rows and missing-data message', () => {
    const [costs, , tools] = buildRunAnalyticsSheets({ costs: {}, tools: {}, health: {}, meta: EVAL_META });
    const metadata = Object.fromEntries(costs.metadata);

    expect(metadata).toMatchObject({ Suite: 'Tester', 'Evaluation Run ID': 9, 'Evaluated Version': 'base' });
    expect(tools.sections[0].rows[0].tool_name).toBe(EVAL_META.noDataMessage);
  });
});

describe('buildAnalyticsSheets — evaluation spend', () => {
  const [, costs] = buildAnalyticsSheets({
    costs: {
      ...COSTS,
      kpis: { total_cost: 4, total_evaluation_cost: 1.5 },
      by_agent: [
        { entity_name: 'Reviewer', entity_kind: 'agent', total_cost: 3 },
        { entity_name: 'Flow', entity_kind: 'pipeline', total_cost: 1 },
      ],
      by_evaluation: [
        { entity_name: 'Reviewer', entity_kind: 'agent', version_name: 'base', eval_runs: 4, total_cost: 1 },
        { entity_name: 'Flow', entity_kind: 'pipeline', eval_runs: 2, total_cost: 0.5 },
      ],
    },
    meta: { projectName: 'Team', dateFrom: '2026-09-01', dateTo: '2026-09-30', timeZone: 'UTC' },
  });
  const section = title => costs.sections.find(s => s.title === title);

  it('adds the evaluation cost to the summary metrics', () => {
    expect(section('Summary Metrics').rows).toContainEqual({ metric: 'Evaluation Cost (USD)', value: 1.5 });
  });

  it('adds a Type column to the agent & pipeline section', () => {
    const agents = section('Cost by Agent & Pipeline');

    expect(agents.columns.map(c => c.header).slice(0, 2)).toEqual(['Agent / Pipeline', 'Type']);
    expect(agents.rows.map(r => r.kind)).toEqual(['Agent', 'Pipeline']);
  });

  it('exports a cost by evaluation section with type, version and runs', () => {
    const evaluations = section('Cost by Evaluation');

    expect(evaluations.columns.map(c => c.header).slice(0, 4)).toEqual([
      'Agent / Pipeline',
      'Type',
      'Version',
      'Runs',
    ]);
    expect(evaluations.rows[0]).toMatchObject({ name: 'Reviewer', kind: 'Agent', version: 'base', runs: 4 });
    expect(evaluations.rows[1]).toMatchObject({ name: 'Flow', kind: 'Pipeline', version: '', runs: 2 });
  });

  it('marks an empty cost by evaluation section with the no-data message', () => {
    const [, emptyCosts] = buildAnalyticsSheets({
      costs: {},
      meta: { projectName: 'Team', timeZone: 'UTC' },
    });
    const evaluations = emptyCosts.sections.find(s => s.title === 'Cost by Evaluation');

    expect(evaluations.rows).toEqual([{ name: 'No data available for the selected date range.' }]);
  });

  it('leaves evaluation spend out of run-scoped exports', () => {
    const [runCosts] = buildRunAnalyticsSheets({ costs: COSTS, tools: {}, health: {}, meta: RUN_META });

    expect(sectionTitles(runCosts)).not.toContain('Cost by Evaluation');
    expect(runCosts.sections[0].rows.map(r => r.metric)).not.toContain('Evaluation Cost (USD)');
  });
});

describe('fetchRunAnalyticsData', () => {
  it.each([
    ['an Agent/Pipeline run', { runId: '555' }],
    ['an evaluation run', { evalRunId: 9 }],
  ])('requests only datasets scoped to %s, with tools unpaginated', async (_, queryArgs) => {
    const endpoint = name => ({ initiate: vi.fn(args => ({ name, args })) });
    const endpoints = {
      analyticsCosts: endpoint('costs'),
      analyticsTools: endpoint('tools'),
      projectAnalytics: endpoint('health'),
    };
    const dispatch = vi.fn(action => Promise.resolve({ data: action.name }));

    const result = await fetchRunAnalyticsData(dispatch, endpoints, { projectId: 1, queryArgs });

    expect(result).toEqual({ costs: 'costs', tools: 'tools', health: 'health' });
    expect(endpoints.analyticsCosts.initiate).toHaveBeenCalledWith({ projectId: 1, ...queryArgs });
    expect(endpoints.projectAnalytics.initiate).toHaveBeenCalledWith({ projectId: 1, ...queryArgs });
    expect(endpoints.analyticsTools.initiate).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 1, ...queryArgs, offset: 0, search: '', limit: 10_000 }),
    );
  });
});

describe('runAnalyticsExportFileName', () => {
  it('names the file after project, entity and run', () => {
    expect(
      runAnalyticsExportFileName({ projectName: 'Team', entityName: 'Reviewer', suffix: 'run-555' }),
    ).toBe('Team_Reviewer_run-555.xlsx');
    expect(
      runAnalyticsExportFileName({ projectName: 'Team', entityName: 'Reviewer', suffix: 'eval-run-9' }),
    ).toBe('Team_Reviewer_eval-run-9.xlsx');
  });
});

describe('fmtRunDateTime', () => {
  it('formats a run timestamp as date and local time', () => {
    expect(fmtRunDateTime('2026-09-27T12:57:00Z')).toMatch(/^2026-09-27 \d{2}:\d{2}:\d{2}$/);
  });

  it('falls back to a dash when the run timestamp is missing', () => {
    expect(fmtRunDateTime(undefined)).toBe('—');
    expect(fmtRunDateTime(null)).toBe('—');
  });
});

describe('buildAnalyticsSheets — skill usage', () => {
  const META = { projectName: 'Team', dateFrom: '2026-09-01', dateTo: '2026-09-30', timeZone: 'UTC' };
  const DATA = {
    overview: {},
    overviewUsage: {
      kpis: { agent_runs: 7, skill_runs: 5, total_tokens: 1000 },
      daily_activity: [{ date: '2026-09-02', agent_runs: 7, skill_runs: 5 }],
      top_ai_users: [{ user_email: 'a@b.c', agent_runs: 7, skill_runs: 5 }],
    },
    costs: {
      kpis: { total_cost: 10, total_tokens: 1000 },
      by_agent: [{ entity_name: 'Reviewer', entity_kind: 'agent', total_cost: 6 }],
      by_skill: [
        { skill_name: 'Summarize', total_cost: 1, input_tokens: 100, output_tokens: 50 },
        { skill_name: 'Translate', deleted: true, total_cost: 3, input_tokens: 200, output_tokens: 100 },
      ],
    },
    users: { rows: [{ user_email: 'a@b.c', agent_events: 7, skill_events: 5 }] },
    skills: {},
    meta: META,
  };
  const sheetsWith = includeSkills => buildAnalyticsSheets({ ...DATA, includeSkills });
  const sheet = (sheets, name) => sheets.find(s => s.sheetName === name);
  const section = (sheets, name, title) => sheet(sheets, name).sections.find(s => s.title === title);
  const headers = sec => sec.columns.map(c => c.header);

  describe('with includeSkills', () => {
    const sheets = sheetsWith(true);

    it('adds a Skill Runs KPI right after Agent & Pipeline Runs', () => {
      const metrics = section(sheets, 'Overview', 'Summary Metrics').rows;
      const agentIndex = metrics.findIndex(r => r.metric === 'Agent & Pipeline Runs');

      expect(metrics[agentIndex + 1]).toEqual({ metric: 'Skill Runs', value: 5 });
    });

    it('adds a Skill Runs column after Agent & Pipeline Runs in daily activity and top adopters', () => {
      ['Daily Activity', 'Top AI Adopters'].forEach(title => {
        const sec = section(sheets, 'Overview', title);

        expect(headers(sec).slice(-2)).toEqual(['Agent & Pipeline Runs', 'Skill Runs']);
        expect(sec.columns.at(-1)).toEqual({
          header: 'Skill Runs',
          key: 'skill_runs',
          numFmt: ExcelFormats.integer,
        });
        expect(sec.rows[0].skill_runs).toBe(5);
      });
    });

    it('exports cost by skill after cost by agent & pipeline, sorted by cost with a share of the skill total', () => {
      const titles = sectionTitles(sheet(sheets, 'Costs'));
      const skills = section(sheets, 'Costs', 'Cost by Skill');

      expect(titles.indexOf('Cost by Skill')).toBe(titles.indexOf('Cost by Agent & Pipeline') + 1);
      expect(headers(skills)).toEqual([
        'Skill',
        'Total Cost (USD)',
        'Input Token Cost (USD)',
        'Output Token Cost (USD)',
        'Cache Read Cost (USD)',
        'Cache Write Cost (USD)',
        'Share (%)',
      ]);
      expect(skills.columns[1].numFmt).toBe(ExcelFormats.currency);
      expect(skills.rows.map(r => [r.name, r.total_cost, r.share])).toEqual([
        ['Translate (deleted)', 3, 75],
        ['Summarize', 1, 25],
      ]);
    });

    it('marks an empty cost by skill section with the no-data message', () => {
      const emptyCosts = sheet(
        buildAnalyticsSheets({ ...DATA, costs: {}, includeSkills: true }),
        'Costs',
      ).sections.find(s => s.title === 'Cost by Skill');

      expect(emptyCosts.rows).toEqual([{ name: 'No data available for the selected date range.' }]);
    });

    it('marks an empty token usage by skill section with the no-data message', () => {
      const emptyTokens = sheet(
        buildAnalyticsSheets({ ...DATA, costs: {}, includeSkills: true }),
        'Tokens',
      ).sections.find(s => s.title === 'Token Usage by Skill');

      expect(emptyTokens.rows).toEqual([{ name: 'No data available for the selected date range.' }]);
    });

    it('exports token usage by skill last, with the share of project tokens', () => {
      const tokens = sheet(sheets, 'Tokens');
      const skills = section(sheets, 'Tokens', 'Token Usage by Skill');

      expect(sectionTitles(tokens).slice(-2)).toEqual([
        'Token Usage by Agent & Pipeline',
        'Token Usage by Skill',
      ]);
      expect(headers(skills)[0]).toBe('Skill');
      expect(skills.rows.map(r => [r.name, r.total_tokens, r.share])).toEqual([
        ['Translate (deleted)', 300, 30],
        ['Summarize', 150, 15],
      ]);
    });

    it('adds a Skill Runs column after Agent & Pipeline Runs in the users sheet', () => {
      const users = section(sheets, 'Users', 'User Activity');
      const agentIndex = headers(users).indexOf('Agent & Pipeline Runs');

      expect(users.columns[agentIndex + 1]).toEqual({
        header: 'Skill Runs',
        key: 'skill_events',
        numFmt: ExcelFormats.integer,
      });
      expect(users.rows[0].skill_events).toBe(5);
    });
  });

  describe('without includeSkills', () => {
    const sheets = sheetsWith(false);

    it('leaves the Skill Runs KPI and columns out of the overview', () => {
      expect(section(sheets, 'Overview', 'Summary Metrics').rows.map(r => r.metric)).not.toContain(
        'Skill Runs',
      );
      expect(headers(section(sheets, 'Overview', 'Daily Activity'))).toEqual([
        'Date',
        'Active Users',
        'LLM Calls',
        'Tool Runs',
        'Agent & Pipeline Runs',
      ]);
      expect(headers(section(sheets, 'Overview', 'Top AI Adopters'))).toEqual([
        'User',
        'AI Events',
        'LLM Calls',
        'Tool Runs',
        'Agent & Pipeline Runs',
      ]);
    });

    it('leaves the skill sections out of the costs and tokens sheets', () => {
      expect(sectionTitles(sheet(sheets, 'Costs'))).toEqual([
        'Summary Metrics',
        'Daily Cost Trend',
        'Cost by User',
        'Cost by Model',
        'Cost by Agent & Pipeline',
        'Cost by Evaluation',
      ]);
      expect(sectionTitles(sheet(sheets, 'Tokens'))).toEqual([
        'Token Summary',
        'Daily Token Usage',
        'Token Usage by User',
        'Token Usage by Model',
        'Token Usage by Agent & Pipeline',
      ]);
    });

    it('leaves the Skill Runs column out of the users sheet', () => {
      expect(headers(section(sheets, 'Users', 'User Activity'))).not.toContain('Skill Runs');
    });

    it('differs from the skill export only by the skill additions', () => {
      const withSkills = sheetsWith(true);
      const stripSkills = sheetList =>
        sheetList
          .filter(s => s.sheetName !== 'Skills')
          .map(s => ({
            ...s,
            metadata: s.metadata.filter(([label]) => label !== 'Exported At'),
            sections: s.sections
              .filter(sec => !['Cost by Skill', 'Token Usage by Skill'].includes(sec.title))
              .map(sec => ({
                ...sec,
                columns: sec.columns.filter(c => c.header !== 'Skill Runs'),
                rows: sec.rows.filter(r => r.metric !== 'Skill Runs'),
              })),
          }));

      expect(stripSkills(sheets)).toEqual(stripSkills(withSkills));
    });
  });
});

const META = {
  projectName: 'Team',
  dateFrom: '2026-10-01T00:00:00Z',
  dateTo: '2026-10-10T00:00:00Z',
  timeZone: 'UTC',
};

const AGENT_DETAIL = {
  entity_name: 'Reviewer',
  kind: 'pipeline',
  kpis: { total_events: 3, unique_users: 1, total_tokens: 1500, llm_cost: 0.0123 },
  daily_usage: [{ date: '2026-10-01', events: 3, errors: 1 }],
  users: [{ user_id: 11, user_email: null, events: 3, avg_duration_ms: 1200, errors: 1 }],
  tools: [{ tool_name: 'search', calls: 4 }],
  skills: [{ skill_id: 5, skill_name: 'Summarizer', deleted: true, uses: 2 }],
  by_version: [{ version_id: null, version_name: null, runs: 3, total_tokens: 1500, cost: 0.0123 }],
  by_model: [
    { model_name: 'gpt-4o', display_name: null, runs: 2, calls: 5, total_tokens: 1500, cost: 0.0123 },
  ],
  by_trigger_source: [{ trigger_source: 'manual', runs: 3, total_tokens: 1500, cost: 0.0123 }],
};

const AGENT_RUN = {
  run_id: 'r1',
  started_at: '2026-10-01T09:12:03+00:00',
  user_id: 11,
  user_email: 'a@b.c',
  version_id: null,
  version_name: null,
  models: [
    { model_name: 'gpt-4o', display_name: 'GPT-4o' },
    { model_name: 'claude', display_name: 'Claude' },
  ],
  total_tokens: 1500,
  cost: 0.0123,
  is_error: true,
  run_url: 'https://host/2/pipelines/all/42/history/analytics?usage_run_id=r1',
};

const sectionOf = (sheet, title) => sheet.sections.find(section => section.title === title);

describe('buildAgentDetailSheet', () => {
  it('writes every agent detail table in page order, Skills only with the permission', () => {
    const withSkills = buildAgentDetailSheet(AGENT_DETAIL, { ...META, runs: [], includeSkills: true });
    const withoutSkills = buildAgentDetailSheet(AGENT_DETAIL, { ...META, runs: [] });

    expect(withSkills.sections.map(section => section.title)).toEqual([
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
    expect(withoutSkills.sections.map(section => section.title)).not.toContain('Skills');
  });

  it('names the sheet by kind and the entity in the metadata', () => {
    const sheet = buildAgentDetailSheet(AGENT_DETAIL, { ...META, runs: [] });

    expect(sheet.sheetName).toBe('Pipeline');
    expect(sheet.metadata[0]).toEqual(['Pipeline', 'Reviewer']);
    expect(buildAgentDetailSheet({ ...AGENT_DETAIL, kind: 'agent' }, { ...META }).sheetName).toBe('Agent');
  });

  it('labels the rows with no version, model display name or trigger like the page does', () => {
    const sheet = buildAgentDetailSheet(AGENT_DETAIL, { ...META, runs: [] });

    expect(sectionOf(sheet, 'Versions').rows[0].version_name).toBe('Unknown version');
    expect(sectionOf(sheet, 'Models').rows[0].display_name).toBe('gpt-4o');
    expect(sectionOf(sheet, 'Trigger Sources').rows[0].trigger_source).toBe('Manual');
    expect(sectionOf(sheet, 'Users').rows[0].user_email).toBe('User 11');
  });

  it('keeps full numbers, not the page abbreviations', () => {
    const sheet = buildAgentDetailSheet(AGENT_DETAIL, { ...META, runs: [AGENT_RUN] });

    expect(sectionOf(sheet, 'Versions').rows[0]).toMatchObject({ runs: 3, total_tokens: 1500, cost: 0.0123 });
    expect(sectionOf(sheet, 'Models').columns.find(column => column.key === 'cost').numFmt).toBe(
      ExcelFormats.currency,
    );
    expect(sectionOf(sheet, 'KPIs').rows).toContainEqual({ metric: 'Total Tokens', value: 1500 });
    const models = sectionOf(sheet, 'Models');
    const llmCalls = models.columns.find(column => column.header === 'LLM Calls');
    expect(models.rows[0][llmCalls.key]).toBe(5);
  });

  it('writes every run with all its models, its status and its run URL', () => {
    const sheet = buildAgentDetailSheet(AGENT_DETAIL, { ...META, runs: [AGENT_RUN] });
    const runs = sectionOf(sheet, 'Recent Runs');

    expect(runs.columns.map(column => column.header)).toContain('Run URL');
    expect(runs.rows[0]).toMatchObject({
      models: 'GPT-4o, Claude',
      version_name: 'Unknown version',
      is_error: 'Error',
      run_url: AGENT_RUN.run_url,
    });
  });
});

describe('fetchAllAgentRuns', () => {
  it('pages through every run 100 at a time', async () => {
    const pages = [
      { total: 150, rows: Array.from({ length: 100 }, (_, index) => ({ run_id: `a${index}` })) },
      { total: 150, rows: Array.from({ length: 50 }, (_, index) => ({ run_id: `b${index}` })) },
    ];
    const endpoints = { analyticsAgentRuns: { initiate: vi.fn(args => args) } };
    const dispatch = vi.fn(args => ({
      unwrap: () => Promise.resolve(pages[args.offset / 100]),
      unsubscribe: vi.fn(),
    }));

    const { runs, truncated } = await fetchAllAgentRuns(dispatch, endpoints, { projectId: 2, entityId: 42 });

    expect(runs).toHaveLength(150);
    expect(truncated).toBe(false);
    expect(
      endpoints.analyticsAgentRuns.initiate.mock.calls.map(([args]) => [args.limit, args.offset]),
    ).toEqual([
      [100, 0],
      [100, 100],
    ]);
  });

  it('stops on an empty page', async () => {
    const endpoints = { analyticsAgentRuns: { initiate: vi.fn(args => args) } };
    const dispatch = vi.fn(() => ({
      unwrap: () => Promise.resolve({ total: 10, rows: [] }),
      unsubscribe: vi.fn(),
    }));

    expect((await fetchAllAgentRuns(dispatch, endpoints, { projectId: 2, entityId: 42 })).runs).toEqual([]);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe('fetchAllAgentRuns export limit', () => {
  const pagedRuns = total => {
    const subscriptions = [];
    const endpoints = { analyticsAgentRuns: { initiate: vi.fn(args => args) } };
    const dispatch = vi.fn(args => {
      const subscription = {
        unwrap: () =>
          Promise.resolve({
            total,
            rows: Array.from({ length: Math.max(0, Math.min(100, total - args.offset)) }, (_, index) => ({
              run_id: `r${args.offset + index}`,
            })),
          }),
        unsubscribe: vi.fn(),
      };
      subscriptions.push(subscription);
      return subscription;
    });
    return { dispatch, endpoints, subscriptions };
  };

  it('stops at 10,000 runs and says the list was cut', async () => {
    const { dispatch, endpoints } = pagedRuns(25_000);

    const result = await fetchAllAgentRuns(dispatch, endpoints, { projectId: 2, entityId: 42 });

    expect(result.runs).toHaveLength(10_000);
    expect(result).toMatchObject({ total: 25_000, truncated: true });
    expect(dispatch).toHaveBeenCalledTimes(100);
  });

  it('exports a smaller set whole, without the marker', async () => {
    const { dispatch, endpoints } = pagedRuns(250);

    const result = await fetchAllAgentRuns(dispatch, endpoints, { projectId: 2, entityId: 42 });

    expect(result.runs).toHaveLength(250);
    expect(result.truncated).toBe(false);
  });

  it('releases every page subscription', async () => {
    const { dispatch, endpoints, subscriptions } = pagedRuns(250);

    await fetchAllAgentRuns(dispatch, endpoints, { projectId: 2, entityId: 42 });

    expect(subscriptions).toHaveLength(3);
    subscriptions.forEach(subscription => expect(subscription.unsubscribe).toHaveBeenCalledTimes(1));
  });

  it('releases the subscription of a page that fails', async () => {
    const unsubscribe = vi.fn();
    const endpoints = { analyticsAgentRuns: { initiate: vi.fn(args => args) } };
    const dispatch = vi.fn(() => ({ unwrap: () => Promise.reject(new Error('boom')), unsubscribe }));

    await expect(fetchAllAgentRuns(dispatch, endpoints, { projectId: 2, entityId: 42 })).rejects.toThrow(
      'boom',
    );
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('buildAgentDetailSheet Recent Runs marker', () => {
  it('names a cut Recent Runs section with how many runs it holds of the total', () => {
    const sheet = buildAgentDetailSheet(AGENT_DETAIL, {
      ...META,
      runs: [AGENT_RUN],
      runsTotal: 25_000,
      runsTruncated: true,
    });

    expect(sheet.sections.at(-1).title).toBe('Recent Runs (first 1 of 25,000 runs)');
  });

  it('keeps the plain title for a complete list', () => {
    const sheet = buildAgentDetailSheet(AGENT_DETAIL, { ...META, runs: [AGENT_RUN], runsTotal: 1 });

    expect(sheet.sections.at(-1).title).toBe('Recent Runs');
  });
});

describe('fetchAllAgentRuns with runs starting during the export', () => {
  it('lists every run exactly once when a new run shifts the next page', async () => {
    const runIds = rows => rows.map(run_id => ({ run_id }));
    const pages = {
      0: { total: 3, rows: runIds(['r3', 'r2']) },
      2: { total: 4, rows: runIds(['r2', 'r1']) },
      4: { total: 4, rows: [] },
    };
    const endpoints = { analyticsAgentRuns: { initiate: vi.fn(args => args) } };
    const dispatch = vi.fn(args => ({
      unwrap: () => Promise.resolve(pages[args.offset]),
      unsubscribe: vi.fn(),
    }));

    const { runs } = await fetchAllAgentRuns(dispatch, endpoints, { projectId: 2, entityId: 42 });

    expect(runs.map(run => run.run_id)).toEqual(['r3', 'r2', 'r1']);
  });
});

describe('buildAgentAnalyticsExportFileName', () => {
  it('names the file after project, kind, entity and range', () => {
    expect(
      buildAgentAnalyticsExportFileName({
        projectName: 'Team',
        entityName: 'Reviewer',
        kind: 'pipeline',
        dateFrom: '2026-10-01T12:00:00',
        dateTo: '2026-10-10T12:00:00',
      }),
    ).toBe('Team_pipeline_Reviewer_2026-10-01-2026-10-10.xlsx');
  });
});

// ─── Chat export helpers ─────────────────────────────────────────────────────

const CHAT_META = { projectName: 'Team', dateFrom: '2026-10-01', dateTo: '2026-10-08', timeZone: 'UTC' };

const CHATS_DATA = {
  summary: {
    active_chats: 4,
    responses: 20,
    users: 3,
    llm_cost: 0.008,
    total_tokens: 12000,
    avg_cost_per_chat: 0.002,
    avg_cost_per_response: 0.0004,
    share_of_project_cost: 0.25,
    errors: 1,
  },
  by_participant_type: [
    { participant_type: 'model', responses: 15, total_tokens: 9000, llm_cost: 0.006 },
    { participant_type: 'agent', responses: 5, total_tokens: 3000, llm_cost: 0.002 },
  ],
  daily: [{ date: '2026-10-01', responses: 5, total_tokens: 3000, llm_cost: 0.002 }],
  rows: [
    {
      chat_name: 'Review Chat',
      owner_email: 'alice@example.com',
      participants: [{ type: 'model' }, { type: 'agent' }],
      responses: 10,
      users: 2,
      llm_cost: 0.004,
      input_cost: 0.002,
      output_cost: 0.002,
      cache_read_cost: 0,
      cache_creation_cost: 0,
      total_tokens: 6000,
      input_tokens: 3000,
      output_tokens: 3000,
      cache_read_tokens: 0,
      cache_creation_tokens: 0,
      avg_cost_per_response: 0.0004,
      avg_duration_ms: 900,
      errors: 0,
      last_activity: '2026-10-08T10:00:00',
    },
  ],
};

const CHAT_DETAIL = {
  chat_name: 'Review Chat',
  kpis: {
    responses: 10,
    users: 2,
    errors: 1,
    llm_cost: 0.004,
    input_cost: 0.002,
    output_cost: 0.002,
    cache_read_cost: 0,
    cache_creation_cost: 0,
    total_tokens: 6000,
    input_tokens: 3000,
    output_tokens: 3000,
    cache_read_tokens: 0,
    cache_creation_tokens: 0,
    llm_calls: 12,
    tool_calls: 2,
    avg_cost_per_response: 0.0004,
    avg_duration_ms: 900,
    first_activity: '2026-10-01T09:00:00',
    last_activity: '2026-10-08T10:00:00',
  },
  daily_usage: [{ date: '2026-10-01', responses: 10, total_tokens: 6000, llm_cost: 0.004 }],
  by_participant: [
    { participant_type: 'model', responses: 8, total_tokens: 5000, llm_cost: 0.003, errors: 0 },
    { participant_type: 'agent', responses: 2, total_tokens: 1000, llm_cost: 0.001, errors: 1 },
  ],
  by_model: [
    {
      model_name: 'gpt-4o',
      display_name: 'GPT-4o',
      calls: 12,
      responses: 10,
      total_tokens: 6000,
      llm_cost: 0.004,
    },
  ],
  by_user: [
    { user_id: 11, user_email: 'alice@example.com', responses: 7, total_tokens: 4000, llm_cost: 0.003 },
  ],
  tools: [{ tool_name: 'search', calls: 2, errors: 0 }],
};

const CHAT_RUN = {
  run_id: 'cr1',
  started_at: '2026-10-01T09:12:03+00:00',
  user_email: 'alice@example.com',
  participant_type: 'agent',
  models: [{ model_name: 'gpt-4o', display_name: 'GPT-4o' }],
  total_tokens: 600,
  cost: 0.0004,
  is_error: false,
};

const chatSection = (sheet, title) => sheet.sections.find(s => s.title === title);

describe('buildChatsSheet — structure', () => {
  it('returns a sheet named "Chats" with four sections in order', () => {
    const sheet = buildChatsSheet(CHATS_DATA, CHAT_META);

    expect(sheet.sheetName).toBe('Chats');
    expect(sheet.sections.map(s => s.title)).toEqual([
      'Summary',
      'Chats by Participant Type',
      'Daily Chat Usage',
      'Chat Activity',
    ]);
  });

  it('includes Chat Users in summary for team projects', () => {
    const sheet = buildChatsSheet(CHATS_DATA, CHAT_META, false);
    const metrics = chatSection(sheet, 'Summary').rows.map(r => r.metric);

    expect(metrics).toContain('Chat Users');
  });

  it('omits Chat Users in summary for personal projects', () => {
    const sheet = buildChatsSheet(CHATS_DATA, CHAT_META, true);
    const metrics = chatSection(sheet, 'Summary').rows.map(r => r.metric);

    expect(metrics).not.toContain('Chat Users');
  });

  it('converts share_of_project_cost fraction to a percentage', () => {
    const sheet = buildChatsSheet(CHATS_DATA, CHAT_META);
    const share = chatSection(sheet, 'Summary').rows.find(r => r.metric === 'Share of Project Cost (%)');

    expect(share.value).toBe(25);
  });

  it('maps participant type to a human-readable label', () => {
    const sheet = buildChatsSheet(CHATS_DATA, CHAT_META);
    const labels = chatSection(sheet, 'Chats by Participant Type').rows.map(r => r.participant_type_label);

    expect(labels).toContain('Direct model');
    expect(labels).toContain('Agents');
  });

  it('includes Owner and Users columns for team projects, omits them for personal', () => {
    const team = buildChatsSheet(CHATS_DATA, CHAT_META, false);
    const personal = buildChatsSheet(CHATS_DATA, CHAT_META, true);
    const teamHeaders = chatSection(team, 'Chat Activity').columns.map(c => c.header);
    const personalHeaders = chatSection(personal, 'Chat Activity').columns.map(c => c.header);

    expect(teamHeaders).toContain('Owner');
    expect(teamHeaders).toContain('Users');
    expect(personalHeaders).not.toContain('Owner');
    expect(personalHeaders).not.toContain('Users');
  });

  it('joins participants array into a comma-separated string', () => {
    const sheet = buildChatsSheet(CHATS_DATA, CHAT_META);
    const activityRows = chatSection(sheet, 'Chat Activity').rows;

    expect(activityRows[0].participants).toBe('model, agent');
  });

  it('fills tabular sections with the no-data message when data is empty', () => {
    const emptySheet = buildChatsSheet({}, CHAT_META);
    const tabularSections = emptySheet.sections.filter(s => s.title !== 'Summary');

    for (const section of tabularSections) {
      expect(section.rows[0][section.columns[0].key]).toBe('No data available for the selected date range.');
    }
  });
});

describe('buildChatDetailSheet — structure', () => {
  it('returns a sheet named "Chat Detail" with sections in page order', () => {
    const sheet = buildChatDetailSheet(CHAT_DETAIL, { ...CHAT_META, runs: [CHAT_RUN] });

    expect(sheet.sheetName).toBe('Chat Detail');
    expect(sheet.sections.map(s => s.title)).toEqual([
      'KPIs',
      'Usage by Day',
      'Participants',
      'Models',
      'Users',
      'Tools',
      `Recent Responses (1)`,
    ]);
  });

  it('omits Users section for personal projects', () => {
    const sheet = buildChatDetailSheet(CHAT_DETAIL, { ...CHAT_META, runs: [], isPersonalProject: true });
    const titles = sheet.sections.map(s => s.title);

    expect(titles).not.toContain('Users');
  });

  it('maps participant_type to a human-readable label', () => {
    const sheet = buildChatDetailSheet(CHAT_DETAIL, { ...CHAT_META, runs: [] });
    const labels = chatSection(sheet, 'Participants').rows.map(r => r.participant_type);

    expect(labels).toContain('Direct model');
    expect(labels).toContain('Agents');
  });

  it('formats runs with participant label, joined models and status', () => {
    const sheet = buildChatDetailSheet(CHAT_DETAIL, { ...CHAT_META, runs: [CHAT_RUN] });
    const run = chatSection(sheet, 'Recent Responses (1)').rows[0];

    expect(run.participant).toBe('Agents');
    expect(run.models).toBe('GPT-4o');
    expect(run.is_error).toBe('Success');
  });

  it('names the truncated runs section with the count and total correctly', () => {
    const manyRuns = Array.from({ length: 50 }, (_, i) => ({ ...CHAT_RUN, run_id: `r${i}` }));
    const sheet = buildChatDetailSheet(CHAT_DETAIL, {
      ...CHAT_META,
      runs: manyRuns,
      runsTotal: 5000,
      runsTruncated: true,
    });

    expect(sheet.sections.at(-1).title).toBe('Recent Responses (first 50 of 5,000, cap reached)');
  });

  it('uses plain count title when the list is not truncated', () => {
    const sheet = buildChatDetailSheet(CHAT_DETAIL, {
      ...CHAT_META,
      runs: [CHAT_RUN],
      runsTotal: 1,
      runsTruncated: false,
    });

    expect(sheet.sections.at(-1).title).toBe('Recent Responses (1)');
  });

  it('omits User column from runs for personal projects', () => {
    const sheet = buildChatDetailSheet(CHAT_DETAIL, {
      ...CHAT_META,
      runs: [CHAT_RUN],
      isPersonalProject: true,
    });
    const runColumns = sheet.sections.at(-1).columns.map(c => c.header);

    expect(runColumns).not.toContain('User');
  });

  it('prefixes metadata with the chat name', () => {
    const sheet = buildChatDetailSheet(CHAT_DETAIL, { ...CHAT_META, runs: [] });

    expect(sheet.metadata[0]).toEqual(['Chat', 'Review Chat']);
  });
});

describe('buildChatAnalyticsExportFileName', () => {
  it('names the file after project, chat name and date range', () => {
    expect(
      buildChatAnalyticsExportFileName({
        projectName: 'Team',
        chatName: 'Review Chat',
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
      }),
    ).toBe('Team_chat_Review_Chat_2026-10-01-2026-10-08.xlsx');
  });

  it('falls back to "unknown" when chat name is absent', () => {
    expect(
      buildChatAnalyticsExportFileName({ projectName: 'Team', dateFrom: '2026-10-01', dateTo: '2026-10-08' }),
    ).toBe('Team_chat_unknown_2026-10-01-2026-10-08.xlsx');
  });
});

describe('fetchAllChatRuns', () => {
  const makeDispatch = pages => {
    const subscriptions = [];
    const dispatch = vi.fn(args => {
      const subscription = {
        unwrap: () => Promise.resolve(pages[args.offset] ?? { total: 0, rows: [] }),
        unsubscribe: vi.fn(),
      };
      subscriptions.push(subscription);
      return subscription;
    });
    return { dispatch, subscriptions };
  };

  const endpoints = { analyticsChatRuns: { initiate: vi.fn(args => args) } };

  it('collects runs across multiple pages', async () => {
    const { dispatch } = makeDispatch({
      0: { total: 3, rows: [{ run_id: 'a' }, { run_id: 'b' }] },
      2: { total: 3, rows: [{ run_id: 'c' }] },
    });

    const { runs, truncated } = await fetchAllChatRuns(dispatch, endpoints, {
      projectId: 1,
      conversationUuid: 'uuid-1',
    });

    expect(runs.map(r => r.run_id)).toEqual(['a', 'b', 'c']);
    expect(truncated).toBe(false);
  });

  it('stops on an empty page', async () => {
    const { dispatch } = makeDispatch({ 0: { total: 5, rows: [] } });

    const { runs } = await fetchAllChatRuns(dispatch, endpoints, {
      projectId: 1,
      conversationUuid: 'uuid-1',
    });

    expect(runs).toHaveLength(0);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('releases every page subscription', async () => {
    const { dispatch, subscriptions } = makeDispatch({
      0: { total: 2, rows: [{ run_id: 'a' }, { run_id: 'b' }] },
      2: { total: 2, rows: [] },
    });

    await fetchAllChatRuns(dispatch, endpoints, { projectId: 1, conversationUuid: 'uuid-1' });

    subscriptions.forEach(s => expect(s.unsubscribe).toHaveBeenCalledTimes(1));
  });
});

describe('exportChatDetail', () => {
  const baseArgs = {
    projectId: 1,
    conversationUuid: 'uuid-1',
    dateFrom: '2026-10-01',
    dateTo: '2026-10-08',
    isPersonalProject: false,
    projectName: 'Team',
  };

  const makeDeps = ({ detail = CHAT_DETAIL, runs = [CHAT_RUN], total = runs.length } = {}) => {
    const endpoints = {
      analyticsChatDetail: { initiate: vi.fn(args => ({ type: 'detail', args })) },
      analyticsChatRuns: { initiate: vi.fn(args => ({ type: 'runs', args })) },
    };
    const dispatch = vi.fn(action => {
      if (action.type === 'detail') return Promise.resolve({ data: detail });
      return {
        unwrap: () => Promise.resolve(action.args.offset === 0 ? { total, rows: runs } : { total, rows: [] }),
        unsubscribe: vi.fn(),
      };
    });
    return { dispatch, endpoints };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the chat detail when none is supplied and exports one Excel file', async () => {
    const { dispatch, endpoints } = makeDeps();

    await exportChatDetail(dispatch, endpoints, baseArgs);

    expect(endpoints.analyticsChatDetail.initiate).toHaveBeenCalledWith({
      projectId: 1,
      conversationUuid: 'uuid-1',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-08',
    });
    expect(exportToExcel).toHaveBeenCalledTimes(1);
    const [fileName, sheets] = exportToExcel.mock.calls[0];
    expect(fileName).toBe(
      buildChatAnalyticsExportFileName({
        projectName: 'Team',
        chatName: 'Review Chat',
        dateFrom: '2026-10-01',
        dateTo: '2026-10-08',
      }),
    );
    expect(sheets).toHaveLength(1);
  });

  it('reuses supplied chat data instead of requesting the detail again', async () => {
    const { dispatch, endpoints } = makeDeps();

    await exportChatDetail(dispatch, endpoints, { ...baseArgs, chatData: CHAT_DETAIL });

    expect(endpoints.analyticsChatDetail.initiate).not.toHaveBeenCalled();
    expect(exportToExcel).toHaveBeenCalledTimes(1);
  });

  it('includes the fetched runs in the exported sheet', async () => {
    const { dispatch, endpoints } = makeDeps({ runs: [CHAT_RUN] });

    await exportChatDetail(dispatch, endpoints, baseArgs);

    const expected = buildChatDetailSheet(CHAT_DETAIL, {
      runs: [CHAT_RUN],
      runsTotal: 1,
      runsTruncated: false,
      isPersonalProject: false,
      projectName: 'Team',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-08',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    expect(exportToExcel.mock.calls[0][1]).toEqual([expected]);
  });

  it('rejects when fetching the runs fails so the caller can show an error', async () => {
    const { endpoints } = makeDeps();
    const dispatch = vi.fn(action =>
      action.type === 'detail'
        ? Promise.resolve({ data: CHAT_DETAIL })
        : { unwrap: () => Promise.reject(new Error('boom')), unsubscribe: vi.fn() },
    );

    await expect(exportChatDetail(dispatch, endpoints, baseArgs)).rejects.toThrow('boom');
    expect(exportToExcel).not.toHaveBeenCalled();
  });
});
