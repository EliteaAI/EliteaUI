import { describe, expect, it, vi } from 'vitest';

import { ExcelFormats } from '@/[fsd]/shared/lib/utils';

import {
  buildAnalyticsSheets,
  buildRunAnalyticsSheets,
  fetchRunAnalyticsData,
  fmtRunDateTime,
  runAnalyticsExportFileName,
} from '../analyticsExport.helpers';

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
