import { useCallback, useEffect, useRef, useState } from 'react';

import { sioEvents } from '@/common/constants';
import useSocket from '@/hooks/useSocket';

// Ephemeral hint: prefer the terminal message identity and allow the active
// conversation identity as a first-turn reconciliation fallback. The first
// response can be replaced by its hydrated DB representation before this
// event is applied, so its local message id is not stable across that handoff.
export const useNextInputSuggestion = ({
  chatHistory,
  chatHistoryRef,
  conversationUuid,
  getInputContent,
}) => {
  const [suggestion, setSuggestion] = useState(null);
  const pendingSuggestionRef = useRef(null);
  const suggestionPayloadRef = useRef(null);
  const previousConversationUuidRef = useRef(conversationUuid);

  const applySuggestion = useCallback(
    payload => {
      const { stream_id, message_id, suggestion: text } = payload || {};
      if (!text) return true;

      const history = chatHistoryRef?.current;
      const lastMessage = history?.[history.length - 1];
      const matchesLastMessage = lastMessage && (lastMessage.id == message_id || lastMessage.id == stream_id);
      const matchesActiveConversation = conversationUuid && stream_id == conversationUuid;
      if (!matchesLastMessage && !matchesActiveConversation) return false;

      // A typed user value always wins over an asynchronous hint.
      if (getInputContent?.()) return true;

      suggestionPayloadRef.current = payload;
      setSuggestion(text);
      return true;
    },
    [chatHistoryRef, conversationUuid, getInputContent],
  );

  const handleSuggestionReady = useCallback(
    payload => {
      pendingSuggestionRef.current = payload;
      if (applySuggestion(payload)) pendingSuggestionRef.current = null;
    },
    [applySuggestion],
  );

  useSocket(sioEvents.next_input_suggestion_ready, handleSuggestionReady);

  useEffect(() => {
    if (previousConversationUuidRef.current === conversationUuid) return;
    previousConversationUuidRef.current = conversationUuid;

    // A first send promotes the provisional "New Chat" to its durable UUID
    // while the terminal response and suggestion are settling. Preserve only
    // an identity-bound hint emitted for that newly adopted conversation;
    // ordinary navigation still clears both rendered and buffered hints.
    const suggestionPayload = pendingSuggestionRef.current || suggestionPayloadRef.current;
    if (conversationUuid && suggestionPayload?.stream_id == conversationUuid) return;

    pendingSuggestionRef.current = null;
    suggestionPayloadRef.current = null;
    setSuggestion(null);
  }, [conversationUuid]);

  // The durable event can arrive just before the terminal assistant message is
  // committed to React history on a conversation's first turn. Retry exactly
  // that one identity-bound event when history advances; accepting, dismissing,
  // sending another turn, or changing conversations clears it.
  useEffect(() => {
    const pending = pendingSuggestionRef.current;
    if (pending && applySuggestion(pending)) pendingSuggestionRef.current = null;
  }, [applySuggestion, chatHistory]);

  const dismiss = useCallback(() => {
    pendingSuggestionRef.current = null;
    suggestionPayloadRef.current = null;
    setSuggestion(null);
  }, []);

  const accept = useCallback(() => {
    pendingSuggestionRef.current = null;
    suggestionPayloadRef.current = null;
    setSuggestion(null);
    return suggestion;
  }, [suggestion]);

  return { suggestion, accept, dismiss, onSuggestionReady: handleSuggestionReady };
};
