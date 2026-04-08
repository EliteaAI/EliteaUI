import { DEFAULT_PARTICIPANT_NAME } from '@/common/constants';

/**
 * Converts an arbitrary string into a valid elitea title string
 * - Converts to lowercase
 * - Replaces whitespace with underscores
 * - Removes invalid characters (keeps only alphanumeric, underscores, and hyphens)
 * - Truncates to 128 characters max
 * - Ensures the result is not empty
 *
 * @param {string} input - The input string to convert
 * @param {string} fallback - Fallback string if result would be empty (default: 'untitled')
 * @returns {string} Valid elitea title string
 */
export const convertToValidEliteATitle = (input, fallback = '') => {
  if (!input || typeof input !== 'string') {
    return fallback;
  }

  // Convert to lowercase
  let result = input.toLowerCase();

  // Replace whitespace (spaces, tabs, newlines, etc.) with underscores
  result = result.replace(/\s+/g, '_');

  // Remove all characters that are not alphanumeric, underscore, or hyphen
  result = result.replace(/[^a-z0-9_-]/g, '');

  // Remove consecutive underscores and replace with single underscore
  result = result.replace(/_+/g, '_');

  // Remove leading and trailing underscores
  result = result.replace(/^_+|_+$/g, '');

  // Truncate to 128 characters
  if (result.length > 128) {
    result = result.substring(0, 128);
    // Remove trailing underscore if truncation creates one
    result = result.replace(/_+$/, '');
  }

  // If result is empty after cleaning, use fallback
  if (!result) {
    return fallback;
  }

  return result;
};

/**
 * Validates if a string meets the elitea title requirements
 * @param {string} value - The string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidEliteATitle = value => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  if (value.length > 128) {
    return false;
  }

  // Must match the regex pattern - now includes hyphens
  return /^[a-zA-Z0-9_-]+$/.test(value);
};

/**
 * Gets validation error message for elitea title
 * @param {string} value - The string to validate
 * @returns {string|null} Error message or null if valid
 */
export const getEliteATitleValidationError = (value, systemSenderName = DEFAULT_PARTICIPANT_NAME) => {
  if (!value) {
    return `${systemSenderName} title cannot be empty`;
  }

  if (value.length > 128) {
    return `${systemSenderName} title must not exceed 128 characters`;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return `${systemSenderName} title must contain only alphanumeric characters, underscores, and hyphens (no spaces or other special symbols)`;
  }

  return null;
};
