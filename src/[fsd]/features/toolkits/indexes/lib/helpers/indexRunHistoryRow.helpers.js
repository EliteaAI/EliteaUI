import { IndexRunInitiators, IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants';

// The Event of an index run in Run History (ticket #7682 AC-36): one of five events, never the outcome.
// The per-index History page keeps its own labels; only the run-history rows use these.
export const INDEX_RUN_EVENTS = {
  created: 'Index created',
  indexing: 'Indexing',
  reindex: 'Reindex',
  scheduledReindex: 'Scheduled reindex',
  searchIndex: 'Search index',
};

// The Status of an index run (ticket #7682 AC-38): the backend state, as a key of RUN_STATUS_STYLES
export const INDEX_RUN_STATUS_KEYS = {
  [IndexStatuses.progress]: 'running',
  [IndexStatuses.success]: 'success',
  [IndexStatuses.partlyOk]: 'partial',
  [IndexStatuses.fail]: 'failed',
  [IndexStatuses.cancelled]: 'stopped',
};

// Scheduled reindex is an event whatever its outcome: "Reindexed by schedule" and "Scheduled reindex failed"
// both read Scheduled reindex (AC-36)
export const resolveIndexRunEvent = (entry, { isSearch = false } = {}) => {
  if (isSearch) return INDEX_RUN_EVENTS.searchIndex;
  if (entry.state === IndexStatuses.scheduledReindex || entry.initiator === IndexRunInitiators.schedule) {
    return INDEX_RUN_EVENTS.scheduledReindex;
  }
  if (entry.state === IndexStatuses.created) return INDEX_RUN_EVENTS.created;
  if (entry.state === IndexStatuses.progress) return INDEX_RUN_EVENTS.indexing;
  if (entry.reindex === true) return INDEX_RUN_EVENTS.reindex;
  return INDEX_RUN_EVENTS.indexing;
};

export const resolveIndexRunStatus = entry => INDEX_RUN_STATUS_KEYS[entry.state] ?? null;
