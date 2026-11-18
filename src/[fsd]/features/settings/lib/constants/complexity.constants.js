export const COMPLEXITY_TOOLTIP =
  'Complexity shows how much context, reasoning and tool work runs use. Higher is not worse.';

export const LABELS = {
  L: { text: 'Low', color: 'success' },
  M: { text: 'Medium', color: 'info' },
  H: { text: 'High', color: 'warning' },
  X: { text: 'Extreme', color: 'error' },
};

export const PENDING_TOOLTIP = 'Needs at least 3 scored runs in the period for a label.';

export const DIMENSIONS = [
  { key: 'context', label: 'Context' },
  { key: 'reasoning', label: 'Reasoning' },
  { key: 'tools', label: 'Tools' },
];

export const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export const DEFAULT_PERIOD_DAYS = '30';

export const PAGE_SIZE = 20;

export const DEFAULT_THRESHOLDS_NOTE =
  'Labels are based on default thresholds until this installation has enough runs to calibrate.';

export const STALE_NOTE = 'Labels may be out of date: the nightly recalibration has not run in over a day.';

export const PENDING_SCORE_TOOLTIP = 'Not scored yet: runs are scored about 30–90 minutes after they finish.';

export const NOT_SCORED_TOOLTIP = 'Not scored: this run has no complexity data.';

// Scoring lags a finished run by up to ~90 min; past this a missing score will not come
export const PENDING_WINDOW_MS = 2 * 60 * 60 * 1000;

export const INFO_LINES = [
  { term: 'Context', text: '1 CU per 1,000 tokens of the largest prompt, up to 30 CU' },
  { term: 'Reasoning', text: '1 CU per LLM call' },
  {
    term: 'Tools',
    text: '1 CU per tool call; heavier tools count up to 5 (indexing 5; sandbox, code and file processing 3; search and SQL 2). Lookups such as asking the user or loading a skill count 0.',
  },
];

export const INFO_LABELS_FALLBACK =
  'Labels compare runs with typical runs on this installation, updated nightly.';

export const LS_COMPLEXITY_INFO_DISMISSED = 'complexity:info-popover:dismissed';

export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

// List state lives in the URL so returning from an entity's detail restores it
export const LIST_SEARCH_PARAMS = {
  period: 'period',
  search: 'search',
  sortBy: 'sort_by',
  sortOrder: 'sort_order',
  page: 'page',
  rowsPerPage: 'rows',
};

// Keys only the detail page adds on top of the list's; dropped again when returning to the list
export const DETAIL_SEARCH_PARAMS = {
  entityType: 'entity_type',
  kind: 'kind',
  runsPage: 'runs_page',
  runsRows: 'runs_rows',
};

export const RUNS_PAGING = {
  rowsKey: DETAIL_SEARCH_PARAMS.runsRows,
  pageKey: DETAIL_SEARCH_PARAMS.runsPage,
  rowsOptions: ROWS_PER_PAGE_OPTIONS,
};

export const RUN_ANALYTICS_SEARCH_PARAMS = {
  tab: 'analytics_tab',
  entityProjectId: 'entity_project_id',
};

export const DEFAULT_SORT = { sortBy: 'cu_median', sortOrder: 'desc' };

export const TABLE_MEDIAN_INFO =
  'Median CU: an approximate median calculated from daily summaries to keep this table fast. Open an Agent or Pipeline to view its exact median for the selected period.';

export const RECENT_RUNS_INFO =
  'Shows individual runs during the selected period. Select a start time to view that run’s complexity.';

export const RUN_UNAVAILABLE = 'Complexity data is unavailable for this run.';

export const RUN_ANALYTICS_TAB = 'complexity';

export const EXPORT_PAGE_SIZE = 100;

export const SEARCH_TRUNCATED_NOTE =
  'Too many agents and pipelines match this search, so some may be missing. Narrow the search to see them all.';
