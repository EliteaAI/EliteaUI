/**
 * Shared utility functions for file operations
 * Centralized to avoid code duplication across multiple utility files
 */

/**
 * Get file extension from filename with various format options
 * @param {string} filename - The filename to extract extension from
 * @param {Object} options - Configuration options
 * @param {boolean} options.withDot - Whether to include the dot (default: false)
 * @param {boolean} options.toLowerCase - Whether to convert to lowercase (default: false)
 * @returns {string} The file extension
 */
export const getFileExtension = (filename, options = {}) => {
  const { withDot = false, toLowerCase = false } = options;

  // Input validation
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  const lastDotIndex = filename.lastIndexOf('.');

  // No extension found or dot is at the end
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }

  // Extract extension based on options
  let extension;
  if (withDot) {
    extension = filename.substring(lastDotIndex);
  } else {
    extension = filename.substring(lastDotIndex + 1);
  }

  // Apply case transformation if requested
  return toLowerCase ? extension.toLowerCase() : extension;
};

/**
 * Get file extension without dot (most common use case)
 * @param {string} filename - The filename to extract extension from
 * @returns {string} The file extension without dot
 */
export const getFileExtensionWithoutDot = filename => {
  return getFileExtension(filename, { withDot: false });
};

/**
 * Get file extension in lowercase without dot (for case-insensitive comparisons)
 * @param {string} filename - The filename to extract extension from
 * @returns {string} The file extension in lowercase without dot
 */
export const getFileExtensionLowerCase = filename => {
  return getFileExtension(filename, { withDot: false, toLowerCase: true });
};
