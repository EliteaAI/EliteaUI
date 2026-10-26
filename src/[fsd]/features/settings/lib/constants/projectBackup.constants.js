export const RESTORE_OPTION_LABELS = {
  allowMismatch: 'Restore here anyway',
  dryRun: 'Preview only (no data is restored yet)',
  truncate: 'Replace existing data - do not merge',
};

export const CHATS_OPTION = {
  none: 'none',
  withoutAttachments: 'without_attachments',
  withAttachments: 'with_attachments',
};

export const CHAT_BACKUP_OPTION_LABELS = {
  [CHATS_OPTION.none]: 'Do not include chats',
  [CHATS_OPTION.withoutAttachments]: 'All chats without attachments',
  [CHATS_OPTION.withAttachments]: 'All chats with attachments',
};

export const CHAT_RESTORE_OPTION_LABELS = {
  [CHATS_OPTION.none]: 'Do not restore chats',
  [CHATS_OPTION.withoutAttachments]: 'Restore all chats without attachments',
  [CHATS_OPTION.withAttachments]: 'Restore all chats with attachments',
};

export const LARGE_BACKUP_BYTES = 500 * 1024 * 1024;

// Tags of the chat list and chat views (chat/api, chat/conversation-list/api): a restore with chats
// changes everything they show, so all of them are refetched
export const CHAT_TAG_TYPES = [
  'TAG_TYPE_FOLDERS',
  'TAG_TYPE_FOLDER_DETAILS',
  'TAG_TYPE_TOTAL_FOLDERS',
  'TAG_TYPE_CONVERSATIONS',
  'TAG_TYPE_TOTAL_CONVERSATIONS',
  'TAG_TYPE_CONVERSATION_DETAILS',
  'TAG_TYPE_MESSAGES',
  'TAG_TYPE_CANVAS_DETAILS',
];

// Agents/pipelines, toolkits and skills: any real restore can rewrite their rows (a replace empties them first)
export const PROJECT_ENTITY_TAG_TYPES = [
  'TAG_TYPE_APPLICATIONS',
  'TAG_TYPE_TOTAL_APPLICATIONS',
  'TAG_TYPE_APPLICATION_DETAILS',
  'TAG_TYPE_SELECTED_APPLICATION_DETAILS',
  'TAG_TYPE_TOOLKITS',
  'TOTAL_TOOLKITS',
  'TOOLKIT_DETAILS',
  'DETAILS_TOOLKITS',
  'TAG_TYPE_SKILLS',
  'TAG_TYPE_TOTAL_SKILLS',
  'TAG_TYPE_SKILL_DETAILS',
  'TAG_TYPE_APPLICATION_SKILLS',
];
