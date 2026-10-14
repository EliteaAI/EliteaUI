import { useCallback, useEffect, useRef } from 'react';

import { useDispatch } from 'react-redux';

import { SessionConstants } from '@/[fsd]/features/auth/lib/constants';
import { AuthPopupHelpers, SessionProbeHelpers } from '@/[fsd]/features/auth/lib/helpers';
import { actions as settingsActions } from '@/slices/settings.js';

const VISIBILITY_PROBE_THROTTLE_MS = 60 * 1000;

/**
 * Keeps the socket bound to a valid session.
 *
 * The server authenticates a socket once, at handshake, using the cookie it carried. A socket that
 * auto-reconnects with an expired cookie is treated as anonymous and its chat events are dropped
 * without a reply. This hook:
 * - checks the session after every automatic reconnect, and when the tab comes back or goes online,
 *   flagging `sessionExpired` so the next send re-authenticates first;
 * - re-handshakes the socket after any successful re-login, or once the session turns out to be renewed
 *   in another tab, so the server re-reads the fresh session.
 */
export const useSocketSessionGuard = socket => {
  const dispatch = useDispatch();
  const lastProbeAtRef = useRef(0);

  const sessionExpiredRef = useRef(false);

  const setSessionExpired = useCallback(
    isExpired => {
      sessionExpiredRef.current = isExpired;
      dispatch(settingsActions.setSessionExpired(isExpired));
    },
    [dispatch],
  );

  const checkSession = useCallback(async () => {
    lastProbeAtRef.current = Date.now();
    const status = await SessionProbeHelpers.probeSession();
    if (status === SessionConstants.SESSION_STATUS.expired) {
      setSessionExpired(true);
    } else if (status === SessionConstants.SESSION_STATUS.alive) {
      const wasExpired = sessionExpiredRef.current;
      setSessionExpired(false);
      // The session was renewed elsewhere (another tab), but this socket handshook while it was
      // expired and is still anonymous on the server, so it has to handshake again
      if (wasExpired) socket?.disconnect().connect();
    }
  }, [socket, setSessionExpired]);

  useEffect(() => {
    if (!socket) return;

    const handleReconnect = () => {
      checkSession();
    };

    const handleThrottledCheck = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastProbeAtRef.current < VISIBILITY_PROBE_THROTTLE_MS) return;
      checkSession();
    };

    const stopReauthListener = AuthPopupHelpers.onReauthenticated(() => {
      setSessionExpired(false);
      // A fresh handshake makes the server bind this socket to the renewed session
      socket.disconnect().connect();
    });

    socket.io.on('reconnect', handleReconnect);
    document.addEventListener('visibilitychange', handleThrottledCheck);
    window.addEventListener('online', handleThrottledCheck);

    return () => {
      stopReauthListener();
      socket.io.off('reconnect', handleReconnect);
      document.removeEventListener('visibilitychange', handleThrottledCheck);
      window.removeEventListener('online', handleThrottledCheck);
    };
  }, [socket, checkSession, setSessionExpired]);
};
