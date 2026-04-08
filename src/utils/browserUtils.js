/**
 * Browser detection and utility functions
 */

/**
 * Check if the current browser is Safari
 * @returns {boolean} true if Safari, false otherwise
 */
export const isSafari = () => {
  const userAgent = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent);
};

/**
 * Check if navigator.clipboard.writeText is supported
 * @returns {boolean} true if supported, false otherwise
 */
export const isClipboardSupported = () => {
  return navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
};

/**
 * Fallback copy function for browsers with limited clipboard support
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} Promise that resolves to true if successful
 */
export const fallbackCopyToClipboard = text => {
  return new Promise((resolve, reject) => {
    try {
      const textField = document.createElement('textarea');
      textField.innerText = text;
      textField.style.position = 'fixed';
      textField.style.left = '-999999px';
      textField.style.top = '-999999px';
      document.body.appendChild(textField);
      textField.focus();
      textField.select();
      const successful = document.execCommand('copy');
      textField.remove();
      if (successful) {
        resolve(true);
      } else {
        reject(new Error('Copy command failed'));
      }
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Universal copy function that works across browsers
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} Promise that resolves to true if successful
 */
export const copyToClipboard = async text => {
  if (isClipboardSupported()) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback to manual copy if clipboard API fails
      return await fallbackCopyToClipboard(text);
    }
  } else {
    return await fallbackCopyToClipboard(text);
  }
};
