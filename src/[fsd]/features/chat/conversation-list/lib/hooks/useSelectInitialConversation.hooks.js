import { useEffect, useRef } from 'react';

import { useSelector } from 'react-redux';

import { useChatHistoryData } from '@/[fsd]/features/chat/conversation-list/lib/hooks/useChatHistory.hooks';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { selectLastSelectedConversationIdByProject } from '@/slices/chat';

// Opens the last selected chat (or the first one) when the chat page has none to show
export const useSelectInitialConversation = props => {
  const { onSelectConversation, skipSetConversation } = props;
  const projectId = useSelectedProjectId();

  const { dateGroups, folders, pinnedConversations, isConversationsLoaded, serverSelectedConversationId } =
    useChatHistoryData();

  const lastSelectedConversationId = useSelector(selectLastSelectedConversationIdByProject(projectId));

  // The lists are read when the selection runs, not as triggers
  const listsRef = useRef({ dateGroups, folders, pinnedConversations });
  listsRef.current = { dateGroups, folders, pinnedConversations };

  const onSelectConversationRef = useRef(onSelectConversation);
  onSelectConversationRef.current = onSelectConversation;

  useEffect(() => {
    if (skipSetConversation || !isConversationsLoaded) return;

    const { dateGroups: groups, folders: folderList, pinnedConversations: pinned } = listsRef.current;
    const conversationList = [
      ...(pinned || []),
      ...(groups || []).flatMap(group => group.conversations || []),
      ...(folderList || []).flatMap(folder => folder.conversations || []),
    ];

    const effectiveSelectedId = lastSelectedConversationId ?? serverSelectedConversationId;
    const selectedConversation =
      conversationList.find(conversation => conversation.id == effectiveSelectedId) ||
      (effectiveSelectedId ? null : conversationList[0]);

    if (selectedConversation) onSelectConversationRef.current?.(selectedConversation);
    else if (effectiveSelectedId) onSelectConversationRef.current?.({ id: effectiveSelectedId });
  }, [skipSetConversation, isConversationsLoaded, serverSelectedConversationId, lastSelectedConversationId]);
};
