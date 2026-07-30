import { describe, expect, it } from 'vitest';

import {
  budgetStatus,
  buildDailySheet,
  buildMembersSheet,
  buildModelSheet,
  buildSummarySheet,
  buildUsageSheets,
  usageExportFileName,
} from './usageExport.helpers';

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
      'Daily Usage',
      'Usage by Model',
      'Members',
    ]);
  });

  it('omits members for my usage', () => {
    expect(names({ isPersonalProject: false, scope: 'user' })).toEqual([
      'Usage Summary',
      'Daily Usage',
      'Usage by Model',
    ]);
  });

  // A private project's only member is its owner, so per-member data is meaningless
  it('omits members for a private project', () => {
    expect(names({ isPersonalProject: true, scope: 'project' })).toEqual([
      'Usage Summary',
      'Daily Usage',
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
