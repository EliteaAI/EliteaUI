export const IndexDetailsTabs = {
  configuration: 'configuration',
  activity: 'activity',
};

export const IndexesToolsEnum = {
  indexData: 'index_data',
  searchIndexData: 'search_index',
  stepbackSearchIndex: 'stepback_search_index',
  stepbackSummaryIndex: 'stepback_summary_index',
  removeIndex: 'remove_index',
};

export const INDEX_DATA_DISABLED_REASON = 'Enable the “Index data” tool to activate indexing';

export const INDEX_SEARCH_TOOL_OPTIONS = [
  { label: 'Search Index', value: IndexesToolsEnum.searchIndexData },
  { label: 'Stepback Search Index', value: IndexesToolsEnum.stepbackSearchIndex },
  { label: 'Stepback Summary Index', value: IndexesToolsEnum.stepbackSummaryIndex },
];

export const INDEX_SEARCH_TOOL_LABELS = new Map(
  INDEX_SEARCH_TOOL_OPTIONS.map(({ value, label }) => [value, label]),
);

export const IndexStatuses = {
  progress: 'in_progress',
  success: 'completed',
  fail: 'failed',
  cancelled: 'cancelled',
  created: 'created',
  partlyOk: 'partly_indexed',
  scheduledReindex: 'scheduled_reindex',
  runTest: 'run_test',
};

export const BannerSeverity = {
  warning: 'warning',
  error: 'error',
  info: 'info',
  success: 'success',
};

export const BannerTitleMap = {
  [BannerSeverity.success]: 'Index is ready!',
  [BannerSeverity.warning]: 'Stopped',
  [BannerSeverity.error]: 'Index processing error',
  [BannerSeverity.info]: 'Indexing…',
};

export const BANNER_SUCCESS_SUFFIX = 'The index is ready to search.';

export const BannerMessageMap = {
  [BannerSeverity.success]: `Indexing completed successfully. ${BANNER_SUCCESS_SUFFIX}`,
  [BannerSeverity.warning]:
    'Indexing was stopped before completion. Click Reindex to restart indexing, or check History for the reason it stopped.',
  [BannerSeverity.error]:
    'Indexing failed before any files could be processed. Check the source connection and permissions, then try Reindex. See History for error details.',
  [BannerSeverity.info]:
    "Indexing may take a few minutes depending on size. You can navigate to other sections; indexing will continue in the background and you'll be notified when it's done.",
};

export const REINDEX_IN_PROGRESS_BANNER_TITLE = 'Reindexing in progress';

export const REINDEX_IN_PROGRESS_BANNER_MESSAGE =
  'The existing indexed data remains available for search while a new version is being created.';

export const REINDEX_FAILED_BANNER_TITLE = 'Reindex failed';

export const INDEX_RETAINED_DATA_MESSAGE = 'Previously indexed data remains available for search.';

export const REINDEX_FAILED_BANNER_MESSAGE =
  `The new indexing attempt could not be completed. ${INDEX_RETAINED_DATA_MESSAGE} ` +
  'Check History for error details and try again after resolving the issue.';

// Shown while the run looks interrupted but the platform still considers it live, so the
// panel offers Stop and the server would refuse a Reindex.
export const INDEX_UNRESPONSIVE_BANNER_MESSAGE =
  'This run has not reported progress for a while. It may still be finishing; ' +
  'if it is not, use Stop to end it before starting a new run.';

// `stale` is a no-progress heuristic, never a terminal state from the worker, so the copy
// hedges that the run may still be alive. The remedy named depends on `reclaimable`.
export const INDEX_ABANDONED_BANNER_MESSAGE =
  'This run has not reported progress for a long time and looks interrupted. ' +
  'If it is still running it may yet finish; otherwise click Reindex to restart it.';

export const INDEX_ABANDONED_EVENT_LABEL = 'Stopped without finishing';

// Statuses that allow the index to be searched and run tools against
export const RUNNABLE_INDEX_STATUSES = [
  IndexStatuses.success,
  IndexStatuses.partlyOk,
  IndexStatuses.scheduledReindex,
];

export const TERMINAL_INDEX_STATUSES = [
  IndexStatuses.success,
  IndexStatuses.fail,
  IndexStatuses.cancelled,
  IndexStatuses.partlyOk,
  IndexStatuses.scheduledReindex,
];

export const IndexHistoryItemsLabels = {
  [IndexStatuses.success]: 'Indexed',
  [IndexStatuses.created]: 'Created',
  [IndexStatuses.cancelled]: 'Stopped',
  [IndexStatuses.fail]: 'Failed',
  [IndexStatuses.partlyOk]: 'Partially Indexed',
  [IndexStatuses.scheduledReindex]: 'Reindexed by schedule',
  [IndexStatuses.runTest]: 'Run test',
};

export const IndexRunInitiators = {
  user: 'user',
  llm: 'llm',
  schedule: 'schedule',
};

export const RUN_TEST_OPERATION_TYPES = new Set(INDEX_SEARCH_TOOL_LABELS.keys());

export const IndexCronDefault = '0 0 * * 6';
