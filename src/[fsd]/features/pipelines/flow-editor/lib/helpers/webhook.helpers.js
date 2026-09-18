import { GITLAB_SIGNING_KEY_MIN_BYTES, GITLAB_SIGNING_TOKEN_PREFIX } from '../constants/webhook.constants';

/**
 * Check a pasted GitLab signing token. The backend is authoritative; this only catches the
 * two mistakes that are easy to make by hand — pasting the wrong value, or pasting a
 * truncated one.
 *
 * @returns {string|null} error message, or null when the token looks usable
 */
export const getGitlabSigningTokenError = value => {
  const token = (value || '').trim();
  if (!token) return 'Signing token is required';

  if (!token.startsWith(GITLAB_SIGNING_TOKEN_PREFIX)) {
    return `Signing token must start with "${GITLAB_SIGNING_TOKEN_PREFIX}"`;
  }

  const encoded = token.slice(GITLAB_SIGNING_TOKEN_PREFIX.length);
  if (!encoded) return 'Signing token is missing its key';

  let decoded;
  try {
    decoded = atob(encoded);
  } catch {
    return 'Signing token is not valid base64 — check that the whole value was pasted';
  }

  // A short-but-decodable key is what a partial paste looks like: it saves cleanly and then fails
  // every signature check, which is much harder to diagnose than a rejected paste. The bound is a
  // floor rather than GitLab's exact key size, so a longer key than we expect still goes through.
  if (decoded.length < GITLAB_SIGNING_KEY_MIN_BYTES) {
    return 'Signing token looks truncated — check that the whole value was pasted';
  }

  return null;
};
