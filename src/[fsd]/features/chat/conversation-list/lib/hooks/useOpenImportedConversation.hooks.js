import { useCallback } from 'react';

import { sortConversations } from '@/[fsd]/features/chat/conversation-list/lib/helpers';

export const useOpenImportedConversation = props => {
  const { setConversations, onSelectConversation } = props;

  const onImportedConversation = useCallback(
    async conversation => {
      // Unknown ids land in the "today" date group
      setConversations(prevConversations =>
        sortConversations([...prevConversations, { ...conversation, updated_at: new Date().toISOString() }]),
      );
      // Regular selection loads details + traces and builds chat_history, so messages render right away
      await onSelectConversation(conversation);
    },
    [onSelectConversation, setConversations],
  );

  return { onImportedConversation };
};
