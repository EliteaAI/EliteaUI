import { getFileExtension } from '@/utils/fileUtils';

/**
 * Utility functions for file type validation and handling
 */

/**
 * Check if a file type is allowed based on MIME type
 * @param {string} mimeType - The MIME type to check
 * @param {Object} allowedFileTypes - Object with MIME types as keys
 * @returns {boolean} True if file type is allowed
 */
export const isFileTypeAllowed = (mimeType, allowedFileTypes) => {
  return Object.prototype.hasOwnProperty.call(allowedFileTypes, mimeType);
};

/**
 * Check if a file extension is allowed
 * @param {string} extension - The file extension to check (with or without dot)
 * @param {Array} allowedExtensions - Array of allowed extensions
 * @returns {boolean} True if extension is allowed
 */
export const isExtensionAllowed = (extension, allowedExtensions) => {
  const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`;
  return allowedExtensions.includes(normalizedExtension);
};

/**
 * Validate a file against allowed types
 * @param {File} file - The file object to validate
 * @param {Object} allowedFileTypes - Object with allowed MIME types and extensions
 * @param {Array} allowedExtensions - Array of allowed extensions
 * @returns {Object} Validation result with isValid boolean and error message
 */
export const validateFile = (file, allowedFileTypes, allowedExtensions) => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  const { type: mimeType, name: filename } = file;
  const extension = getFileExtension(filename, { withDot: true });

  // Check MIME type
  if (mimeType && isFileTypeAllowed(mimeType, allowedFileTypes)) {
    return { isValid: true };
  }

  // Fallback to extension check
  if (extension && isExtensionAllowed(extension, allowedExtensions)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: `File type not supported. Allowed types: ${Object.keys(allowedFileTypes).join(', ')}`,
  };
};

/**
 * Get MIME type from extension using allowed file types mapping
 * @param {string} extension - File extension (with or without dot)
 * @param {Object} allowedFileTypes - Object with MIME types as keys and extensions as values
 * @returns {string|null} MIME type if found, null otherwise
 */
export const getMimeTypeFromExtension = (extension, allowedFileTypes) => {
  const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`;

  for (const [mimeType, extensions] of Object.entries(allowedFileTypes)) {
    if (extensions.includes(normalizedExtension)) {
      return mimeType;
    }
  }

  return null;
};

/**
 * Filter files array to only include allowed file types
 * @param {Array} files - Array of File objects
 * @param {Object} allowedFileTypes - Object with allowed MIME types
 * @param {Array} allowedExtensions - Array of allowed extensions
 * @returns {Object} Object with valid and invalid files arrays
 */
export const filterAllowedFiles = (files, allowedFileTypes, allowedExtensions) => {
  const valid = [];
  const invalid = [];

  files.forEach(file => {
    const validation = validateFile(file, allowedFileTypes, allowedExtensions);
    if (validation.isValid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: validation.error });
    }
  });

  return { valid, invalid };
};
