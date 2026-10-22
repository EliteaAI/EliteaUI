// Imported directly rather than through the barrel, which pulls in the redux store
import { ExcelFormats, sanitizeFileNamePart } from '@/[fsd]/shared/lib/utils/exportToExcel.utils';
import { isNullOrUndefined } from '@/common/utils';

import {
  comparableTotal,
  computeDelta,
  fillDailyGaps,
  forecastSpend,
  formatModelName,
  toCumulative,
  usageSeverity,
} from './usage.helpers';

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

// Paid tools (web search etc.); amounts are absent for members who may not see cost
export const buildToolSpendSheet = data => ({
  sheetName: 'Paid Tools',
  columns: [
    { header: 'Tool', key: 'label' },
    { header: 'Spent (USD)', key: 'spend', numFmt: ExcelFormats.currency },
    { header: 'Limit (USD)', key: 'limit' },
    { header: 'Used (%)', key: 'percent', numFmt: ExcelFormats.percent },
    { header: 'Calls', key: 'calls', numFmt: ExcelFormats.integer },
  ],
  rows: (data.tool_spend || []).map(item => ({
    label: item.label || item.feature,
    spend: orBlank(item.spend),
    limit: 'effective_limit' in item ? (item.effective_limit ?? 'Unlimited') : '',
    percent: orBlank(item.percent_used),
    calls: item.calls || 0,
  })),
});

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
 * Computes the elapsed-days count used for KPI forecasts and averages, matching the
 * hook logic: days from period_start up to today, capped at the month length.
 */
const kpiElapsedDays = (periodStart, daysInMonth) => {
  if (!periodStart) return 0;
  const start = new Date(periodStart + 'T00:00:00Z');
  const diff = Math.floor((Date.now() - start) / 86400000) + 1;
  return Math.max(0, Math.min(diff, daysInMonth));
};

const kpiDaysInMonth = periodStart => {
  if (!periodStart) return 30;
  const d = new Date(periodStart + 'T00:00:00Z');
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
};

export const buildKpiSheet = ({ data, canSeeAmounts, isCurrentPeriod, comparisonData }) => {
  const {
    spend = 0,
    total_tokens: totalTokens = 0,
    effective_limit: effectiveLimit,
    currency = 'USD',
    period_start: periodStart,
    daily = [],
    api_requests: calls = 0,
    percent_used: percentUsed,
    input_tokens: inputTokens = 0,
    cache_read_tokens: cacheReadTokens = 0,
  } = data;

  const daysInMonth = kpiDaysInMonth(periodStart);
  const elapsedDays = kpiElapsedDays(periodStart, daysInMonth);
  // For past periods compare the full month; for current compare like-for-like up to today.
  const comparableThroughDay = isCurrentPeriod ? elapsedDays : null;
  const prevSpend = comparableTotal(comparisonData, 'spend', comparableThroughDay);
  const prevTokens = comparableTotal(comparisonData, 'total_tokens', comparableThroughDay);
  const spentDelta = computeDelta(spend, prevSpend);
  const tokenDelta = computeDelta(totalTokens, prevTokens);

  const forecast = forecastSpend(spend, elapsedDays, daysInMonth);
  const avgPerDay = elapsedDays > 0 ? spend / elapsedDays : 0;

  const peakDay = daily.reduce((best, d) => (!best || (d.spend || 0) > (best.spend || 0) ? d : best), null);
  const peakDateLabel = peakDay?.date
    ? (() => {
        const d = new Date(peakDay.date + 'T00:00:00Z');
        return `${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${d.getUTCDate()}`;
      })()
    : '';

  const cacheTotal = inputTokens + cacheReadTokens;
  const cacheHitRate = cacheTotal > 0 ? Math.round((cacheReadTokens / cacheTotal) * 100) : 0;

  const forecastPct =
    effectiveLimit && forecast != null
      ? Math.round((forecast / effectiveLimit) * 100)
      : percentUsed != null && elapsedDays > 0
        ? Math.round((percentUsed / elapsedDays) * daysInMonth)
        : null;

  const rows = [
    {
      metric: canSeeAmounts ? 'Spent' : 'Budget used',
      value: canSeeAmounts ? orBlank(spend) : orBlank(percentUsed),
      unit: canSeeAmounts ? currency : '%',
      vsLastMonth: spentDelta.direction !== 'none' ? spentDelta.label : '',
      vsTrend: spentDelta.direction,
    },
    {
      metric: isCurrentPeriod ? 'Forecast' : 'Limit',
      value: isCurrentPeriod
        ? forecast != null
          ? canSeeAmounts
            ? orBlank(forecast)
            : forecastPct != null
              ? forecastPct
              : ''
          : ''
        : (effectiveLimit ?? ''),
      unit: isCurrentPeriod
        ? canSeeAmounts
          ? currency
          : forecastPct != null
            ? '%'
            : ''
        : canSeeAmounts
          ? currency
          : '',
      vsLastMonth: '',
      vsTrend: '',
    },
    {
      metric: canSeeAmounts ? 'Avg / day' : 'Avg tokens / day',
      value: canSeeAmounts ? orBlank(avgPerDay) : orBlank(totalTokens / Math.max(elapsedDays, 1)),
      unit: canSeeAmounts ? currency : 'tokens',
      vsLastMonth: peakDateLabel ? `Peak on ${peakDateLabel}` : '',
      vsTrend: '',
    },
    {
      metric: cacheTotal > 0 && !canSeeAmounts && percentUsed == null ? 'Cache hit rate' : 'Tokens',
      value: cacheTotal > 0 && !canSeeAmounts && percentUsed == null ? cacheHitRate : orBlank(totalTokens),
      unit: cacheTotal > 0 && !canSeeAmounts && percentUsed == null ? '%' : 'tokens',
      vsLastMonth: tokenDelta.direction !== 'none' ? tokenDelta.label : '',
      vsTrend: tokenDelta.direction,
    },
    {
      metric: 'API calls',
      value: calls,
      unit: 'calls',
      vsLastMonth: '',
      vsTrend: '',
    },
  ];

  return {
    sheetName: 'KPI Summary',
    columns: [
      { header: 'Metric', key: 'metric' },
      { header: 'Value', key: 'value' },
      { header: 'Unit', key: 'unit' },
      { header: 'vs Last Month', key: 'vsLastMonth' },
      { header: 'Trend', key: 'vsTrend' },
    ],
    rows,
  };
};

const SOURCE_DISPLAY = {
  chat: 'Chat',
  agents: 'Agents',
  pipelines: 'Pipelines',
  automations: 'Automations',
  indexing: 'Indexing',
  skills: 'Skills',
  evaluations: 'Evaluations',
  external: 'External API',
};
const getSourceLabel = key => SOURCE_DISPLAY[key] || (key ? String(key).slice(0, 20) : 'Other');

/** "Spend over time" — one row per day, breakdown columns for each source present. */
export const buildSpendOverTimeSheet = (data, bySource = []) => {
  const daily = fillDailyGaps(data.daily || [], data.period_start, data.period_end);

  // Derive the set of source keys that actually appear in any daily row
  const sourceKeys = [
    ...new Set(
      daily
        .flatMap(d => Object.keys(d.by_source || {}))
        .concat((bySource || []).map(s => s.source || s.key).filter(Boolean)),
    ),
  ].sort();

  const columns = [
    { header: 'Date', key: 'date' },
    { header: 'Spent (USD)', key: 'spend', numFmt: ExcelFormats.currency, transform: orBlank },
    { header: 'Tokens', key: 'total_tokens', numFmt: ExcelFormats.integer },
    { header: 'Calls', key: 'api_requests', numFmt: ExcelFormats.integer },
    ...sourceKeys.map(k => ({
      header: getSourceLabel(k),
      key: `src_${k}`,
      numFmt: ExcelFormats.currency,
    })),
  ];

  const rows = daily.map(d => {
    const row = {
      date: d.date,
      spend: orBlank(d.spend),
      total_tokens: d.total_tokens || 0,
      api_requests: d.api_requests || 0,
    };
    sourceKeys.forEach(k => {
      row[`src_${k}`] = orBlank((d.by_source || {})[k]);
    });
    return row;
  });

  return { sheetName: 'Spend Over Time', columns, rows };
};

/** "Spend by source" — one row per source, matching the donut chart. */
export const buildSpendBySourceSheet = (bySource = []) => {
  const total = (bySource || []).reduce((sum, s) => sum + (s.spend || 0), 0);

  const rows = [...(bySource || [])]
    .sort((a, b) => (b.spend || 0) - (a.spend || 0))
    .map(s => {
      const key = s.source || s.key || '';
      return {
        source: getSourceLabel(key),
        spend: orBlank(s.spend),
        tokens: s.total_tokens || 0,
        calls: s.api_requests || 0,
        share: total > 0 ? Number((((s.spend || 0) / total) * 100).toFixed(2)) : 0,
      };
    });

  return {
    sheetName: 'Spend by Source',
    columns: [
      { header: 'Source', key: 'source' },
      { header: 'Spent (USD)', key: 'spend', numFmt: ExcelFormats.currency },
      { header: 'Tokens', key: 'tokens', numFmt: ExcelFormats.integer },
      { header: 'Calls', key: 'calls', numFmt: ExcelFormats.integer },
      { header: 'Share (%)', key: 'share', numFmt: ExcelFormats.percent },
    ],
    rows,
  };
};

/**
 * "Month vs Month" — cumulative daily spend for both periods side-by-side.
 * Matches the MoM chart: rows are day-of-month, values are cumulative totals.
 */
export const buildMomSheet = ({ currentDaily = [], prevDaily = [], currentLabel, prevLabel }) => {
  const curFilled = fillDailyGaps(
    currentDaily,
    currentDaily[0]?.date,
    currentDaily[currentDaily.length - 1]?.date,
  );
  const prevFilled = fillDailyGaps(prevDaily, prevDaily[0]?.date, prevDaily[prevDaily.length - 1]?.date);

  const curCumulative = toCumulative(curFilled.map(d => d.spend || 0));
  const prevCumulative = toCumulative(prevFilled.map(d => d.spend || 0));

  const totalDays = Math.max(curCumulative.length, prevCumulative.length);
  const curCol = currentLabel || 'Current month';
  const prevCol = prevLabel || 'Prior month';

  const rows = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    [curCol]: i < curCumulative.length ? orBlank(curCumulative[i]) : '',
    [prevCol]: i < prevCumulative.length ? orBlank(prevCumulative[i]) : '',
  }));

  return {
    sheetName: 'Month vs Month',
    columns: [
      { header: 'Day', key: 'day', numFmt: ExcelFormats.integer },
      { header: curCol, key: curCol, numFmt: ExcelFormats.currency },
      { header: prevCol, key: prevCol, numFmt: ExcelFormats.currency },
    ],
    rows,
  };
};

export const buildTopAgentsSheet = agents => {
  const rows = [...(agents || [])]
    .sort((a, b) => (b.spend || 0) - (a.spend || 0))
    .map(agent => {
      const runs = agent.runs ?? null;
      const spendKnown = !isNullOrUndefined(agent.spend);
      return {
        name: agent.name || agent.id || '',
        type: (agent.type || '').toLowerCase() === 'pipeline' ? 'Pipeline' : 'Agent',
        runs: runs ?? '',
        spend: orBlank(agent.spend),
        perRun: runs && spendKnown ? (agent.spend || 0) / runs : '',
      };
    });

  return {
    sheetName: 'Top Agents',
    columns: [
      { header: 'Name', key: 'name' },
      { header: 'Type', key: 'type' },
      { header: 'Runs', key: 'runs', numFmt: ExcelFormats.integer },
      { header: 'Spent (USD)', key: 'spend', numFmt: ExcelFormats.currency },
      { header: 'Per Run (USD)', key: 'perRun', numFmt: ExcelFormats.currency },
    ],
    rows,
  };
};

export const buildTopSkillsSheet = skills => {
  const list = skills || [];
  const totalSpend = list.reduce((sum, s) => sum + (s.spend || 0), 0);

  const rows = [...list]
    .sort((a, b) => (b.spend || 0) - (a.spend || 0))
    .map(skill => {
      const uses = skill.uses ?? skill.call_count ?? null;
      const spendKnown = !isNullOrUndefined(skill.spend);
      return {
        name: skill.name || skill.id || '',
        uses: uses ?? '',
        perUse: uses && spendKnown ? (skill.spend || 0) / uses : '',
        spend: orBlank(skill.spend),
        share: totalSpend > 0 ? Number((((skill.spend || 0) / totalSpend) * 100).toFixed(2)) : 0,
      };
    });

  return {
    sheetName: 'Top Skills',
    columns: [
      { header: 'Name', key: 'name' },
      { header: 'Uses', key: 'uses', numFmt: ExcelFormats.integer },
      { header: 'Per Use (USD)', key: 'perUse', numFmt: ExcelFormats.currency },
      { header: 'Spent (USD)', key: 'spend', numFmt: ExcelFormats.currency },
      { header: 'Share (%)', key: 'share', numFmt: ExcelFormats.percent },
    ],
    rows,
  };
};

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
  canSeeAmounts = true,
  isCurrentPeriod = true,
  comparisonData = null,
  momCurrentDaily = null,
  momPrevDaily = null,
  currentPeriodLabel = null,
  prevPeriodLabel = null,
}) => {
  const hasMom = (momPrevDaily || []).some(d => (d.spend || 0) > 0);

  const sheets = [
    buildSummarySheet({ data, projectName, isPersonalProject, scope }),
    buildKpiSheet({ data, canSeeAmounts, isCurrentPeriod, comparisonData }),
    buildDailySheet(data),
    buildSpendOverTimeSheet(data, data.by_source),
    buildModelSheet(data),
    ...((data.by_source || []).length ? [buildSpendBySourceSheet(data.by_source)] : []),
    ...(hasMom
      ? [
          buildMomSheet({
            currentDaily: momCurrentDaily,
            prevDaily: momPrevDaily,
            currentLabel: currentPeriodLabel,
            prevLabel: prevPeriodLabel,
          }),
        ]
      : []),
    ...(data.top_agents?.length ? [buildTopAgentsSheet(data.top_agents)] : []),
    ...(data.top_skills?.length ? [buildTopSkillsSheet(data.top_skills)] : []),
    ...(data.tool_spend?.length ? [buildToolSpendSheet(data)] : []),
  ];

  if (!isPersonalProject && scope !== SCOPE_USER) {
    sheets.push(buildMembersSheet(memberRows, membersWarningPct));
  }

  return sheets;
};

export const usageExportFileName = ({ projectName, scope, isPersonalProject, period, today }) => {
  const scopeLabel = !isPersonalProject && scope === SCOPE_USER ? 'My_Usage' : 'Whole_Project';
  const stamp = period
    ? `${period.slice(0, 4)}-${period.slice(4, 6)}`
    : (today || new Date()).toISOString().slice(0, 10);

  return `Usage_${sanitizeFileNamePart(projectName)}_${scopeLabel}_${stamp}.xlsx`;
};
