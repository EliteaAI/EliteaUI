import { ATTACHMENT_LIMITS } from '@/common/constants';
import { isFileObjectImage } from '@/utils/attachmentImageUtils';
// Import validation utilities for file type checking
import { isFileTypeAllowed } from '@/utils/fileTypeUtils';

/**
 * Format file size for human-readable display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size string
 */
export const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Calculate total size of attachments
 * @param {Array} attachments - Array of attachment objects
 * @returns {number} Total size in bytes
 */
export const calculateTotalAttachmentSize = attachments => {
  return attachments.reduce((total, attachment) => {
    return total + (attachment.size || 0);
  }, 0);
};

/**
 * Check if attachment count is at maximum capacity
 * @param {Array} attachments - Array of existing attachments
 * @param {Object} limits - Attachment limits (defaults to ATTACHMENT_LIMITS)
 * @returns {boolean} True if at maximum capacity
 */
export const isAtMaxAttachmentCapacity = (attachments, limits = ATTACHMENT_LIMITS) => {
  return attachments.length >= limits.MAX_ATTACHMENTS;
};

/**
 * Generate appendix for duplicate files using datetime + file size in KB
 * @param {number} fileSize - File size in bytes
 * @returns {string} Datetime string + file size in KB (e.g., "20251106_143022_1.50KB")
 */
export const generateRandomAppendix = fileSize => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Convert bytes to KB with 2 decimal places
  const fileSizeKB = (fileSize / 1024).toFixed(2);

  return `${year}${month}${day}_${hours}${minutes}${seconds}_${fileSizeKB}KB`;
};

/**
 * Rename file by adding random appendix before extension
 * @param {File} file - Original file
 * @param {string} appendix - Random appendix to add
 * @returns {File} New file with renamed name
 */
export const renameFile = (file, appendix) => {
  const fileName = file.name;
  const lastDotIndex = fileName.lastIndexOf('.');

  let newName;
  if (lastDotIndex === -1) {
    // No extension
    newName = `${fileName}_${appendix}`;
  } else {
    // Has extension
    const nameWithoutExt = fileName.substring(0, lastDotIndex);
    const extension = fileName.substring(lastDotIndex);
    newName = `${nameWithoutExt}_${appendix}${extension}`;
  }

  // Create new File object with the new name
  return new File([file], newName, { type: file.type, lastModified: file.lastModified });
};

/**
 * Create file identifier for duplicate detection (name only)
 * @param {File} file - File object
 * @returns {string} File name as identifier
 */
export const createFileIdentifier = file => {
  return file.name;
};

/**
 * Create set of attached file names for quick lookup
 * @param {Array} attachments - Array of existing attachments
 * @returns {Set} Set of file names
 */
export const createAttachedFileIdentifiers = attachments => {
  const identifiers = new Set();
  attachments.forEach(attachment => {
    const identifier = createFileIdentifier(attachment);
    identifiers.add(identifier);
  });
  return identifiers;
};

/**
 * Check if file name is already attached
 * @param {File} file - File to check
 * @param {Array} attachments - Array of existing attachments
 * @returns {boolean} True if file name is already attached
 */
export const isFileAlreadyAttached = (file, attachments) => {
  const fileIdentifier = createFileIdentifier(file);
  const attachedIdentifiers = createAttachedFileIdentifiers(attachments);
  return attachedIdentifiers.has(fileIdentifier);
};

/**
 * Validate if file type is allowed
 * @param {File} file - File to validate
 * @param {Object} allowedFileTypes - Allowed MIME types object
 * @param {Array} allowedExtensions - Array of allowed extensions
 * @returns {boolean} True if valid file type
 */
export const isValidFileType = (file, allowedFileTypes = {}, allowedExtensions = []) => {
  // Ensure allowedExtensions is an array
  const extensions = Array.isArray(allowedExtensions) ? allowedExtensions : [];

  // Check MIME type first
  if (file.type && isFileTypeAllowed(file.type, allowedFileTypes)) {
    return true;
  }

  // Fallback to extension check if MIME type is not reliable
  const fileName = file.name.toLowerCase();
  return extensions.some(ext => fileName.toLowerCase().endsWith(ext.toLowerCase()));
};

/**
 * Get file type display name for error messages
 * @param {File} file - File object
 * @param {Object} allowedFileTypes - Allowed MIME types object
 * @param {Array} allowedExtensions - Array of allowed extensions
 * @returns {string} Display name for file type
 */
export const getFileTypeDisplayName = (file, allowedFileTypes = {}, allowedExtensions = []) => {
  if (file.type && isFileTypeAllowed(file.type, allowedFileTypes)) {
    return file.type.split('/').pop().toUpperCase();
  }

  const fileName = file.name.toLowerCase();
  const extension = allowedExtensions.find(ext => fileName.endsWith(ext.toLowerCase()));
  return extension ? extension.replace('.', '').toUpperCase() : 'Unknown';
};

/**
 * Check if a file is a non-SVG image (subject to image size limits)
 * @param {File} file - File to check
 * @returns {boolean} True if file is an image and not SVG
 */
const isNonSvgImage = file => {
  if (!isFileObjectImage(file)) return false;
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.svg')) return false;
  if (file.type === 'image/svg+xml') return false;
  return true;
};

/**
 * Comprehensive file validation for attachments
 * @param {FileList|Array} files - Files to validate
 * @param {Array} existingAttachments - Array of existing attachments
 * @param {number} maxFileSize - Maximum allowed file size per file
 * @param {Object} allowedFileTypes - Allowed MIME types object
 * @param {Array} allowedExtensions - Array of allowed extensions
 * @param {Object} limits - Attachment limits from useChatConfig (defaults to ATTACHMENT_LIMITS)
 * @returns {Object} Validation result with valid files and errors
 */
export const validateAttachmentFiles = (
  files,
  existingAttachments = [],
  maxFileSize = ATTACHMENT_LIMITS.DEFAULT_MAX_FILE_SIZE,
  allowedFileTypes = {},
  allowedExtensions = [],
  limits = ATTACHMENT_LIMITS,
) => {
  // Ensure parameters are properly initialized
  const safeAllowedFileTypes = allowedFileTypes || {};
  const safeAllowedExtensions = Array.isArray(allowedExtensions) ? allowedExtensions : [];

  const fileArray = Array.from(files);
  const validFiles = [];
  const errors = [];
  const duplicateFiles = [];
  const invalidTypeFiles = [];
  const oversizedImageFiles = [];
  const currentTotalSize = calculateTotalAttachmentSize(existingAttachments);
  const currentAttachmentCount = existingAttachments.length;
  let exceedsAttachmentLimit = false;
  let exceedsImageLimit = false;

  // Check attachment count limit
  if (currentAttachmentCount + fileArray.length > limits.MAX_ATTACHMENTS) {
    const allowedCount = limits.MAX_ATTACHMENTS - currentAttachmentCount;
    exceedsAttachmentLimit = true;

    // Only process files that fit within the limit
    fileArray.splice(allowedCount);

    if (fileArray.length === 0) {
      return {
        validFiles: [],
        errors,
        duplicateFiles,
        invalidTypeFiles,
        oversizedImageFiles,
        hasDuplicates: false,
        hasInvalidTypes: false,
        exceedsAttachmentLimit,
        exceedsTotalSizeLimit: false,
        exceedsImageLimit: false,
      };
    }
  }

  // Check image attachment count limit
  const existingImageCount = existingAttachments.filter(att => isNonSvgImage(att)).length;
  const newImageCount = fileArray.filter(f => isNonSvgImage(f)).length;
  let rejectNewImages = false;
  if (existingImageCount + newImageCount > limits.MAX_IMAGE_ATTACHMENTS) {
    exceedsImageLimit = true;
    rejectNewImages = true;
    errors.push(
      `Image attachments would exceed the limit of ${limits.MAX_IMAGE_ATTACHMENTS}. You already have ${existingImageCount} image(s).`,
    );
  }

  // Calculate projected total size
  const newFilesTotalSize = fileArray.reduce((total, file) => total + file.size, 0);
  const projectedTotalSize = currentTotalSize + newFilesTotalSize;

  // Check total size limit
  if (projectedTotalSize > limits.MAX_TOTAL_SIZE) {
    const remainingSize = limits.MAX_TOTAL_SIZE - currentTotalSize;
    errors.push(
      `Cannot add files. Total size would be ${formatFileSize(projectedTotalSize)}, exceeding the ${formatFileSize(limits.MAX_TOTAL_SIZE)} limit. You have ${formatFileSize(remainingSize)} remaining.`,
    );

    return {
      validFiles: [],
      errors,
      duplicateFiles,
      invalidTypeFiles,
      oversizedImageFiles,
      hasDuplicates: false,
      hasInvalidTypes: false,
      exceedsAttachmentLimit: false,
      exceedsTotalSizeLimit: true,
      exceedsImageLimit,
    };
  }

  // Track all file names (existing + newly added) to detect duplicates within the batch
  const allFileNames = new Set(existingAttachments.map(att => att.name));

  // Validate each file
  fileArray.forEach(file => {
    let processedFile = file;

    // Check file type
    if (!isValidFileType(processedFile, safeAllowedFileTypes, safeAllowedExtensions)) {
      // Get file extension for simple error message
      const fileName = processedFile.name || '';
      const lastDotIndex = fileName.lastIndexOf('.');
      const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : fileName;

      invalidTypeFiles.push(`${processedFile.name} (${extension})`);
      errors.push(`Invalid file types detected: ${extension}`);
      return;
    }

    // Check for duplicates and rename if necessary
    if (allFileNames.has(processedFile.name)) {
      const originalName = processedFile.name;
      let attempts = 0;
      const maxAttempts = 10;

      // Keep generating new names until we find one that's not a duplicate
      while (allFileNames.has(processedFile.name) && attempts < maxAttempts) {
        const appendix = generateRandomAppendix(file.size);
        processedFile = renameFile(file, appendix);
        attempts++;
      }

      if (allFileNames.has(processedFile.name)) {
        // Extremely unlikely, but handle the edge case
        errors.push(`Could not generate unique name for "${originalName}"`);
        return;
      }

      duplicateFiles.push(originalName);
    }

    // Add the file name to the set to prevent duplicates within this batch
    allFileNames.add(processedFile.name);

    // Check per-image size limit (non-SVG images)
    if (isNonSvgImage(processedFile)) {
      // Reject all new images when the image count limit would be exceeded
      if (rejectNewImages) {
        return;
      }
      if (processedFile.size > limits.MAX_IMAGE_FILE_SIZE) {
        oversizedImageFiles.push(processedFile.name);
        errors.push(
          `Image "${processedFile.name}" (${formatFileSize(processedFile.size)}) exceeds the ${formatFileSize(limits.MAX_IMAGE_FILE_SIZE)} image size limit`,
        );
        return;
      }
    }

    // Check individual file size
    if (processedFile.size > maxFileSize) {
      errors.push(`File "${processedFile.name}" exceeds maximum size of ${formatFileSize(maxFileSize)}`);
      return;
    }

    // Check if file is empty
    if (processedFile.size === 0) {
      errors.push(`File "${processedFile.name}" is empty`);
      return;
    }

    validFiles.push(processedFile);
  });

  return {
    validFiles,
    errors,
    duplicateFiles,
    invalidTypeFiles,
    oversizedImageFiles,
    hasDuplicates: duplicateFiles.length > 0,
    hasInvalidTypes: invalidTypeFiles.length > 0,
    hasOversizedImages: oversizedImageFiles.length > 0,
    exceedsAttachmentLimit,
    exceedsTotalSizeLimit: false,
    exceedsImageLimit,
  };
};

/**
 * Get remaining attachment capacity information
 * @param {Array} attachments - Array of existing attachments
 * @param {Object} limits - Attachment limits (defaults to ATTACHMENT_LIMITS)
 * @returns {Object} Remaining capacity information
 */
export const getRemainingAttachmentCapacity = (attachments, limits = ATTACHMENT_LIMITS) => {
  const remainingAttachments = limits.MAX_ATTACHMENTS - attachments.length;
  const remainingSize = limits.MAX_TOTAL_SIZE - calculateTotalAttachmentSize(attachments);
  const isAtMaxCapacity = isAtMaxAttachmentCapacity(attachments, limits);

  return {
    remainingAttachments,
    remainingSize,
    isAtMaxCapacity,
    isAtMaxSize: remainingSize <= 0,
  };
};

/**
 * Generate user-friendly tooltip message for attachment button
 * @param {Array} attachments - Array of existing attachments
 * @param {Object} limits - Attachment limits (defaults to ATTACHMENT_LIMITS)
 * @returns {string} Tooltip message
 */
export const getAttachmentTooltipMessage = (attachments, limits = ATTACHMENT_LIMITS) => {
  const { remainingAttachments, remainingSize, isAtMaxCapacity } = getRemainingAttachmentCapacity(
    attachments,
    limits,
  );

  if (isAtMaxCapacity) {
    return `Maximum ${limits.MAX_ATTACHMENTS} attachments reached`;
  }

  if (remainingSize <= 0) {
    return `Total size limit of ${formatFileSize(limits.MAX_TOTAL_SIZE)} reached`;
  }

  return `${remainingAttachments} attachment${remainingAttachments !== 1 ? 's' : ''} remaining, ${formatFileSize(remainingSize)} space left`;
};
