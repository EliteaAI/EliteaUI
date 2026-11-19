export const DATE_GROUP_DISPLAY_NAMES = {
  today: 'Today',
  this_week: 'This Week',
  older: 'Older',
};

export const DATE_GROUP_ORDER = ['today', 'this_week', 'older'];

export const DEFAULT_EXPANDED_GROUP = 'today';

// What the menu knows about the chat page while it is closed
export const EMPTY_CHAT_PAGE_STATE = {
  isMounted: false,
  selectedConversationId: null,
  duplicatingConversationId: null,
};

export const PINNED_GROUP = {
  name: 'pinned',
  displayName: 'Pinned',
};

// The menu lists chats on every page, so it must not pick up a page's own sort params from the URL
export const CHAT_HISTORY_SORT = {
  sort_by: 'updated_at',
  sort_order: 'desc',
};

export const CONVERSATION_NAME_MAX_LENGTH = 50;
