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
  interrupted: 'interrupted',
  // Client-side only: the run still claims to be in progress but the backend has not
  // heard from it. Never persisted — the reclaim decides if it is really over.
  unresponsive: 'unresponsive',
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

export const INTERRUPTED_BANNER = {
  label: 'Interrupted',
  message:
    'Indexing stopped without finishing — the process was interrupted before it could report a result. ' +
    'Click Reindex to try again, or see History for details.',
};

export const UNRESPONSIVE_BANNER = {
  label: 'No recent progress',
  message:
    'This run has not reported progress in a while. It may still be working, or it may have stopped. ' +
    'Click Reindex to start a fresh run.',
};

export const UNRESPONSIVE_RUN_TOOLTIP = `${UNRESPONSIVE_BANNER.label} — this run may still be working, or may have stopped. Reindex to start a fresh run.`;

export const BannerMessageMap = {
  [BannerSeverity.success]: `Indexing completed successfully. ${BANNER_SUCCESS_SUFFIX}`,
  [BannerSeverity.warning]:
    'Indexing was stopped before completion. Click Reindex to restart indexing, or check History for the reason it stopped.',
  [BannerSeverity.error]:
    'Indexing failed before any files could be processed. Check the source connection and permissions, then try Reindex. See History for error details.',
  [BannerSeverity.info]:
    "Indexing may take a few minutes depending on size. You can navigate to other sections; indexing will continue in the background and you'll be notified when it's done.",
};

// Statuses that allow the index to be searched and run tools against
export const RUNNABLE_INDEX_STATUSES = [
  IndexStatuses.success,
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
  [IndexStatuses.interrupted]: 'Interrupted',
};

export const RUN_TEST_OPERATION_TYPES = new Set(INDEX_SEARCH_TOOL_LABELS.keys());

export const IndexCronDefault = '0 0 * * 6';
