// Imported directly rather than through the barrel, which pulls in the redux store
import { ExcelFormats, sanitizeFileNamePart } from '@/[fsd]/shared/lib/utils/exportToExcel.utils';
import { isNullOrUndefined } from '@/common/utils';

import { fillDailyGaps, formatModelName, usageSeverity } from './usage.helpers';

const UNLIMITED = 'Unlimited';

// Budgets are monthly only, but the column is kept so the sheet shape survives if
// configurable periods are ever introduced.
const BUDGET_PERIOD = 'Monthly';

const SCOPE_USER = 'user';

const SOURCE_LABELS = {
  explicit: 'Explicit',
  default: 'Default',
  unlimited: 'Unlimited',
};

const STATUS_BY_SEVERITY = {
  exceeded: 'Limit reached',
  warning: 'Warning threshold reached',
  ok: 'Within budget',
  none: UNLIMITED,
};

const hasLimit = limit => !isNullOrUndefined(limit);

/** Blank rather than zero: an absent figure is not the same as nothing spent. */
const orBlank = value => (isNullOrUndefined(value) ? '' : value);

export const budgetStatus = (percentUsed, warningPct) =>
  STATUS_BY_SEVERITY[usageSeverity(percentUsed, warningPct)] || UNLIMITED;

export const buildSummarySheet = ({ data, projectName, isPersonalProject, scope }) => {
  const limit = data.effective_limit;
  const limited = hasLimit(limit);

  return {
    sheetName: 'Usage Summary',
    columns: [
      { header: 'Project Name', key: 'projectName' },
      { header: 'Project Type', key: 'projectType' },
      { header: 'Usage Scope', key: 'usageScope' },
      { header: 'Budget Period', key: 'budgetPeriod' },
      { header: 'Period Start', key: 'periodStart' },
      { header: 'Period End', key: 'periodEnd' },
      { header: 'Budget Source', key: 'budgetSource' },
      { header: 'Budget Limit (USD)', key: 'budgetLimit', numFmt: ExcelFormats.currency },
      { header: 'Spent (USD)', key: 'spent', numFmt: ExcelFormats.currency },
      { header: 'Used (%)', key: 'usedPercent', numFmt: ExcelFormats.percent },
      { header: 'Tokens', key: 'tokens', numFmt: ExcelFormats.integer },
      { header: 'Calls', key: 'calls', numFmt: ExcelFormats.integer },
      { header: 'Budget Status', key: 'budgetStatus' },
      { header: 'Warning Threshold (%)', key: 'warningThreshold', numFmt: ExcelFormats.percent },
    ],
    rows: [
      {
        projectName,
        projectType: isPersonalProject ? 'Private' : 'Team',
        usageScope: scope === SCOPE_USER ? 'My usage' : 'Whole project',
        budgetPeriod: BUDGET_PERIOD,
        periodStart: data.period_start || '',
        periodEnd: data.period_end || '',
        budgetSource: SOURCE_LABELS[data.limit_source] || data.limit_source || '',
        budgetLimit: limited ? limit : UNLIMITED,
        spent: orBlank(data.spend),
        // An unlimited budget has nothing to measure against, so these stay empty
        usedPercent: limited ? orBlank(data.percent_used) : '',
        tokens: data.total_tokens || 0,
        calls: data.api_requests || 0,
        budgetStatus: limited ? budgetStatus(data.percent_used, data.warning_pct) : UNLIMITED,
        warningThreshold: limited ? orBlank(data.warning_pct) : '',
      },
    ],
  };
};

export const buildDailySheet = data => ({
  sheetName: 'Daily Usage',
  columns: [
    { header: 'Date', key: 'date' },
    { header: 'Spent (USD)', key: 'spend', numFmt: ExcelFormats.currency, transform: orBlank },
    { header: 'Tokens', key: 'total_tokens', numFmt: ExcelFormats.integer },
    { header: 'Calls', key: 'api_requests', numFmt: ExcelFormats.integer },
  ],
  // Gap-filled so the sheet matches the chart rather than skipping quiet days
  rows: fillDailyGaps(data.daily || [], data.period_start, data.period_end),
});

export const buildModelSheet = data => {
  const models = data.models || [];
  const totalTokens = models.reduce((sum, model) => sum + (model.total_tokens || 0), 0);

  const rows = [...models]
    .sort((a, b) => (b.spend || 0) - (a.spend || 0))
    .map(model => ({
      model: model.display_name || formatModelName(model.model),
      spend: orBlank(model.spend),
      calls: model.api_requests || 0,
      tokens: model.total_tokens || 0,
      // Share is by tokens, so it stays meaningful for members who cannot see cost
      share: totalTokens ? Number((((model.total_tokens || 0) / totalTokens) * 100).toFixed(2)) : 0,
    }));

  return {
    sheetName: 'Usage by Model',
    columns: [
      { header: 'Model', key: 'model' },
      { header: 'Spent (USD)', key: 'spend', numFmt: ExcelFormats.currency },
      { header: 'Calls', key: 'calls', numFmt: ExcelFormats.integer },
      { header: 'Tokens', key: 'tokens', numFmt: ExcelFormats.integer },
      { header: 'Share (%)', key: 'share', numFmt: ExcelFormats.percent },
    ],
    rows,
  };
};

export const buildMembersSheet = (rows = [], warningPct) => ({
  sheetName: 'Members',
  columns: [
    { header: 'Member Name', key: 'name' },
    { header: 'Member Email', key: 'email' },
    { header: 'Budget Period', key: 'budgetPeriod' },
    { header: 'Budget Source', key: 'budgetSource' },
    { header: 'Budget Limit (USD)', key: 'budgetLimit', numFmt: ExcelFormats.currency },
    { header: 'Spent (USD)', key: 'spent', numFmt: ExcelFormats.currency },
    { header: 'Used (%)', key: 'usedPercent', numFmt: ExcelFormats.percent },
    { header: 'Budget Status', key: 'budgetStatus' },
  ],
  rows: rows.map(row => {
    const limited = hasLimit(row.effective_limit);

    return {
      name: row.name || row.email || `User ${row.user_id}`,
      email: row.email || '',
      budgetPeriod: BUDGET_PERIOD,
      budgetSource: SOURCE_LABELS[row.limit_source] || row.limit_source || '',
      budgetLimit: limited ? row.effective_limit : UNLIMITED,
      spent: orBlank(row.spend),
      usedPercent: limited ? orBlank(row.percent_used) : '',
      budgetStatus: limited ? budgetStatus(row.percent_used, warningPct) : UNLIMITED,
    };
  }),
});

/**
 * Sheets for one export. Members are included only for a team project's whole-project
 * view, where per-member budgets exist and the caller is authorised to read them.
 */
export const buildUsageSheets = ({
  data,
  projectName,
  isPersonalProject,
  scope,
  memberRows,
  membersWarningPct,
}) => {
  const sheets = [
    buildSummarySheet({ data, projectName, isPersonalProject, scope }),
    buildDailySheet(data),
    buildModelSheet(data),
  ];

  if (!isPersonalProject && scope !== SCOPE_USER) {
    sheets.push(buildMembersSheet(memberRows, membersWarningPct));
  }

  return sheets;
};

export const usageExportFileName = ({ projectName, scope, isPersonalProject, today }) => {
  const scopeLabel = !isPersonalProject && scope === SCOPE_USER ? 'My_Usage' : 'Whole_Project';
  const date = (today || new Date()).toISOString().slice(0, 10);

  return `Usage_${sanitizeFileNamePart(projectName)}_${scopeLabel}_${date}.xlsx`;
};
