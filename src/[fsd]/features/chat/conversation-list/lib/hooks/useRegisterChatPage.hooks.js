import { useEffect, useLayoutEffect } from 'react';

import { EMPTY_CHAT_PAGE_STATE } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import { useChatHistoryActions } from '@/[fsd]/features/chat/conversation-list/lib/hooks/useChatHistory.hooks';

// While the chat page is open, the menu's history runs the page's own handlers (they know the open chat).
// The handlers go into a ref: they change with every streamed token and must not re-render the menu.
export const useRegisterChatPage = props => {
  const { actions, selectedConversationId = null, duplicatingConversationId = null } = props;
  const { chatPageActionsRef, setChatPageState } = useChatHistoryActions();

  useLayoutEffect(() => {
    chatPageActionsRef.current = actions;
  });

  useEffect(() => {
    setChatPageState(prev => ({ ...prev, isMounted: true }));
    return () => {
      chatPageActionsRef.current = null;
      setChatPageState(EMPTY_CHAT_PAGE_STATE);
    };
  }, [chatPageActionsRef, setChatPageState]);

  useEffect(() => {
    setChatPageState(prev =>
      prev.selectedConversationId === selectedConversationId &&
      prev.duplicatingConversationId === duplicatingConversationId
        ? prev
        : { ...prev, selectedConversationId, duplicatingConversationId },
    );
  }, [duplicatingConversationId, selectedConversationId, setChatPageState]);
};
