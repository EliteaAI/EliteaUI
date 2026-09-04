import {
  INDEX_SEARCH_TOOL_LABELS,
  IndexHistoryItemsLabels,
  IndexRunInitiators,
  IndexStatuses,
} from '@/[fsd]/features/toolkits/indexes/lib/constants';

export const initialCompletedTsOf = history => {
  const completed = (history || []).filter(entry => entry?.state === IndexStatuses.success);
  if (!completed.length) return null;
  return completed.reduce(
    (earliest, entry) => (entry.updated_on < earliest ? entry.updated_on : earliest),
    completed[0].updated_on,
  );
};

export const resolveIndexEventLabel = (entry, initialCompletedTs) => {
  if (entry.state === IndexStatuses.success) {
    // Entries written before the backend recorded `reindex` fall back to the
    // first-completed-timestamp heuristic that used to be the only signal.
    const isReindex =
      typeof entry.reindex === 'boolean' ? entry.reindex : entry.updated_on !== initialCompletedTs;
    if (isReindex) return 'Reindexed';
  }

  if (entry.state === IndexStatuses.fail) {
    if (entry.initiator === IndexRunInitiators.schedule) return 'Scheduled reindex failed';
    if (entry.reindex === true) return 'Reindex failed';
  }

  const searchToolLabel = INDEX_SEARCH_TOOL_LABELS.get(entry.operation_type);
  if (entry.state === IndexStatuses.runTest && searchToolLabel) return searchToolLabel;

  return IndexHistoryItemsLabels[entry.state] || entry.state;
};
