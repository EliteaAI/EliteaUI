import { ChatParticipantType } from '@/common/constants';
import { downloadFile } from '@/common/utils';

// Helper function to find content item by type in the content list
const findContentByType = (content, type) => {
  if (!content) return null;

  // Handle list format (new)
  if (Array.isArray(content)) {
    return content.find(item => item.type === type);
  }

  // Handle dict format (legacy)
  if (content.type === type) {
    return content;
  }

  return null;
};

// Utility functions for attachment handling
export const getImageSource = attachment => {
  // Handle new attachment structure with item_details
  if (attachment.item_details?.content) {
    const imageContent = findContentByType(attachment.item_details.content, 'image_url');
    const url = imageContent?.image_url?.url;
    // Skip unresolved filepath: URLs — they are internal references resolved
    // by the indexer at predict time and replaced with data: thumbnail URLs.
    if (url && !url.startsWith('filepath:')) {
      return url;
    }
  }

  // Fallback for File object (existing functionality)
  if (attachment instanceof File) {
    return URL.createObjectURL(attachment);
  }

  // Fallback for direct URL
  if (typeof attachment === 'string') {
    return attachment;
  }

  return null;
};

/** Checks if an attachment has a filepath: URL pending resolution by the indexer. */
export const hasUnresolvedFilepath = attachment => {
  if (!attachment?.item_details?.content) return false;
  const imageContent = findContentByType(attachment.item_details.content, 'image_url');
  const url = imageContent?.image_url?.url;
  return typeof url === 'string' && url.startsWith('filepath:');
};

export const getAttachmentName = attachment => {
  if (attachment.item_details?.name) return attachment.item_details.name;

  if (attachment.name) return attachment.name;

  if (attachment.item_details.filepath) return attachment.item_details.filepath.split('/').pop();

  return 'attachment';
};

export const getFileSize = attachment => {
  if (attachment.item_details?.file_size) {
    const sizeInKB = (attachment.item_details.file_size / 1024).toFixed(1);
    return `${sizeInKB} KB`;
  }

  if (attachment.size) {
    const sizeInKB = (attachment.size / 1024).toFixed(1);
    return `${sizeInKB} KB`;
  }

  return null;
};

// Get file content for download (for non-image attachments)
export const getFileContent = attachment => {
  // Handle new attachment structure with base64 content
  if (attachment.item_details?.content) {
    const textContent = findContentByType(attachment.item_details.content, 'text');
    if (textContent?.text) {
      return textContent.text;
    }

    // Legacy dict format fallback
    if (attachment.item_details.content?.file_data) {
      return attachment.item_details.content.file_data;
    }
  }

  // Handle File object
  if (attachment instanceof File) {
    return attachment;
  }

  return null;
};

// Core download logic - DRY implementation
const createBlobFromBase64 = (base64Data, defaultMimeType = 'application/octet-stream') => {
  const byteCharacters = window.atob(base64Data.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const mimeType = base64Data.split(';')[0].split(':')[1] || defaultMimeType;

  return new Blob([byteArray], { type: mimeType });
};

const downloadFromUrl = (url, fileName, toastError) => {
  downloadFile({
    url,
    filename: fileName,
    handleError: err => {
      toastError(`Download error: ${err.message}`);
    },
  });

  // Clean up the object URL if it was created locally
  if (url.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
};

const downloadFromBase64 = (
  base64Data,
  fileName,
  toastError,
  defaultMimeType = 'application/octet-stream',
) => {
  try {
    const blob = createBlobFromBase64(base64Data, defaultMimeType);
    const url = URL.createObjectURL(blob);
    downloadFromUrl(url, fileName, toastError);
  } catch (error) {
    toastError(`Failed to process base64 data: ${error.message}`);
  }
};

const downloadFromFile = (file, fileName, toastError) => {
  try {
    const url = URL.createObjectURL(file);
    downloadFromUrl(url, fileName, toastError);
  } catch (error) {
    toastError(`Failed to process file: ${error.message}`);
  }
};

// Generic download function that handles all attachment types
const downloadAttachment = async (
  attachment,
  contentGetter,
  toastError,
  defaultMimeType = 'application/octet-stream',
) => {
  const fileName = getAttachmentName(attachment);
  const content = contentGetter(attachment);

  if (!content) {
    toastError('Content not available for download');
    return;
  }

  try {
    // Handle base64 data URLs
    if (typeof content === 'string' && content.startsWith('data:')) {
      downloadFromBase64(content, fileName, toastError, defaultMimeType);
    }
    // Handle File objects
    else if (content instanceof File) {
      downloadFromFile(content, fileName, toastError);
    }
    // Handle regular URLs
    else if (typeof content === 'string') {
      downloadFromUrl(content, fileName, toastError);
    } else {
      toastError('Unsupported content format for download');
    }
  } catch (error) {
    toastError(`Download failed: ${error.message}`);
  }
};

// Specialized download functions using the generic implementation
export const downloadAttachmentImage = async (attachment, toastError) => {
  await downloadAttachment(
    attachment,
    getImageSource,
    toastError,
    'image/jpeg', // Default MIME type for images
  );
};

export const downloadAttachmentFile = async (attachment, toastError) => {
  await downloadAttachment(
    attachment,
    getFileContent,
    toastError,
    'application/octet-stream', // Default MIME type for files
  );
};

// Utility function for getting attachment type
export const getAttachmentType = attachment => {
  if (attachment.item_details?.attachment_type) {
    return attachment.item_details.attachment_type;
  }

  if (attachment.type) {
    return attachment.type.startsWith('image/') ? 'image' : 'file';
  }

  // Fallback to filename extension detection
  const fileName = getAttachmentName(attachment);
  const extension = fileName.split('.').pop()?.toLowerCase();

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageExtensions.includes(extension) ? 'image' : 'file';
};

// Utility function for validation
export const isValidAttachment = attachment => {
  // Check if attachment has required structure
  if (!attachment) return false;

  // New format validation
  if (attachment.item_details) {
    const hasName = !!attachment.item_details.name;
    const content = attachment.item_details.content;

    if (!hasName) return false;

    // Handle list format (new)
    if (Array.isArray(content)) {
      const hasImageUrl = content.some(item => item.type === 'image_url' && item.image_url?.url);
      const hasTextContent = content.some(item => item.type === 'text' && item.text);
      return hasImageUrl || hasTextContent;
    }

    // Handle dict format (legacy)
    return !!(content?.image_url?.url || content?.file_data);
  }

  // File object validation
  if (attachment instanceof File) {
    return true;
  }

  // Legacy format validation
  return !!(attachment.name || typeof attachment === 'string');
};

/**
 * Utility function to determine if attachments should be disabled
 * Follows Single Responsibility Principle - handles only attachment eligibility logic
 *
 * Logic matches backend generate_toolkit_payload():
 * - LLM/dummy chats: always enabled (is_llm_chat=True)
 * - Agent chats: enabled if 'attachments' in version_details.meta.internal_tools
 */
export const getAttachmentDisabledStatus = (participant, participantDetails) => {
  const isAppOrPipeline =
    participant?.entity_name === ChatParticipantType.Applications ||
    participant?.entity_name === ChatParticipantType.Pipelines;

  // For LLM/dummy participants, attachments are always enabled
  if (!isAppOrPipeline) {
    return false;
  }

  // For agent/pipeline participants, check if 'attachments' is in internal_tools
  const internalTools = participantDetails?.version_details?.meta?.internal_tools || [];
  return !internalTools.includes('attachments');
};

/**
 * Utility function to extract attachment manager ID
 * Follows Single Responsibility Principle - handles only manager ID extraction
 */
export const getAttachmentManagerId = (conversation, participants = []) => {
  if (!conversation?.attachment_participant_id) {
    return '';
  }

  const manager = participants.find(participant => participant.id === conversation.attachment_participant_id);

  return manager?.entity_meta?.id || '';
};

/**
 * Utility function to create attachment manager data structure
 * Follows Single Responsibility Principle - handles only data structure creation
 */
export const createAttachmentManagerData = toolkit => {
  return {
    id: toolkit.id,
    type: toolkit.type || 'custom',
    name: toolkit.name || toolkit.toolkit_name || toolkit.type || 'New Toolkit',
    description: toolkit.description || '',
    settings: toolkit.settings || {},
    toolkit_name: toolkit.toolkit_name || toolkit.name || 'New Toolkit',
  };
};
