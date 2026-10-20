import { ROLES, TOOL_ACTION_NAMES, TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';

import { settleHitlResumeAttempt } from './hitl.helpers';

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

/**
 * Insert a new assistant message into history after its anchor user message.
 * If the user message hasn't arrived yet (out-of-order delivery), append at
 * the end so the message is never lost; position is restored once the user
 * message lands via `reorderHistoryOnUserArrival`.
 */
export const insertNewAssistantMessage = (history, msg, questionId) => {
  if (!questionId) return [...history, msg];

  const questionIndex = history.findIndex(item => item.role === ROLES.User && item.id === questionId);
  if (questionIndex === -1) return [...history, msg];

  const next = [...history];
  next.splice(questionIndex + 1, 0, msg);
  return next;
};

/**
 * Insert an arriving user message into its correct position.
 * When the assistant message was already appended at the end (because
 * `insertNewAssistantMessage` received it before the user message arrived),
 * splice the user message in before that dangling assistant entry.
 */
export const reorderHistoryOnUserArrival = (history, userMsg) => {
  const danglingIdx = history.findIndex(m => m.role === ROLES.Assistant && m.question_id === userMsg.id);
  if (danglingIdx !== -1) {
    const next = [...history];
    next.splice(danglingIdx, 0, userMsg);
    return next;
  }
  return [...history, userMsg];
};

/**
 * Build a minimal tool-action stub when a start event was missed.
 * The type determines the fallback display name (Llm vs Toolkit).
 */
export const createSyntheticToolAction = (id, name, type, createdAt) => ({
  id,
  name: name || (type === TOOL_ACTION_TYPES.Llm ? TOOL_ACTION_NAMES.Llm : TOOL_ACTION_NAMES.Toolkit),
  type,
  status: ToolActionStatus.processing,
  toolMeta: {},
  ...(createdAt !== undefined ? { created_at: createdAt } : {}),
});

export const mergeChatSocketMessage = (history, message, { messageId = message?.id, questionId } = {}) => {
  const messageIndex = findChatSocketMessageIndex(history, messageId, questionId);
  // Preserve the original reference when no message matches so React state
  // updaters can short-circuit via referential equality.
  if (messageIndex === -1) return history;

  const nextHistory = [...history];
  nextHistory[messageIndex] = {
    ...nextHistory[messageIndex],
    ...message,
    ...(messageId ? { id: messageId } : {}),
  };
  return nextHistory;
};

/**
 * Input guardrail refusal (#6886). The event carries the question id for a refused new
 * turn (nothing was stored) or the assistant message id for a refused resume or
 * application run. Either way the waiting assistant turn is settled and carries the
 * verdict, so the block card renders where the answer would have been and streaming
 * state clears the same way it does for an error.
 */
export const applyInputGuardrailBlocked = (history = [], { messageId, questionId, verdict, message }) => {
  const guardrail = { ...(verdict || {}), message: message || '' };
  const isTarget = item =>
    item.role === ROLES.Assistant &&
    (item.id === messageId || (!!questionId && item.question_id === questionId));
  if (!history.some(isTarget)) return history;
  return history.map(item => {
    if (!isTarget(item)) return item;
    // A refused resume leaves the pause in place, so its buttons must work again
    const settled = item.hitlInterrupts?.length
      ? settleHitlResumeAttempt(item.hitlInterrupts, false)
      : undefined;
    return {
      ...item,
      isLoading: false,
      isStreaming: false,
      isRegenerating: false,
      isSending: false,
      // Mirrors the stored is_error, so the turn renders the same after a reload
      exception: guardrail.message,
      inputGuardrail: guardrail,
      ...(settled ? { hitlInterrupts: settled, hitlInterrupt: settled[0] } : {}),
    };
  });
};

/**
 * Input guardrail notice (#6886): the stored copy was redacted (content set) or only
 * flagged (content null). Replace the sender's optimistic text so it matches what the
 * model and other viewers see, and attach the verdict for the notice.
 */
export const applyInputGuardrailNotice = (history = [], { questionId, verdict, content }) => {
  const index = history.findIndex(item => item.role === ROLES.User && item.id === questionId);
  if (index === -1) return history;
  const item = history[index];
  const next = [...history];
  const hasRedacted = typeof content === 'string';
  let replaced = false;
  next[index] = {
    ...item,
    inputGuardrail: verdict,
    ...(hasRedacted && item.content !== undefined ? { content } : {}),
    ...(hasRedacted && item.message_items
      ? {
          message_items: item.message_items.map(messageItem => {
            if (replaced || messageItem.item_type !== 'text_message') return messageItem;
            replaced = true;
            return { ...messageItem, item_details: { ...messageItem.item_details, content } };
          }),
        }
      : {}),
  };
  return next;
};
