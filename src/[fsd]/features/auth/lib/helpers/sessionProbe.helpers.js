import { SessionConstants } from '@/[fsd]/features/auth/lib/constants';
import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants.js';

const { SESSION_STATUS } = SessionConstants;

const SESSION_PROBE_PATH = '/social/author/';

const buildProbeUrl = () => `${(VITE_SERVER_URL || '').replace(/\/$/, '')}${SESSION_PROBE_PATH}`;

/**
 * Check whether the current session is still valid, without following the login redirect.
 *
 * An expired session makes forward-auth redirect to the login page. With `redirect: 'manual'`
 * that shows up as an opaque redirect, and no popup is opened here: popups opened outside a
 * user gesture get blocked, and the popup fallback reloads the page.
 *
 * Network failures resolve to `unknown` so a flaky connection is not reported as an expired session.
 */
export const probeSession = async () => {
  const headers = {};
  if (DEV && VITE_DEV_TOKEN) headers.Authorization = `Bearer ${VITE_DEV_TOKEN}`;

  try {
    const response = await fetch(buildProbeUrl(), {
      method: 'GET',
      credentials: 'same-origin',
      redirect: 'manual',
      cache: 'no-store',
      headers,
    });

    if (response.type === 'opaqueredirect' || response.status === 401) {
      return SESSION_STATUS.expired;
    }
    return response.ok ? SESSION_STATUS.alive : SESSION_STATUS.unknown;
  } catch {
    return SESSION_STATUS.unknown;
  }
};
