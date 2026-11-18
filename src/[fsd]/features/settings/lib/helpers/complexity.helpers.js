import { format } from 'date-fns';

// The API reads date_to as exclusive, so the window ends tomorrow to include today
export const periodRange = (days, now = new Date()) => {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const start = new Date(end.getTime() - Number(days) * 24 * 3600 * 1000);
  return { dateFrom: start.toISOString().slice(0, 10), dateTo: end.toISOString().slice(0, 10) };
};

export const formatCu = value => (value == null ? '—' : Number(value).toFixed(value >= 100 ? 0 : 1));

export const formatPercentile = value => (value == null ? '—' : `P${value}`);

export const formatAsOf = iso => (iso ? format(new Date(iso), 'MMM d, yyyy HH:mm') : null);

export const breakdownShares = breakdown => {
  const parts = ['context', 'reasoning', 'tools'].map(key => Math.max(0, Number(breakdown?.[key]) || 0));
  const total = parts.reduce((sum, value) => sum + value, 0);
  return total ? parts.map(value => (value / total) * 100) : [0, 0, 0];
};

const THRESHOLD_SOURCE_NOTES = {
  default: 'default thresholds',
  calibrated: 'calibrated for this installation',
  pinned: 'set by an administrator',
};

// Live cut points from the API, so the text follows calibration instead of hard-coded defaults
export const thresholdsLine = meta => {
  const { medium, high, extreme } = meta?.thresholds ?? {};
  if ([medium, high, extreme].some(value => value == null)) return null;
  const [m, h, x] = [medium, high, extreme].map(value => String(Number(Number(value).toFixed(1))));
  const source = THRESHOLD_SOURCE_NOTES[meta.thresholds_source] ?? THRESHOLD_SOURCE_NOTES.default;
  return `Low under ${m} · Medium ${m}–${h} · High ${h}–${x} · Extreme over ${x} (${source}, updated nightly)`;
};

export const runTooltip = run => {
  const { context, reasoning, tools } = run?.breakdown ?? {};
  return `${formatCu(run?.cu_total)} CU · ${formatPercentile(run?.percentile)} · Context ${formatCu(context)} · Reasoning ${formatCu(reasoning)} · Tools ${formatCu(tools)}`;
};

export const RUN_SCORE_STATE = { scored: 'scored', pending: 'pending', notScored: 'notScored' };

export const runScoreState = (scoredRun, lastActivityMs, pendingWindowMs, now = Date.now()) => {
  if (scoredRun) return RUN_SCORE_STATE.scored;
  if (Number.isFinite(lastActivityMs) && now - lastActivityMs < pendingWindowMs)
    return RUN_SCORE_STATE.pending;
  return RUN_SCORE_STATE.notScored;
};

// Context, reasoning, tools: shared by the breakdown bar and its legend
export const dimensionColor = (palette, index) =>
  [palette.status.draft, palette.status.onModeration, palette.status.published][index];

export const dataFreshnessNote = meta => {
  const asOf = formatAsOf(meta?.as_of);
  const recalibrated = formatAsOf(meta?.thresholds_computed_at);
  const scores = asOf ? `Scores as of ${asOf}.` : 'No runs scored yet.';
  const labels = recalibrated ? `; last recalibration: ${recalibrated}` : '';
  return `Data freshness: ${scores} Scores update hourly. Complexity labels are recalibrated daily${labels}.`;
};

const nonNegativeInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

// Unknown or tampered URL values fall back to defaults rather than querying with them
export const readListState = (searchParams, { keys, periods, defaultPeriod, defaultSort, rowsOptions }) => {
  const period = searchParams.get(keys.period);
  const rows = nonNegativeInt(searchParams.get(keys.rowsPerPage), rowsOptions[1]);
  const sortOrder = searchParams.get(keys.sortOrder);
  return {
    periodDays: periods.some(option => option.value === period) ? period : defaultPeriod,
    search: searchParams.get(keys.search) ?? '',
    sortBy: searchParams.get(keys.sortBy) || defaultSort.sortBy,
    sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : defaultSort.sortOrder,
    page: nonNegativeInt(searchParams.get(keys.page), 0),
    rowsPerPage: rowsOptions.includes(rows) ? rows : rowsOptions[1],
  };
};

const safeName = value =>
  String(value ?? '')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'Project';

// dateTo is exclusive, so exports name the last day actually covered
export const lastCoveredDay = dateTo =>
  new Date(new Date(`${dateTo}T00:00:00Z`).getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10);

export const exportFileName = (projectName, { dateFrom, dateTo }) =>
  `complexity_${safeName(projectName)}_${dateFrom}_${lastCoveredDay(dateTo)}.xlsx`;

const numberOrBlank = value => (value == null || value === '' ? '' : Number(value));

const breakdownColumn = (header, key) => ({
  header,
  key,
  numFmt: '0.00',
  transform: (_, row) => numberOrBlank(row.breakdown?.[key]),
});

export const buildExportSheet = ({ rows, meta, projectName, range, search, searchTruncated }) => ({
  sheetName: 'Complexity',
  metadata: [
    ['Project', projectName],
    ['Period', `${range.dateFrom} – ${lastCoveredDay(range.dateTo)} (UTC)`],
    ...(search ? [['Search', search]] : []),
    ...(searchTruncated ? [['Warning', 'Search matched too many names; some agents may be missing.']] : []),
    ['Scores as of', formatAsOf(meta?.as_of) ?? 'Not scored yet'],
    ['Labels recalibrated', formatAsOf(meta?.thresholds_computed_at) ?? '—'],
    ['Median CU', 'Approximate, from daily summaries. Blank cells mean the value is unavailable.'],
    ['Exported At', formatAsOf(new Date().toISOString())],
  ],
  columns: [
    { header: 'Name', key: 'entity_name' },
    { header: 'Type', key: 'entity_kind', transform: kind => (kind === 'pipeline' ? 'Pipeline' : 'Agent') },
    { header: 'Runs', key: 'runs', numFmt: '#,##0', transform: numberOrBlank },
    { header: 'Median CU (approx.)', key: 'cu_median', numFmt: '0.00', transform: numberOrBlank },
    { header: 'Max CU', key: 'cu_max', numFmt: '0.00', transform: numberOrBlank },
    {
      header: 'Complexity',
      key: 'label',
      transform: (label, row) => (row.label_pending ? 'Pending' : (label ?? '')),
    },
    { header: 'Percentile', key: 'percentile', numFmt: '0', transform: numberOrBlank },
    breakdownColumn('Context CU', 'context'),
    breakdownColumn('Reasoning CU', 'reasoning'),
    breakdownColumn('Tools CU', 'tools'),
  ],
  rows,
});

export const buildRunSheet = (run, meta, scopeRows = []) => ({
  sheetName: 'Complexity',
  metadata: [...scopeRows, ['Scores as of', formatAsOf(meta?.as_of) ?? '—']],
  columns: [
    { header: 'Metric', key: 'metric' },
    { header: 'Value', key: 'value' },
  ],
  rows: run
    ? [
        { metric: 'CU', value: numberOrBlank(run.cu_total) },
        { metric: 'Context CU', value: numberOrBlank(run.breakdown?.context) },
        { metric: 'Reasoning CU', value: numberOrBlank(run.breakdown?.reasoning) },
        { metric: 'Tools CU', value: numberOrBlank(run.breakdown?.tools) },
        { metric: 'Complexity', value: run.label ?? '' },
        { metric: 'Percentile', value: numberOrBlank(run.percentile) },
        { metric: 'LLM calls', value: numberOrBlank(run.llm_calls) },
        { metric: 'Tool calls', value: numberOrBlank(run.tool_calls) },
        { metric: 'Peak input tokens', value: numberOrBlank(run.peak_input_tokens) },
      ]
    : [{ metric: 'Complexity data is unavailable for this run.', value: '' }],
});

export const versionName = (versions, versionId) =>
  versions?.find(version => version.id === versionId)?.name ?? (versionId ? `#${versionId}` : '—');

export const readRunsPaging = (searchParams, { rowsKey, pageKey, rowsOptions }) => {
  const rows = parseInt(searchParams.get(rowsKey), 10);
  return {
    rowsPerPage: rowsOptions.includes(rows) ? rows : rowsOptions[1],
    page: Math.max(0, parseInt(searchParams.get(pageKey), 10) || 0),
  };
};
