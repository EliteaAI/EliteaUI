import { stableSort } from '@/common/utils';

export const redistributeConversationsIntoGroups = (prevGroups, newFlatConversations) => {
  const idToGroup = new Map();

  prevGroups.forEach(group => {
    group.conversations.forEach(conv => {
      idToGroup.set(conv.id, group.name);
    });
  });

  return prevGroups.map(group => ({
    ...group,
    conversations: newFlatConversations.filter(conv => {
      const originalGroup = idToGroup.get(conv.id);
      if (originalGroup) return originalGroup === group.name;
      return group.name === 'today' && !idToGroup.has(conv.id);
    }),
  }));
};

export const sortConversations = conversations =>
  stableSort(conversations, (a, b) => {
    const dateA = new Date(a.updated_at || a.created_at);
    const dateB = new Date(b.updated_at || b.created_at);

    if (a.id === b.id) {
      if (a.isPlayback && !b.isPlayback) return -1;
      if (!a.isPlayback && b.isPlayback) return 1;
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;
      return 0;
    }

    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;

    if (a.isPlayback && !b.isPlayback) return -1;
    if (!a.isPlayback && b.isPlayback) return 1;

    return 0;
  });
