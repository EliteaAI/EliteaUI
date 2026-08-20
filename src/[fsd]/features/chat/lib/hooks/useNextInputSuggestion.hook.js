import { useCallback, useEffect, useState } from 'react';

import { sioEvents } from '@/common/constants';
import useSocket from '@/hooks/useSocket';

// Ephemeral, per-sid hint: only ever shown if it matches the conversation's
// latest message, so a newer send or a reconnect naturally invalidates it.
export const useNextInputSuggestion = ({ chatHistoryRef, conversationUuid, getInputContent }) => {
  const [suggestions, setSuggestions] = useState([]);

  const handleSuggestionReady = useCallback(
    payload => {
      const { stream_id, message_id, suggestions: list } = payload || {};

      const history = chatHistoryRef?.current;
      const lastMessage = history?.[history.length - 1];
      const matchesLastMessage = lastMessage && (lastMessage.id == message_id || lastMessage.id == stream_id);

      if (!matchesLastMessage) {
        setSuggestions([]);
        return;
      }

      if (!list?.length) return;
      if (getInputContent?.()) return;

      setSuggestions(list.slice(0, 3));
    },
    [chatHistoryRef, getInputContent],
  );

  useSocket(sioEvents.next_input_suggestion_ready, handleSuggestionReady);

  useEffect(() => {
    setSuggestions([]);
  }, [conversationUuid]);

  const dismiss = useCallback(() => setSuggestions([]), []);

  const accept = useCallback(
    index => {
      const text = suggestions[index];
      return text;
    },
    [suggestions],
  );

  return { suggestions, accept, dismiss };
};
