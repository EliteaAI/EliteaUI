const getConversationTime = conversation =>
  new Date(conversation.updated_at || conversation.created_at || 0).getTime();

// A refetch returns only the first page of each date group. The chats loaded past it are kept, so the
// menu does not lose its scrolled pages; the ones that fall inside the new page window and are missing
// from it were deleted or moved, so they go. A kept chat the server returned anywhere else (another group,
// a folder, pinned) moved there, so it goes too.
export const mergeDateGroupsFirstPage = (loadedGroups = [], serverGroups = [], otherServerIds = []) => {
  const serverIds = new Set([
    ...otherServerIds,
    ...serverGroups.flatMap(group => (group.conversations || []).map(conversation => conversation.id)),
  ]);

  return serverGroups.map(serverGroup => {
    const loadedGroup = loadedGroups.find(group => group.name === serverGroup.name);
    const serverConversations = serverGroup.conversations || [];

    if (!loadedGroup?.conversations?.length || serverConversations.length >= (serverGroup.total || 0))
      return serverGroup;

    const lastServerConversation = serverConversations[serverConversations.length - 1];
    const lastServerTime = lastServerConversation ? getConversationTime(lastServerConversation) : Infinity;

    const loadedTail = loadedGroup.conversations.filter(
      conversation =>
        !conversation.isPlayback &&
        !serverIds.has(conversation.id) &&
        getConversationTime(conversation) < lastServerTime,
    );

    if (!loadedTail.length) return serverGroup;

    return {
      ...serverGroup,
      conversations: [...serverConversations, ...loadedTail],
      offset: Math.max(serverGroup.offset || 0, loadedGroup.offset || 0),
      exhausted: loadedGroup.exhausted,
    };
  });
};

export const applyPrivacyToLists = ({ conversationId, isPrivate }) => {
  const applyPrivate = conversation =>
    conversation.id === conversationId ? { ...conversation, is_private: isPrivate } : conversation;

  return {
    updateConversations: prev => prev.map(applyPrivate),
    updateFolders: prev =>
      prev.map(folder => ({ ...folder, conversations: (folder.conversations || []).map(applyPrivate) })),
  };
};
