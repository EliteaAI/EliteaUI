/**
 * Opens an external URL in a new tab safely.
 * Designed for use as a click handler on anchor elements that also need
 * to prevent default navigation (e.g. when using data-url attributes).
 *
 * @param {React.MouseEvent<HTMLAnchorElement>} event
 */
export const openExternalLink = event => {
  event.preventDefault();

  const url = event.currentTarget.href;

  if (!url) return;

  window.open(url, '_blank', 'noopener,noreferrer');
};
