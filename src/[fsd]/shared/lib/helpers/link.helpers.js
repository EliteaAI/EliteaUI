import { SearchParams } from '@/common/constants';
import RouteDefinitions, { getBasename } from '@/routes';

const SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/;
// Some models (OpenAI-style) prefix generated file paths with a pseudo `sandbox:` scheme
const SANDBOX_SCHEME_REGEX = /^sandbox:\/*/i;

/**
 * Parses a raw artifact storage path (`/{bucket}/{file_path}` or `sandbox:/{bucket}/{file_path}`), which LLMs
 * often emit as a markdown link after creating a file via the Artifact toolkit.
 *
 * @param {string} href
 * @returns {{bucket: string, file: string} | null} `null` when the href is not an artifact path
 */
export const parseArtifactHref = href => {
  if (typeof href !== 'string') return null;

  const isSandboxLink = SANDBOX_SCHEME_REGEX.test(href);
  const normalizedHref = isSandboxLink ? href.replace(SANDBOX_SCHEME_REGEX, '/') : href;

  if (
    !normalizedHref.startsWith('/') ||
    normalizedHref.startsWith('//') ||
    SCHEME_REGEX.test(normalizedHref)
  ) {
    return null;
  }

  const basename = getBasename();
  if (
    !isSandboxLink &&
    basename &&
    (normalizedHref === basename || normalizedHref.startsWith(`${basename}/`))
  ) {
    return null;
  }

  const path = normalizedHref.split(/[?#]/)[0];
  const segments = path.substring(1).split('/');
  if (segments.length < 2 || segments.some(segment => !segment)) return null;

  try {
    const [bucket, ...fileSegments] = segments.map(segment => decodeURIComponent(segment));
    return { bucket, file: fileSegments.join('/') };
  } catch {
    return null;
  }
};

/**
 * Builds the Artifacts viewer URL for a file in the currently selected project.
 *
 * @param {{bucket: string, file: string}} artifact
 * @returns {string}
 */
export const buildArtifactViewerUrl = ({ bucket, file }) =>
  `${getBasename()}${RouteDefinitions.Artifacts}?${SearchParams.Bucket}=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file)}`;

/**
 * Converts an artifact storage path href into a navigable URL. Any other href is returned unchanged.
 *
 * @param {string} href
 * @param {(artifact: {bucket: string, file: string}) => string | null} [resolveArtifact] - maps the parsed
 *   artifact to a URL; returning `null` means the file can't be opened in the current context
 * @returns {string | null}
 */
export const resolveArtifactHref = (href, resolveArtifact = buildArtifactViewerUrl) => {
  const artifact = parseArtifactHref(href);
  return artifact ? resolveArtifact(artifact) : href;
};

/**
 * Applies {@link resolveArtifactHref} to every `<a href>` inside an HTML string. Links that resolve to `null`
 * lose their `href`.
 *
 * @param {string} html - already sanitized HTML
 * @param {(artifact: {bucket: string, file: string}) => string | null} [resolveArtifact]
 * @returns {string}
 */
export const resolveArtifactHrefsInHtml = (html, resolveArtifact) => {
  if (!html || !/<a\s/i.test(html) || typeof document === 'undefined') return html;

  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('a[href]').forEach(anchor => {
    const href = anchor.getAttribute('href');
    const resolvedHref = resolveArtifactHref(href, resolveArtifact);
    if (resolvedHref === null) anchor.removeAttribute('href');
    else if (resolvedHref !== href) anchor.setAttribute('href', resolvedHref);
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
