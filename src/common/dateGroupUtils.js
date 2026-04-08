// Utility functions for date-based conversation grouping

export const getDateGroup = dateString => {
  // If no date string is provided, default to 'Today' for new conversations
  if (!dateString) return 'Today';

  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Check if date is valid
  if (isNaN(messageDate.getTime())) {
    return 'Today'; // Default to 'Today' for invalid dates
  }

  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else if (messageDate >= weekAgo) {
    return 'This Week';
  } else {
    return 'Older';
  }
};

export const groupConversationsByDate = conversations => {
  const groups = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  conversations.forEach(conversation => {
    // Use updated_at if available, otherwise use created_at, or current timestamp for new conversations
    const dateToUse = conversation.updated_at || conversation.created_at || new Date().toISOString();
    const group = getDateGroup(dateToUse);
    groups[group].push(conversation);
  });

  // Sort conversations within each group by updated_at (most recent first)
  Object.keys(groups).forEach(groupName => {
    groups[groupName].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
  });

  // Filter out empty groups and return in the correct order
  const result = [];
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

  groupOrder.forEach(groupName => {
    if (groups[groupName].length > 0) {
      result.push({
        name: groupName,
        conversations: groups[groupName],
        isDateGroup: true,
        isExpanded: false, // Initial expansion will be handled by the hook
      });
    }
  });

  return result;
};

export const getFirstAvailableGroup = groups => {
  if (!groups || groups.length === 0) return null;
  const order = ['Today', 'Yesterday', 'This Week', 'Older'];

  for (const groupName of order) {
    const group = groups.find(g => g.name === groupName);
    if (group) return group.name;
  }

  return groups[0]?.name || null;
};

export const shouldExpandTodayGroup = groupName => {
  return groupName === 'Today';
};
