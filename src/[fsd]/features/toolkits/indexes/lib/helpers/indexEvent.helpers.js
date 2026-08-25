import {
  INDEX_SEARCH_TOOL_LABELS,
  IndexHistoryItemsLabels,
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
  if (entry.state === IndexStatuses.success && entry.updated_on !== initialCompletedTs) {
    return 'Reindexed';
  }

  const searchToolLabel = INDEX_SEARCH_TOOL_LABELS.get(entry.operation_type);
  if (entry.state === IndexStatuses.runTest && searchToolLabel) return searchToolLabel;

  return IndexHistoryItemsLabels[entry.state] || entry.state;
};
