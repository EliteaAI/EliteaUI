/**
 * String utility functions for text formatting and manipulation
 */

/**
 * Converts a snake_case or underscore-separated string to Title Case
 * @param {string} str - The string to format (e.g., "my_tool_type")
 * @returns {string} - The formatted string (e.g., "My tool type")
 */
export const formatTitleFromSnakeCase = str => {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/^./, c => c.toUpperCase()); // Capitalize first character
};

/**
 * Formats a number with non-breaking spaces as thousand separators
 * @param {number} num - The number to format
 * @returns {string} - The formatted string (e.g., "1 359" instead of "1,359")
 */
export const formatNumberWithSpaces = num => {
  if (num == null || isNaN(num)) return '';

  return new Intl.NumberFormat('fr-FR').format(num);
};
