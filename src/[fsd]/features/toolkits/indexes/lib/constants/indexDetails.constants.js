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

// The interrupted banner keeps warning severity but replaces the generic "Stopped"
// copy: the run was killed by the platform, not stopped by a user.
export const INTERRUPTED_BANNER = {
  label: 'Interrupted',
  message:
    'Indexing stopped without finishing — the process was interrupted before it could report a result. ' +
    'Click Reindex to try again, or see History for details.',
};

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
