import {
  IMPORT_ACCEPTED_EXTENSIONS,
  IMPORT_PARTICIPANT_MESSAGES,
  IMPORT_PARTICIPANT_STATUSES,
} from '@/[fsd]/features/chat/conversation-list/lib/constants';

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

export const isParticipantLinkable = participant =>
  participant.status !== IMPORT_PARTICIPANT_STATUSES.notFound;

export const getParticipantStatusText = (participant, participants = []) => {
  if (!isParticipantLinkable(participant)) return IMPORT_PARTICIPANT_MESSAGES.notFound;
  if (participant.status === IMPORT_PARTICIPANT_STATUSES.nameOnly)
    return IMPORT_PARTICIPANT_MESSAGES.nameOnly;
  const sharedWith = participants.find(item => item.id === participant.same_as);
  if (sharedWith) return IMPORT_PARTICIPANT_MESSAGES.sameAs(sharedWith.name);
  if (participant.target_name && participant.target_name !== participant.name)
    return IMPORT_PARTICIPANT_MESSAGES.renamed(participant.target_name);
  return '';
};
