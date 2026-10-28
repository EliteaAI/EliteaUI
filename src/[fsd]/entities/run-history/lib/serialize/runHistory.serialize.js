import { isSkillChatRun } from '../helpers';

const serializeRunHistory = (conversation, historyEntity) => {
  if (!conversation) return null;

  return {
    id: conversation.id,
    created_at: conversation.run_started_at ?? conversation.created_at,
    updated_at: conversation.updated_at,
    name: conversation.name,
    duration: conversation.duration,
    version_id:
      conversation.skill_version_id ??
      conversation.meta.single_participant?.entity_settings?.version_id ??
      null,
    is_chat_run: isSkillChatRun(
      conversation,
      historyEntity.source,
      historyEntity.entityId,
      historyEntity.entityProjectId,
    ),
    index_name: conversation.meta?.index_name ?? null,
    operation_type: conversation.meta?.operation_type ?? null,
    execution_type: conversation.execution_type ?? null,
    schedule_run: conversation.schedule_run ?? null,
  };
};

const serializeRunHistoryList = (history, historyEntity) => {
  if (!Array.isArray(history)) return [];

  return history.map(conversation => serializeRunHistory(conversation, historyEntity)).filter(Boolean);
};

export const serializeRunHistoryListResponse = (response, isLoadMore, historyEntity = {}) => {
  if (!response) return { rows: [], total: 0, isLoadMore };

  if (Array.isArray(response)) {
    return {
      rows: serializeRunHistoryList(response, historyEntity),
      total: response.length,
      isLoadMore,
    };
  }

  return {
    rows: serializeRunHistoryList(response.rows || response.conversations || [], historyEntity),
    total: response.total || 0,
    hasMore: response.has_more ?? false,
    nextPage: response.next_page || null,
    isLoadMore,
  };
};
