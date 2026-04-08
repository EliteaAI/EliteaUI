const serializeRunHistory = conversation => {
  if (!conversation) return null;

  return {
    id: conversation.id,
    created_at: conversation.created_at,
    name: conversation.name,
    duration: conversation.duration,
    version_id: conversation.meta.single_participant?.entity_settings?.version_id ?? null,
  };
};

const serializeRunHistoryList = history => {
  if (!Array.isArray(history)) return [];

  return history.map(serializeRunHistory).filter(Boolean);
};

export const serializeRunHistoryListResponse = (response, isLoadMore) => {
  if (!response) return { rows: [], total: 0, isLoadMore };

  if (Array.isArray(response)) {
    return {
      rows: serializeRunHistoryList(response),
      total: response.length,
      isLoadMore,
    };
  }

  return {
    rows: serializeRunHistoryList(response.rows || response.conversations || []),
    total: response.total || 0,
    hasMore: response.has_more ?? false,
    nextPage: response.next_page || null,
    isLoadMore,
  };
};
