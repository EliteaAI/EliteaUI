import { MONTH_NAMES, MONTH_SHORT } from '@/[fsd]/features/settings/lib/constants/period.constants.js';

export const formatMoney = (value, currency = 'USD') => {
  if (value === null || value === undefined) return '—';

  const symbol = currency === 'USD' ? '$' : `${currency} `;
  const amount = Number(value);

  // Sub-cent spend still matters when a limit is small, so keep 4 decimals there
  if (amount > 0 && amount < 0.01) return `${symbol}${amount.toFixed(4)}`;

  return `${symbol}${amount.toFixed(2)}`;
};

export const formatLimit = (value, currency = 'USD') =>
  value === null || value === undefined ? 'Unlimited' : formatMoney(value, currency);

export const formatTokens = tokens => {
  const value = Number(tokens || 0);

  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;

  return String(value);
};

/** Markdown breakdown of the TOKENS KPI card, for its hover tooltip. */
export const tokensBreakdownTooltip = usage => {
  const {
    input_tokens: input,
    output_tokens: output,
    cache_read_tokens: cacheRead,
    cache_creation_tokens: cacheCreation,
  } = usage || {};

  return [
    `**Input:** ${formatTokens(input)}`,
    `**Output:** ${formatTokens(output)}`,
    `**Cache read:** ${formatTokens(cacheRead)}`,
    `**Cache write:** ${formatTokens(cacheCreation)}`,
  ].join('\n\n');
};

/** Strip provider paths and the shared-project id prefix for display only. */
export const formatModelName = model => {
  if (!model) return 'Unknown';

  const withoutProvider = model.includes('/') ? model.slice(model.lastIndexOf('/') + 1) : model;

  return withoutProvider.replace(/^\d+_/, '');
};

/** Fill days with no activity so the chart cannot interpolate across a gap. */
export const fillDailyGaps = (daily = [], periodStart, periodEnd) => {
  if (!daily.length || !periodStart) return daily;

  const byDate = new Map(daily.map(day => [day.date, day]));

  // Stop at today: future days of the month have no data yet and would flatten the line
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = [periodEnd, today].filter(Boolean).sort()[0];

  const result = [];
  const cursor = new Date(`${periodStart}T00:00:00Z`);
  const end = new Date(`${lastDate}T00:00:00Z`);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);

    result.push(byDate.get(key) || { date: key, spend: 0, total_tokens: 0, api_requests: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
};

/** Warning threshold used when the backend has not supplied a configured one. */
export const DEFAULT_WARNING_PCT = 80;

export const usageSeverity = (percentUsed, warningPct = DEFAULT_WARNING_PCT) => {
  if (percentUsed === null || percentUsed === undefined) return 'none';
  if (percentUsed >= 100) return 'exceeded';

  // An out-of-range or missing configured value must not silence the warning
  const threshold =
    Number(warningPct) >= 1 && Number(warningPct) <= 100 ? Number(warningPct) : DEFAULT_WARNING_PCT;

  if (percentUsed >= threshold) return 'warning';

  return 'ok';
};

/** Members whose name or email contains the search term, case-insensitively. */
export const filterMembers = (rows = [], search = '') => {
  const term = String(search).trim().toLowerCase();

  if (!term) return rows;

  return rows.filter(
    row => (row.name || '').toLowerCase().includes(term) || (row.email || '').toLowerCase().includes(term),
  );
};

/** Days until the monthly budget resets, for a plain-language label. */
export const daysUntilReset = resetsAt => {
  if (!resetsAt) return null;

  const diff = new Date(resetsAt).getTime() - Date.now();

  return diff <= 0 ? 0 : Math.ceil(diff / (24 * 60 * 60 * 1000));
};

export const formatResetLabel = resetsAt => {
  const days = daysUntilReset(resetsAt);

  if (days === null) return '';
  if (days === 0) return 'Resets today';
  if (days === 1) return 'Resets tomorrow';

  return `Resets in ${days} days`;
};

// Headline for one paid tool on the Usage page; failed reads and redacted payloads never show $0
export const toolSpendLabel = (item, canSeeAmounts) => {
  if (item.enabled === false) return `${item.label}: turned off for this project`;
  if (item.spend_available === false) return `${item.label}: usage temporarily unavailable`;
  if (canSeeAmounts) {
    return `${item.label}: ${formatMoney(item.spend, item.currency)} of ${formatLimit(item.effective_limit, item.currency)}`;
  }
  const limited = item.percent_used !== null && item.percent_used !== undefined;
  return `${item.label}: ${limited ? `${item.percent_used}% of limit` : 'no limit'}`;
};
/**
 * Compute the delta between two spend values.
 * Returns { value, pct, label, direction: 'up'|'down'|'flat'|'new'|'none' }
 */
export const computeDelta = (current, previous) => {
  if (previous === null || previous === undefined)
    return { value: null, pct: null, label: '—', direction: 'none' };
  if (previous < 1e-9 && current > 0) return { value: null, pct: null, label: 'New', direction: 'new' };
  if (previous < 1e-9) return { value: 0, pct: 0, label: '—', direction: 'flat' };

  const diff = current - previous;
  const pct = (diff / previous) * 100;
  const sign = diff > 0 ? '+' : '';
  const label = `${sign}${pct.toFixed(1)}%`;
  const direction = diff > 0.005 ? 'up' : diff < -0.005 ? 'down' : 'flat';

  return { value: diff, pct, label, direction };
};

/** Deterministic series colour from CHART_COLORS by hashing the key string. */
export const stableSeriesColor = (key, chartColors) => {
  let h = 5381;
  const str = String(key);

  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);

  return chartColors[Math.abs(h) % chartColors.length];
};

/**
 * Sum a metric from compData for comparison purposes.
 * When throughDay is given (current-period only), sum only daily entries up to that day-of-month
 * so the comparison is like-for-like. When throughDay is null, return the pre-aggregated total.
 */
export const comparableTotal = (compData, key, throughDay) => {
  if (compData?.[key] == null) return null;
  if (!throughDay || !compData.daily?.length) return compData[key];

  return (compData.daily || []).reduce(
    (sum, day) => (Number(day.date.slice(8, 10)) <= throughDay ? sum + (day[key] || 0) : sum),
    0,
  );
};

/** Running cumulative sum: [1, 2, 3] → [1, 3, 6] */
export const toCumulative = (values = []) => {
  let acc = 0;

  return values.map(v => {
    acc += v || 0;
    return acc;
  });
};

/**
 * Align two monthly daily arrays by day-of-month index.
 * prev[i] is null when prev month is shorter than the current one.
 */
export const alignByDayOfMonth = (current = [], prev = []) => {
  const aligned = current.map((_, i) => (i < prev.length ? prev[i] : null));

  return { current, prev: aligned };
};

/**
 * Forecast end-of-month spend based on elapsed days.
 * Returns null when elapsedDays < 3 (not enough signal).
 */
export const forecastSpend = (spend, elapsedDays, daysInMonth) => {
  if (!elapsedDays || elapsedDays < 3 || !daysInMonth) return null;

  return (spend / elapsedDays) * daysInMonth;
};

/**
 * Returns the day number when the forecast exceeds the limit, or null.
 */
export const forecastExceedDay = (spend, elapsedDays, limit, daysInMonth) => {
  if (!limit || !elapsedDays || elapsedDays < 3 || !daysInMonth) return null;

  const dailyRate = spend / elapsedDays;

  if (dailyRate <= 0) return null;

  const dayOfExceed = limit / dailyRate;

  return dayOfExceed <= daysInMonth ? Math.ceil(dayOfExceed) : null;
};

/**
 * Sort items by valueKey desc, take top n, bundle the rest as { key: '__other', ... }.
 */

/**
 * Returns { start, end } date strings for the same elapsed days of the previous month.
 * Used to compare e.g. Oct 1–18 vs Sep 1–18.
 */
export const sameDaysRange = (periodYYYYMM, asOfDay) => {
  if (!periodYYYYMM) return null;

  const year = parseInt(periodYYYYMM.slice(0, 4), 10);
  const month = parseInt(periodYYYYMM.slice(4, 6), 10); // 1-based

  // Previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevDaysInMonth = new Date(prevYear, prevMonth, 0).getDate();
  const endDay = Math.min(asOfDay, prevDaysInMonth);

  const pad = n => String(n).padStart(2, '0');
  const start = `${prevYear}-${pad(prevMonth)}-01`;
  const end = `${prevYear}-${pad(prevMonth)}-${pad(endDay)}`;

  return { start, end, prevYYYYMM: `${prevYear}${pad(prevMonth)}` };
};

/**
 * Build a "vs Month D1–D2" or "vs Month" label for a KPI comparison subtitle.
 * compData.period_start must be a YYYY-MM-DD string.
 */
export const buildVsLabel = (compData, elapsedDays, isCurrentPeriod) => {
  if (!compData) return null;

  const start = compData.period_start;

  if (!start) return 'vs prior period';

  const d = new Date(start + 'T00:00:00Z');
  const monthName = MONTH_SHORT[d.getUTCMonth()];

  if (!isCurrentPeriod) {
    return `vs ${monthName}`;
  }

  return `vs ${monthName} 1–${elapsedDays}`;
};

/** Model type detection heuristic based on model name. */
export const detectModelType = modelName => {
  if (!modelName) return null;

  const lower = modelName.toLowerCase();

  if (lower.includes('embed')) return 'Embedding';
  if (lower.includes('image') || lower.includes('dall-e') || lower.includes('flux')) return 'Image';

  return null;
};

const MONTH_ABBR = MONTH_SHORT;

/** Format a human-readable comparison label like "vs Sep 1–18" or "vs September". */
export const formatComparisonLabel = (prevYYYYMM, isSameDays, asOfDay) => {
  if (!prevYYYYMM) return '';

  const monthIdx = parseInt(prevYYYYMM.slice(4, 6), 10) - 1; // 0-based

  if (!isSameDays) {
    return `vs ${MONTH_NAMES[monthIdx]}`;
  }

  return `vs ${MONTH_ABBR[monthIdx]} 1–${asOfDay}`;
};

const USAGE_MAX_CHART_SERIES = 5;

/**
 * Sort items by weightKey desc, take top USAGE_MAX_CHART_SERIES, bundle the rest as __other.
 * Returns [{ key, w }] suitable for distributeByWeight.
 */
export const buildGroups = (items, nameKey = 'name', weightKey = 'spend', max = USAGE_MAX_CHART_SERIES) => {
  if (!items?.length) return [];

  const sorted = [...items].sort((a, b) => (b[weightKey] || 0) - (a[weightKey] || 0));
  const top = sorted.slice(0, max);
  const rest = sorted.slice(max);

  const groups = top.map(item => ({
    key: item[nameKey] || item.key || item.name || 'Other',
    w: item[weightKey] || 0,
  }));

  const otherW = rest.reduce((acc, item) => acc + (item[weightKey] || 0), 0);

  if (otherW > 0 || rest.length > 0) {
    groups.push({ key: '__other', w: otherW });
  }

  if (!groups.some(g => g.w > 0)) return [];

  return groups;
};

/**
 * Map (dimension, metricKey) to the per-day breakdown field name on each daily row.
 * spend → by_model / by_source; total_tokens → by_model_tokens / by_source_tokens.
 */
export const dailyBreakdownKey = (dimension, metricKey) =>
  metricKey === 'spend' ? `by_${dimension}` : `by_${dimension}_tokens`;

/**
 * Split daily rows using the real per-day breakdown attached by the backend.
 * Each day carries its own proportions instead of every day sharing the month-level split.
 * Surplus (day total minus named keys) goes to __other when that group is present.
 * Groups may carry a `lookupKey` (raw backend key) separate from `key` (display label).
 */
export const splitDailyByGroup = (daily, groups, breakdownKey, metricKey = 'spend') =>
  daily.map(day => {
    const breakdown = day[breakdownKey] || {};
    const row = { date: day.date };
    let named = 0;

    groups.forEach(g => {
      if (g.key === '__other') return;
      const rawKey = g.lookupKey ?? g.key;
      row[g.key] = breakdown[rawKey] || 0;
      named += row[g.key];
    });

    if (groups.some(g => g.key === '__other')) {
      row.__other = Math.max((day[metricKey] || 0) - named, 0);
    }

    return row;
  });

/** Build Recharts-compatible series data from filled daily rows. */
export const buildSeriesFromDaily = (daily, groupBy, models, bySource, metricKey = 'spend') => {
  if (!daily?.length) return { data: [], keys: [], labels: {} };

  const totalFallback = () => ({
    data: daily.map(d => ({ date: d.date, total: d[metricKey] || 0 })),
    keys: ['total'],
    labels: {},
  });

  if (groupBy === 'total') return totalFallback();

  let groups = [];

  if (groupBy === 'model') {
    const sorted = [...(models || [])].sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0));
    const top = sorted.slice(0, USAGE_MAX_CHART_SERIES);
    const rest = sorted.slice(USAGE_MAX_CHART_SERIES);
    // Keep raw model id as the data key (always unique); resolve display names separately.
    groups = top.map(m => ({ key: m.model, w: m[metricKey] || 0 }));
    const otherW = rest.reduce((s, m) => s + (m[metricKey] || 0), 0);
    if (otherW > 0 || rest.length > 0) groups.push({ key: '__other', w: otherW });
    if (!groups.some(g => g.w > 0)) groups = [];
  } else if (groupBy === 'source') {
    groups = buildGroups(bySource || [], 'source', metricKey, Infinity);
  } else if (groupBy === 'member') {
    // Derive member list from by_member keys on daily rows; rank by total spend across the period
    const memberTotals = new Map();
    daily.forEach(day => {
      const bd = day.by_member || {};
      Object.entries(bd).forEach(([k, v]) => memberTotals.set(k, (memberTotals.get(k) || 0) + (v || 0)));
    });
    const memberItems = Array.from(memberTotals.entries()).map(([key, w]) => ({ key, w }));
    groups = buildGroups(memberItems, 'key', 'w');
  } else {
    return totalFallback();
  }

  if (!groups.length) return totalFallback();

  const bKey = dailyBreakdownKey(groupBy, metricKey);
  const hasRealBreakdown = daily.some(day => {
    const bd = day[bKey];
    return bd && Object.keys(bd).length > 0;
  });

  if (!hasRealBreakdown) return totalFallback();

  // Build a duplicate-safe display label map: raw key → display name.
  // When two models share a formatted display name, fall back to the raw id for both.
  const labels = {};
  if (groupBy === 'model') {
    const modelMap = new Map((models || []).map(m => [m.model, m]));
    const resolved = groups
      .filter(g => g.key !== '__other')
      .map(g => ({ key: g.key, name: modelMap.get(g.key)?.display_name || formatModelName(g.key) || g.key }));
    const counts = resolved.reduce((acc, { name }) => acc.set(name, (acc.get(name) || 0) + 1), new Map());
    resolved.forEach(({ key, name }) => {
      labels[key] = counts.get(name) > 1 ? key : name;
    });
  }

  return { data: splitDailyByGroup(daily, groups, bKey, metricKey), keys: groups.map(g => g.key), labels };
};

/** Aggregate daily series rows into ISO-week buckets (week starts Monday, clipped to month). */
export const buildWeeklyData = dailyData => {
  if (!dailyData.length) return [];

  const weeks = [];
  let currentWeek = null;

  dailyData.forEach(day => {
    const d = new Date(day.date + 'T00:00:00Z');
    const weekStart = new Date(d);

    // ISO: Monday = 0 offset. getUTCDay() is 0=Sun…6=Sat; (day+6)%7 gives 0=Mon…6=Sun
    weekStart.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));

    // If the Monday falls before this month, pin the label to the 1st of the month
    const weekKey =
      weekStart.getUTCMonth() === d.getUTCMonth()
        ? weekStart.toISOString().slice(0, 10)
        : `${day.date.slice(0, 8)}01`;

    if (!currentWeek || currentWeek.date !== weekKey) {
      if (currentWeek) weeks.push(currentWeek);
      currentWeek = { date: weekKey };
      Object.keys(day)
        .filter(k => k !== 'date')
        .forEach(k => (currentWeek[k] = day[k] || 0));
    } else {
      Object.keys(day)
        .filter(k => k !== 'date')
        .forEach(k => (currentWeek[k] = (currentWeek[k] || 0) + (day[k] || 0)));
    }
  });

  if (currentWeek) weeks.push(currentWeek);

  return weeks;
};

/** Build a minimal SVG path string for a sparkline, scaled to viewBox "0 0 100 28". */
export const buildSparklinePath = (values = []) => {
  const filtered = values.filter(v => v !== null && v !== undefined);

  if (!filtered.length) return '';

  const max = Math.max(...filtered);

  if (max === 0) return '';

  const n = filtered.length;
  const points = filtered.map((v, i) => {
    const x = n === 1 ? 50 : (i / (n - 1)) * 100;
    const y = 28 - (v / max) * 24;

    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${points.join(' L ')}`;
};
