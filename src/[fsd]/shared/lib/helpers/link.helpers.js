import { SearchParams } from '@/common/constants';
import RouteDefinitions, { getBasename } from '@/routes';

const SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/;
// Some models (OpenAI-style) prefix generated file paths with a pseudo `sandbox:` scheme
const SANDBOX_SCHEME_REGEX = /^sandbox:\/*/i;

/**
 * Converts a raw artifact storage path (`/{bucket}/{file_path}` or `sandbox:/{bucket}/{file_path}`), which LLMs
 * often emit as a markdown link after creating a file via the Artifact toolkit, into the Artifacts viewer URL.
 * Any other href is returned unchanged.
 *
 * @param {string} href
 * @returns {string}
 */
export const resolveArtifactHref = href => {
  if (typeof href !== 'string') return href;

  const isSandboxLink = SANDBOX_SCHEME_REGEX.test(href);
  const normalizedHref = isSandboxLink ? href.replace(SANDBOX_SCHEME_REGEX, '/') : href;

  if (
    !normalizedHref.startsWith('/') ||
    normalizedHref.startsWith('//') ||
    SCHEME_REGEX.test(normalizedHref)
  ) {
    return href;
  }

  const basename = getBasename();
  if (
    !isSandboxLink &&
    basename &&
    (normalizedHref === basename || normalizedHref.startsWith(`${basename}/`))
  ) {
    return href;
  }

  const path = normalizedHref.split(/[?#]/)[0];
  const segments = path.substring(1).split('/');
  if (segments.length < 2 || segments.some(segment => !segment)) return href;

  try {
    const [bucket, ...fileSegments] = segments.map(segment => decodeURIComponent(segment));
    const file = fileSegments.join('/');
    return `${basename}${RouteDefinitions.Artifacts}?${SearchParams.Bucket}=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file)}`;
  } catch {
    return href;
  }
};

/**
 * Applies {@link resolveArtifactHref} to every `<a href>` inside an HTML string.
 *
 * @param {string} html - already sanitized HTML
 * @returns {string}
 */
export const resolveArtifactHrefsInHtml = html => {
  if (!html || !/<a\s/i.test(html) || typeof document === 'undefined') return html;

  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('a[href]').forEach(anchor => {
    const href = anchor.getAttribute('href');
    const resolvedHref = resolveArtifactHref(href);
    if (resolvedHref !== href) anchor.setAttribute('href', resolvedHref);
  });
  return template.innerHTML;
};

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
