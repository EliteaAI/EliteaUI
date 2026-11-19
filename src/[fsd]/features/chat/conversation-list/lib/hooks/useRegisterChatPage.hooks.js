import { useEffect, useLayoutEffect } from 'react';

import { EMPTY_CHAT_PAGE_STATE } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import { useChatHistoryActions } from '@/[fsd]/features/chat/conversation-list/lib/hooks/useChatHistory.hooks';

// While the chat page is open, the menu's history runs the page's own handlers (they know the open chat).
// The handlers go into a ref: they change with every streamed token and must not re-render the menu.
export const useRegisterChatPage = props => {
  const { actions, selectedConversationId = null, duplicatingConversationId = null } = props;
  const { chatPageActionsRef, setChatPageState, setConversations, setFolders } = useChatHistoryActions();

  useLayoutEffect(() => {
    chatPageActionsRef.current = actions;
  });

  useEffect(() => {
    setChatPageState(prev => ({ ...prev, isMounted: true }));
    return () => {
      chatPageActionsRef.current = null;
      setChatPageState(EMPTY_CHAT_PAGE_STATE);
      // A playback copy only makes sense on the chat page
      setConversations(prev => prev.filter(conversation => !conversation.isPlayback));
      setFolders(prev =>
        prev.map(folder =>
          folder.conversations?.some(conversation => conversation.isPlayback)
            ? {
                ...folder,
                conversations: folder.conversations.filter(conversation => !conversation.isPlayback),
              }
            : folder,
        ),
      );
    };
  }, [chatPageActionsRef, setChatPageState, setConversations, setFolders]);

  useEffect(() => {
    setChatPageState(prev =>
      prev.selectedConversationId === selectedConversationId &&
      prev.duplicatingConversationId === duplicatingConversationId
        ? prev
        : { ...prev, selectedConversationId, duplicatingConversationId },
    );
  }, [duplicatingConversationId, selectedConversationId, setChatPageState]);
};
