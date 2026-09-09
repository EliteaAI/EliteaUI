import { CONVERSATION_NAME_MAX_LENGTH } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import { stableSort } from '@/common/utils';

export const redistributeConversationsIntoGroups = (prevGroups, newFlatConversations) => {
  const idToGroup = new Map();

  prevGroups.forEach(group => {
    group.conversations.forEach(conv => {
      idToGroup.set(conv.id, group.name);
    });
  });

  const hasTodayGroup = prevGroups.some(g => g.name === 'today');
  const hasNewConversations = newFlatConversations.some(conv => !idToGroup.has(conv.id));

  const groups =
    hasTodayGroup || !hasNewConversations
      ? prevGroups
      : [{ name: 'today', conversations: [], offset: 0 }, ...prevGroups];

  return groups.map(group => ({
    ...group,
    conversations: newFlatConversations.filter(conv => {
      const originalGroup = idToGroup.get(conv.id);
      if (originalGroup) return originalGroup === group.name;
      return group.name === 'today' && !idToGroup.has(conv.id);
    }),
  }));
};

export const generateDuplicateName = originalName => {
  const baseNameMatch = originalName.match(/^(.+?)\s*\((\d+)\)$/);

  const baseName = baseNameMatch ? baseNameMatch[1] : originalName;
  const suffix = ` (${baseNameMatch ? parseInt(baseNameMatch[2], 10) + 1 : 1})`;

  const availableLength = CONVERSATION_NAME_MAX_LENGTH - suffix.length;
  const truncatedBaseName =
    baseName.length > availableLength ? baseName.slice(0, availableLength).trimEnd() : baseName;

  return `${truncatedBaseName}${suffix}`;
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
