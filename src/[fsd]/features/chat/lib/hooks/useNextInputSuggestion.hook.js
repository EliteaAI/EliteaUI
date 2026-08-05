import { useCallback, useEffect, useState } from 'react';

import { sioEvents } from '@/common/constants';
import useSocket from '@/hooks/useSocket';

// Ephemeral, per-sid hint: only ever shown if it matches the conversation's
// latest message, so a newer send or a reconnect naturally invalidates it.
export const useNextInputSuggestion = ({ chatHistoryRef, conversationUuid, getInputContent }) => {
  const [suggestion, setSuggestion] = useState(null);

  const handleSuggestionReady = useCallback(
    payload => {
      const { stream_id, message_id, suggestion: text } = payload || {};
      if (!text) return;

      const history = chatHistoryRef?.current;
      const lastMessage = history?.[history.length - 1];
      const matchesLastMessage = lastMessage && (lastMessage.id == message_id || lastMessage.id == stream_id);
      if (!matchesLastMessage) return;

      if (getInputContent?.()) return;

      setSuggestion(text);
    },
    [chatHistoryRef, getInputContent],
  );

  useSocket(sioEvents.next_input_suggestion_ready, handleSuggestionReady);

  useEffect(() => {
    setSuggestion(null);
  }, [conversationUuid]);

  const dismiss = useCallback(() => setSuggestion(null), []);

  const accept = useCallback(() => {
    setSuggestion(null);
    return suggestion;
  }, [suggestion]);

  return { suggestion, accept, dismiss };
};
