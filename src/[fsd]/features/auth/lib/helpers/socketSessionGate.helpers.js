import { SessionConstants } from '@/[fsd]/features/auth/lib/constants';
import { sioEvents } from '@/common/constants';

import { openAuthPopup } from './authPopup.helpers';

const {
  SESSION_EXPIRED_MESSAGE,
  SESSION_GATED_EVENTS,
  SEND_RESPONSE_TIMEOUT_MS,
  SEND_NO_RESPONSE_MESSAGE,
  SEND_NO_RESPONSE_CODE,
} = SessionConstants;

// Settle the pending reply placeholder through the regular socket_validation_error handlers,
// the same way a server-side rejection of this payload would
const notifySendFailure = (socket, event, payload, content, code) => {
  const errorFrame = {
    event,
    type: 'error',
    content,
    stream_id: payload?.conversation_uuid,
    message_id: payload?.question_id ?? payload?.message_id ?? payload?.payload?.message_id,
    ...(code ? { code } : {}),
  };
  socket?.listeners(sioEvents.socket_validation_error).forEach(listener => listener(errorFrame));
};

const getStreamKey = payload => payload?.conversation_uuid ?? payload?.stream_id ?? payload?.message_id;

/**
 * Give up waiting for a send that the server never answers.
 *
 * The server can drop a send without a reply (a socket it holds as anonymous, a handler that died),
 * and the reply placeholder is only cleared by an incoming frame, so it would spin forever. Any frame
 * for the same stream, including an error, proves the server saw the send and stops the wait. When
 * none arrives in time, the placeholder is settled with a message and the socket is re-handshaken,
 * so the next send goes out on a connection the server binds to the current session again.
 *
 * Frames are matched on `stream_id` only: a frame of another run in the same conversation also
 * stops the wait, which at worst leaves the spinner in the rare case this guards against.
 */
const watchForResponse = ({ socket, event, payload }) => {
  const streamKey = getStreamKey(payload);
  if (!socket?.onAny || !streamKey || !SESSION_GATED_EVENTS.has(event)) return;

  let timer = null;

  // Both are only called after the other one exists, so the mutual reference is safe
  const stop = () => {
    clearTimeout(timer);
    socket.offAny(handleFrame);
  };

  const handleFrame = (_eventName, frame) => {
    if (String(frame?.stream_id) === String(streamKey)) stop();
  };

  socket.onAny(handleFrame);
  timer = setTimeout(() => {
    stop();
    notifySendFailure(socket, event, payload, SEND_NO_RESPONSE_MESSAGE, SEND_NO_RESPONSE_CODE);
    // `active` is false after a deliberate disconnect (the app tore the socket down); never revive that
    if (socket.active !== false) socket.disconnect().connect();
  }, SEND_RESPONSE_TIMEOUT_MS);
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
    watchForResponse({ socket, event, payload });
    return !!socket?.emit(event, payload);
  }

  openAuthPopup()
    .then(() => {
      watchForResponse({ socket, event, payload });
      socket?.emit(event, payload);
    })
    .catch(() => {
      notifySendFailure(socket, event, payload, SESSION_EXPIRED_MESSAGE);
    });
  return false;
};
