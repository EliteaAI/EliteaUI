import {
  GITLAB_AUTH_METHODS,
  GITLAB_SIGNING_KEY_MIN_BYTES,
  GITLAB_SIGNING_TOKEN_PREFIX,
  RECOMMENDED_SUFFIX,
  WEBHOOK_TYPES,
} from '../constants/webhook.constants.js';

// Same rule as the API's `signed`: only these requests carry a signature that stops a replay
export const isSignedWebhook = (type, gitlabAuthMethod) =>
  type === WEBHOOK_TYPES.github ||
  (type === WEBHOOK_TYPES.gitlab && gitlabAuthMethod === GITLAB_AUTH_METHODS.signing_token);

export const markRecommended = (options, recommended) =>
  options.map(option =>
    option.value === recommended ? { ...option, label: `${option.label}${RECOMMENDED_SUFFIX}` } : option,
  );

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

  // GitLab's documented format is standard base64, which never contains `-` or `_`, so this is a
  // no-op on a real token. It only stops `atob` from reporting a base64url key as unparseable.
  let decoded;
  try {
    decoded = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
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
