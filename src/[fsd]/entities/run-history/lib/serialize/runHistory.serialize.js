import { CHAT_CONVERSATION_SOURCE } from '@/[fsd]/entities/run-history/lib/helpers';

const serializeRunSummary = conversation => {
  const summary = conversation.run_summary;
  if (!summary) return {};

  return {
    source: conversation.source,
    is_shared_chat: conversation.source === CHAT_CONVERSATION_SOURCE,
    message_count: conversation.message_groups_count ?? 0,
    status: summary.status ?? null,
    author: summary.author ?? null,
    models: summary.models ?? null,
    tokens: summary.tokens ?? null,
    cost: summary.cost ?? null,
    last_run_id: summary.last_run_id ?? null,
    usage_available: Boolean(summary.usage_available),
  };
};

const serializeRunHistory = conversation => {
  if (!conversation) return null;

  return {
    id: conversation.id,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    name: conversation.name,
    duration: conversation.duration,
    version_id:
      conversation.run_summary?.version_id ??
      conversation.meta.single_participant?.entity_settings?.version_id ??
      null,
    index_name: conversation.meta?.index_name ?? null,
    operation_type: conversation.meta?.operation_type ?? null,
    ...serializeRunSummary(conversation),
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
    ...(response.facets ? { facets: response.facets } : {}),
    modelFilterUnavailable: Boolean(response.model_filter_unavailable),
  };
};
