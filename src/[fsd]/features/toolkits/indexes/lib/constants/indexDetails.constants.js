export const NEW_INDEX_ID = 'new_index';

export const IndexViewsEnum = {
  create: 'create',
  edit: 'edit',
};

export const EditViewTabsEnum = {
  run: 'run',
  configuration: 'configuration',
  history: 'history',
};

export const IndexesToolsEnum = {
  indexData: 'index_data',
  searchIndexData: 'search_index',
  stepbackSearchIndex: 'stepback_search_index',
  stepbackSummaryIndex: 'stepback_summary_index',
  removeIndex: 'remove_index',
};

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
  [BannerSeverity.warning]: 'Indexing stopped',
  [BannerSeverity.error]: 'Index processing error',
  [BannerSeverity.info]: 'Indexing in progress…',
};

export const BannerMessageMap = {
  [BannerSeverity.success]:
    '{{indexed_files}} files indexed successfully, {{skipped_files}} files skipped (unsupported format). The index is ready to search.',
  [BannerSeverity.warning]:
    'Indexing was stopped before completion. Click Reindex to restart indexing, or check History for the reason it stopped.',
  [BannerSeverity.error]:
    'Indexing failed before any files could be processed. Check the source connection and permissions, then try Reindex. See History for error details.',
  [BannerSeverity.info]:
    "Indexing — this may take a few minutes depending on size. You can navigate to other sections; indexing will continue in the background and you'll be notified when it's done.",
};

// Statuses that allow the index to be searched and run tools against
export const RUNNABLE_INDEX_STATUSES = [
  IndexStatuses.success,
  IndexStatuses.partlyOk,
  IndexStatuses.scheduledReindex,
];

export const PARTLY_INDEXED_REINDEX_MESSAGE =
  'Index completed with partial results. Reindex to retry skipped content.';

export const IndexHistoryItemsLabels = {
  [IndexStatuses.success]: 'Indexed',
  [IndexStatuses.created]: 'Created',
  [IndexStatuses.cancelled]: 'Stopped',
  [IndexStatuses.fail]: 'Failed',
  [IndexStatuses.partlyOk]: 'Partially Indexed',
  [IndexStatuses.scheduledReindex]: 'Reindexed by schedule',
  [IndexStatuses.runTest]: 'Run test',
};

export const RUN_TEST_OPERATION_TYPES = new Set([
  'search_index',
  'stepback_search_index',
  'stepback_summary_index',
]);

export const IndexCronDefault = '0 0 * * 6';
