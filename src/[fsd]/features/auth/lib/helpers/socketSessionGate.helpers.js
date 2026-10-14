import { SessionConstants } from '@/[fsd]/features/auth/lib/constants';
import { sioEvents } from '@/common/constants';

import { openAuthPopup } from './authPopup.helpers';

const { SESSION_EXPIRED_MESSAGE, SESSION_GATED_EVENTS } = SessionConstants;

// Settle the pending reply placeholder through the regular socket_validation_error handlers,
// the same way a server-side rejection of this payload would
const notifySessionExpired = (socket, event, payload) => {
  const errorFrame = {
    event,
    type: 'error',
    content: SESSION_EXPIRED_MESSAGE,
    stream_id: payload?.conversation_uuid,
    message_id: payload?.question_id ?? payload?.message_id ?? payload?.payload?.message_id,
  };
  socket?.listeners(sioEvents.socket_validation_error).forEach(listener => listener(errorFrame));
};

/**
 * Emit a socket event, re-authenticating first when the session is known to be expired.
 *
 * Must be called synchronously from the send handler, so the popup counts as a user gesture.
 * After a successful re-login the socket session guard re-handshakes the socket; the emit is
 * buffered by socket.io until the new, authenticated connection is up.
 *
 * Returns whether the event was emitted right away; `false` while the emit waits for re-login.
 * When login is abandoned, the socket_validation_error listeners registered at that moment are called;
 * a listener whose component unmounted in the meantime only performs a no-op state update.
 */
export const emitWithSessionGate = ({ socket, event, payload, isSessionExpired }) => {
  if (!isSessionExpired || !SESSION_GATED_EVENTS.has(event)) {
    return !!socket?.emit(event, payload);
  }

  openAuthPopup()
    .then(() => {
      socket?.emit(event, payload);
    })
    .catch(() => {
      notifySessionExpired(socket, event, payload);
    });
  return false;
};
