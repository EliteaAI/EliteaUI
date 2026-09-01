import { ROLES } from '@/common/constants';

/**
 * Resolve a streamed assistant turn against the history being updated.
 *
 * Socket events can arrive before React has committed an earlier insertion
 * (notably pipeline HITL decision -> continuation). Array indexes resolved
 * from a render-time ref are therefore not stable. The backend message id is
 * authoritative; question id is only a compatibility fallback for assistant
 * turns that were created locally before their server id was known.
 */
export const findChatSocketMessageIndex = (history = [], messageId, questionId) => {
  if (messageId) {
    const messageIndex = history.findIndex(item => item.id === messageId);
    if (messageIndex !== -1) return messageIndex;
  }

  if (!questionId) return -1;

  return history.findIndex(item => item.role === ROLES.Assistant && item.question_id === questionId);
};

export const isLocalAssistantPlaceholder = message =>
  message?.role === ROLES.Assistant && Boolean(message.internal_id);

export const mergeChatSocketMessage = (history, message, { messageId = message?.id, questionId } = {}) => {
  const messageIndex = findChatSocketMessageIndex(history, messageId, questionId);
  if (messageIndex === -1) return history;

  const nextHistory = [...history];
  nextHistory[messageIndex] = {
    ...nextHistory[messageIndex],
    ...message,
    ...(messageId ? { id: messageId } : {}),
  };
  return nextHistory;
};
