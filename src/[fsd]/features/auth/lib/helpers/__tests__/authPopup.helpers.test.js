// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthConstants } from '@/[fsd]/features/auth/lib/constants';

vi.mock('@/routes', () => ({ default: { AuthCallbackPage: '/auth/callback' } }));

const { handleAuthResult, onReauthenticated, openAuthPopup } = await import('../authPopup.helpers');

const completeAuth = success => {
  const state = sessionStorage.getItem(AuthConstants.AUTH_STATE_KEY);
  handleAuthResult({
    origin: window.location.origin,
    data: { type: AuthConstants.AUTH_MESSAGE_TYPE, success, state },
  });
};

describe('onReauthenticated', () => {
  let unsubscribe;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'open').mockReturnValue({ closed: false });
  });

  afterEach(() => {
    unsubscribe?.();
    vi.restoreAllMocks();
  });

  it('notifies listeners before the popup promise resolves', async () => {
    const calls = [];
    unsubscribe = onReauthenticated(() => calls.push('listener'));

    const authPromise = openAuthPopup().then(() => calls.push('resolved'));
    completeAuth(true);
    await authPromise;

    expect(calls).toEqual(['listener', 'resolved']);
  });

  it('does not notify listeners when re-authentication fails', async () => {
    const listener = vi.fn();
    unsubscribe = onReauthenticated(listener);

    const authPromise = openAuthPopup();
    completeAuth(false);

    await expect(authPromise).rejects.toThrow('Re-authentication failed');
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', async () => {
    const listener = vi.fn();
    onReauthenticated(listener)();

    const authPromise = openAuthPopup();
    completeAuth(true);
    await authPromise;

    expect(listener).not.toHaveBeenCalled();
  });
});
