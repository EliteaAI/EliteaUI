const RUN_IDENTITY_FIELDS = [
  'index_generation',
  'execution_id',
  'index_meta_id',
  'conversation_id',
  'task_id',
];

export const getIndexHistoryRunIdentity = item => {
  if (!item) return null;

  for (const field of RUN_IDENTITY_FIELDS) {
    const value = item[field];

    if (value !== null && value !== undefined && value !== '') {
      return `${field}:${String(value)}`;
    }
  }

  return Number.isFinite(item.updated_on) ? `updated_on:${item.updated_on}` : null;
};

const findLatestRunSnapshot = (history, runIdentity) => {
  if (!runIdentity) return null;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (getIndexHistoryRunIdentity(history[index]) === runIdentity) {
      return history[index];
    }
  }

  return null;
};

export const reconcileIndexHistorySelection = ({
  history,
  selectedItem,
  previousLatestIdentity,
  initialized,
}) => {
  const latestItem = history[history.length - 1] ?? null;
  const latestIdentity = getIndexHistoryRunIdentity(latestItem);

  if (!initialized || !selectedItem) {
    return { selectedItem: latestItem, latestIdentity };
  }

  const selectedIdentity = getIndexHistoryRunIdentity(selectedItem);
  const wasFollowingLatest = previousLatestIdentity !== null && selectedIdentity === previousLatestIdentity;

  if (wasFollowingLatest) {
    return { selectedItem: latestItem, latestIdentity };
  }

  return {
    selectedItem: findLatestRunSnapshot(history, selectedIdentity) ?? selectedItem,
    latestIdentity,
  };
};
