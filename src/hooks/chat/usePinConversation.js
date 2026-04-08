import { useCallback } from 'react';

import { PinnedConversationListKey } from '@/common/constants';
import { areTheSameConversations, stableSort } from '@/common/utils';

export const sortConversations = conversations =>
  stableSort(conversations, (a, b) => {
    // First, compare the isPinned values (pinned conversations always come first)
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Get the timestamps for comparison (use updated_at if available, fallback to created_at)
    const dateA = new Date(a.updated_at || a.created_at);
    const dateB = new Date(b.updated_at || b.created_at);

    // If both conversations have the same ID (one is playback, one is original)
    if (a.id === b.id) {
      // Playback should always come before (above) the original conversation
      if (a.isPlayback && !b.isPlayback) return -1;
      if (!a.isPlayback && b.isPlayback) return 1;
      // If both are playback or both are original with same ID, sort by date
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;
      return 0;
    }

    // For conversations with different IDs, sort by timestamp
    // But ensure playback conversations stay with their original conversations
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;

    // If timestamps are equal, prioritize playback conversations
    if (a.isPlayback && !b.isPlayback) return -1;
    if (!a.isPlayback && b.isPlayback) return 1;

    // If both dates are the same, return 0 (no sorting)
    return 0;
  });

const getPinnedConversationList = () => {
  const pinnedConversationStr = localStorage.getItem(PinnedConversationListKey) || '{}';
  return JSON.parse(pinnedConversationStr);
};

export const getProjectPinnedConversationList = projectId => {
  const parsedJson = getPinnedConversationList();
  return parsedJson[projectId] || [];
};

const addPinnedConversationIntoList = (projectId, conversationId) => {
  const parsedJson = getPinnedConversationList();
  const pinnedConversationList = parsedJson[projectId] || [];
  const pinnedConversationStr = JSON.stringify({
    ...parsedJson,
    [projectId]: [conversationId, ...pinnedConversationList],
  });
  localStorage.setItem(PinnedConversationListKey, pinnedConversationStr);
};

const removeConversationFromPinnedList = (projectId, conversationId) => {
  const parsedJson = getPinnedConversationList();
  const pinnedConversationList = parsedJson[projectId] || [];
  const pinnedConversationStr = JSON.stringify({
    ...parsedJson,
    [projectId]: pinnedConversationList.filter(item => item !== conversationId),
  });
  localStorage.setItem(PinnedConversationListKey, pinnedConversationStr);
};

const usePinConversation = ({
  activeConversation,
  setActiveConversation,
  setConversations,
  setFolders,
  projectId,
}) => {
  const onPinConversation = useCallback(
    (conversation, isPinned) => {
      // Update active conversation if it matches the pinned conversation
      if (areTheSameConversations(conversation, activeConversation)) {
        setActiveConversation({
          ...activeConversation,
          isPinned,
        });
      }

      if (conversation.folder_id) {
        // Update in folders state
        setFolders(prevFolders =>
          prevFolders.map(folder => {
            if (folder.id === conversation.folder_id) {
              const updatedConversations = folder.conversations.map(item =>
                areTheSameConversations(conversation, item) ? { ...conversation, isPinned } : item,
              );
              return {
                ...folder,
                conversations: sortConversations(updatedConversations),
              };
            }
            return folder;
          }),
        );
      } else {
        // Update in ungrouped conversations state
        setConversations(prev => {
          const updatedConversations = prev.map(item =>
            areTheSameConversations(conversation, item) ? { ...conversation, isPinned } : item,
          );
          return sortConversations(updatedConversations);
        });
      }

      // Update pinned conversation list in localStorage
      if (isPinned) {
        addPinnedConversationIntoList(projectId, conversation.id);
      } else {
        removeConversationFromPinnedList(projectId, conversation.id);
      }
    },
    [activeConversation, setActiveConversation, setConversations, setFolders, projectId],
  );

  return {
    onPinConversation,
  };
};

export default usePinConversation;
