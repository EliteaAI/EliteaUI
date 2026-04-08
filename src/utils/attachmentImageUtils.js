import { getFileExtensionLowerCase } from '@/utils/fileUtils';

/**
 * Utility functions for detecting if an attachment is an image
 * Checks both MIME type and file extension for comprehensive detection
 *
 * @example
 * // Check if a File object is an image
 * const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
 * const isImage = isFileObjectImage(file); // returns true
 *
 * @example
 * // Check if an attachment object is an image
 * const attachment = { name: 'screenshot.png' };
 * const isImage = isAttachmentImage(attachment); // returns true
 *
 * @example
 * // Get attachment type for processing
 * const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
 * const type = getAttachmentType(file); // returns 'file'
 * const contentType = getAttachmentContentType(file); // returns 'file_data'
 */

/**
 * Common image MIME types
 */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/svg+xml',
  'image/tiff',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/avif',
  'image/apng',
];

/**
 * Common image file extensions (without dot)
 */
export const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'ico',
  'svg',
  'tiff',
  'tif',
  'apng',
  'avif',
];

/**
 * Check if a MIME type indicates an image
 * @param {string} mimeType - The MIME type to check
 * @returns {boolean} True if the MIME type is for an image
 */
export const isImageMimeType = mimeType => {
  if (!mimeType || typeof mimeType !== 'string') {
    return false;
  }

  return IMAGE_MIME_TYPES.includes(mimeType.toLowerCase()) || mimeType.toLowerCase().startsWith('image/');
};

/**
 * Check if a file extension indicates an image
 * @param {string} extension - The file extension (with or without dot)
 * @returns {boolean} True if the extension is for an image
 */
export const isImageExtension = extension => {
  if (!extension || typeof extension !== 'string') {
    return false;
  }

  const normalizedExtension = extension.startsWith('.')
    ? extension.substring(1).toLowerCase()
    : extension.toLowerCase();

  return IMAGE_EXTENSIONS.includes(normalizedExtension);
};

/**
 * Check if a filename indicates an image based on its extension
 * @param {string} filename - The filename to check
 * @returns {boolean} True if the filename has an image extension
 */
export const isImageFileName = filename => {
  const extension = getFileExtensionLowerCase(filename);
  return isImageExtension(extension);
};

/**
 * Check if a File object is an image
 * Checks both MIME type and filename extension for comprehensive detection
 * @param {File} file - The File object to check
 * @returns {boolean} True if the file is an image
 */
export const isFileObjectImage = file => {
  if (!file) {
    return false;
  }

  // Check MIME type first (most reliable for File objects)
  if (file.type && isImageMimeType(file.type)) {
    return true;
  }

  // Fallback to filename extension check
  if (file.name && isImageFileName(file.name)) {
    return true;
  }

  return false;
};

/**
 * Check if an attachment object is an image
 * Handles various attachment formats used in the application
 * @param {Object} attachment - The attachment object to check
 * @returns {boolean} True if the attachment is an image
 */
export const isAttachmentImage = attachment => {
  if (!attachment) {
    return false;
  }

  // Check if it's a File object
  if (attachment instanceof File) {
    return isFileObjectImage(attachment);
  }

  // Check attachment_type property (existing format)
  if (attachment.item_details?.attachment_type === 'image') {
    return true;
  }

  // Check filename in various possible locations
  const filename = attachment.name || attachment.item_details?.name;

  if (filename && isImageFileName(filename)) {
    return true;
  }

  // Check content type for URL-based attachments
  const content = attachment.item_details?.content;
  if (content) {
    // Handle list format (new)
    if (Array.isArray(content)) {
      return content.some(item => item.type === 'image_url');
    }

    // Handle dict format (legacy)
    if (content.type === 'image_url') {
      return true;
    }
  }

  return false;
};

/**
 * Get the appropriate attachment type string ('image' or 'file')
 * @param {Object|File} attachment - The attachment to check
 * @returns {string} 'image' if it's an image, 'file' otherwise
 */
export const getAttachmentType = attachment => {
  return isAttachmentImage(attachment) ? 'image' : 'document';
};

/**
 * Get the appropriate content type for an attachment
 * @param {Object|File} attachment - The attachment to check
 * @returns {string} 'image_url' if it's an image, 'file_data' otherwise
 */
export const getAttachmentContentType = attachment => {
  return isAttachmentImage(attachment) ? 'image_url' : 'text';
};
