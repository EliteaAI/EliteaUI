import { useCallback } from 'react';

import { useTogglePinItemMutation } from '@/api';

const removeFromDateGroups = (setDateGroups, conversationId) => {
  setDateGroups(prev =>
    prev.map(group => {
      const found = group.conversations.some(c => c.id === conversationId);
      if (!found) return group;
      return {
        ...group,
        conversations: group.conversations.filter(c => c.id !== conversationId),
        total: Math.max((group.total || 0) - 1, 0),
      };
    }),
  );
};

const removeFromFolders = (setFolders, conversationId) => {
  setFolders(prev =>
    prev.map(folder => {
      const found = folder.conversations?.some(c => c.id === conversationId);
      if (!found) return folder;
      return {
        ...folder,
        conversations: folder.conversations.filter(c => c.id !== conversationId),
        total: Math.max((folder.total || 0) - 1, 0),
      };
    }),
  );
};

const restoreToDateGroups = (setDateGroups, conversation) => {
  setDateGroups(prev => {
    const targetGroup = prev.find(g => g.name === 'today') || prev[0];
    if (!targetGroup) return prev;
    return prev.map(group => {
      if (group.name !== targetGroup.name) return group;
      return {
        ...group,
        conversations: [conversation, ...group.conversations],
        total: (group.total || 0) + 1,
      };
    });
  });
};

const restoreToFolders = (setFolders, conversation) => {
  setFolders(prev =>
    prev.map(folder => {
      if (folder.id !== conversation.folder_id) return folder;
      return {
        ...folder,
        conversations: [conversation, ...(folder.conversations || [])],
        total: (folder.total || 0) + 1,
      };
    }),
  );
};

export const usePinConversation = props => {
  const {
    activeConversation,
    setActiveConversation,
    setPinnedConversations,
    setDateGroups,
    setFolders,
    projectId,
    toastError,
  } = props;

  const [togglePinItem] = useTogglePinItemMutation();

  const onPinConversation = useCallback(
    async (conversation, shouldPin) => {
      const unpinnedConversation = { ...conversation, isPinned: undefined };

      if (shouldPin) {
        setPinnedConversations(prev => [{ ...conversation, isPinned: true }, ...prev]);
        if (conversation.folder_id) removeFromFolders(setFolders, conversation.id);
        else removeFromDateGroups(setDateGroups, conversation.id);
      } else {
        setPinnedConversations(prev => prev.filter(c => c.id !== conversation.id));
        if (conversation.folder_id) restoreToFolders(setFolders, unpinnedConversation);
        else restoreToDateGroups(setDateGroups, unpinnedConversation);
      }

      if (activeConversation?.id === conversation.id) {
        setActiveConversation(prev => ({ ...prev, isPinned: shouldPin }));
      }

      try {
        await togglePinItem({
          projectId,
          entityType: 'conversation',
          entityId: conversation.id,
          shouldPin,
        }).unwrap();
      } catch {
        if (shouldPin) {
          setPinnedConversations(prev => prev.filter(c => c.id !== conversation.id));
          if (conversation.folder_id) restoreToFolders(setFolders, unpinnedConversation);
          else restoreToDateGroups(setDateGroups, unpinnedConversation);
        } else {
          setPinnedConversations(prev => [{ ...conversation, isPinned: true }, ...prev]);
          if (conversation.folder_id) removeFromFolders(setFolders, conversation.id);
          else removeFromDateGroups(setDateGroups, conversation.id);
        }

        if (activeConversation?.id === conversation.id)
          setActiveConversation(prev => ({ ...prev, isPinned: !shouldPin }));

        toastError?.(shouldPin ? 'Failed to pin conversation' : 'Failed to unpin conversation');
      }
    },
    [
      activeConversation,
      setActiveConversation,
      setPinnedConversations,
      setDateGroups,
      setFolders,
      projectId,
      togglePinItem,
      toastError,
    ],
  );

  return {
    onPinConversation,
  };
};
