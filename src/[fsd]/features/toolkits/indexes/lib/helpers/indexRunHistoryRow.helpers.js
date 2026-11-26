import { IndexRunInitiators, IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants';

// Run History events of an index run; the per-index History page keeps its own labels
export const INDEX_RUN_EVENTS = {
  created: 'Index created',
  indexing: 'Indexing',
  reindex: 'Reindex',
  scheduledReindex: 'Scheduled reindex',
  searchIndex: 'Search index',
};

export const INDEX_RUN_STATUS_KEYS = {
  [IndexStatuses.progress]: 'running',
  [IndexStatuses.success]: 'success',
  [IndexStatuses.partlyOk]: 'partial',
  [IndexStatuses.fail]: 'failed',
  [IndexStatuses.cancelled]: 'stopped',
};

// A scheduled reindex reads as Scheduled reindex whatever its outcome
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
