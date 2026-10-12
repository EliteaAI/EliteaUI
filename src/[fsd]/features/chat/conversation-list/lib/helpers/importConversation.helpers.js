import { IMPORT_ACCEPTED_EXTENSIONS } from '@/[fsd]/features/chat/conversation-list/lib/constants';

export const getConversationImportPath = (projectId, importId) =>
  `/elitea_core/conversation_import/prompt_lib/${projectId}${importId ? `/${importId}` : ''}`;

export const isImportFileSupported = fileName => {
  const lowerName = (fileName || '').toLowerCase();
  return IMPORT_ACCEPTED_EXTENSIONS.some(extension => lowerName.endsWith(extension));
};

export const getSelectableAttachments = (attachments = []) =>
  attachments.filter(attachment => attachment.available && !attachment.too_large);

export const getAttachmentsSelectionSummary = (attachments = [], selectedPaths = []) => {
  const selected = new Set(selectedPaths);
  const selectedItems = attachments.filter(attachment => selected.has(attachment.export_path));
  return {
    selectedCount: selectedItems.length,
    totalCount: attachments.length,
    selectedSize: selectedItems.reduce((sum, attachment) => sum + (attachment.size || 0), 0),
  };
};
