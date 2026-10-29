import { SessionConstants } from '@/[fsd]/features/auth/lib/constants';
import { sioEvents } from '@/common/constants';

import { openAuthPopup } from './authPopup.helpers';

const {
  SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_CODE,
  SESSION_GATED_EVENTS,
  SEND_RESPONSE_TIMEOUT_MS,
  SEND_RESPONSE_GIVE_UP_MS,
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

// socket.io itself treats a connected socket whose ping has expired as offline when it emits
const isSocketHealthy = socket => !!socket?.connected && !socket.io?.engine?._hasPingExpired?.();

// An emit made while the socket was not healthy waits in socket.io's send buffer and is delivered after
// the next reconnect. A send the user has been told failed must not arrive behind their back, so only
// this send's own packet is dropped (matched on the payload object it was emitted with).
const discardBufferedSend = (socket, event, payload) => {
  const buffer = socket.sendBuffer;
  if (!Array.isArray(buffer)) return;
  for (let index = buffer.length - 1; index >= 0; index -= 1) {
    const data = buffer[index]?.data;
    if (data?.[0] === event && data[1] === payload) buffer.splice(index, 1);
  }
};

/**
 * Stop waiting for a send that the server never answers.
 *
 * The server can drop a send without a reply (a handler that died, a lost frame), and the reply
 * placeholder is only cleared by an incoming frame, so it would spin forever. Any frame for the same
 * stream, including an error, proves the server saw the send and ends the wait.
 *
 * After SEND_RESPONSE_TIMEOUT_MS a socket that has lost its connection is reported at once. A healthy
 * one keeps waiting, because a slow start is not a failure and reconnecting would drop the room of a run
 * that is working. It is reported at SEND_RESPONSE_GIVE_UP_MS at the latest.
 *
 * Reporting settles the placeholder through the existing `socket_validation_error` listeners and discards
 * the send if it is still waiting in the socket's buffer. A socket that has lost its connection is also
 * re-handshaken so the next send goes out on a fresh one; a healthy socket is not touched.
 *
 * Frames are matched on `stream_id` only: a frame of another run in the same conversation also
 * stops the wait, which at worst leaves the spinner in the rare case this guards against.
 */
const watchForResponse = ({ socket, event, payload }) => {
  const streamKey = getStreamKey(payload);
  if (!socket?.onAny || !streamKey || !SESSION_GATED_EVENTS.has(event)) return;

  let timer = null;
  let isFinalCheck = false;

  // These reference each other, but only after all of them exist
  const stop = () => {
    clearTimeout(timer);
    socket.offAny(handleFrame);
  };

  const handleFrame = (_eventName, frame) => {
    if (String(frame?.stream_id) === String(streamKey)) stop();
  };

  const handleTimeout = () => {
    if (!isFinalCheck && isSocketHealthy(socket)) {
      isFinalCheck = true;
      timer = setTimeout(handleTimeout, SEND_RESPONSE_GIVE_UP_MS - SEND_RESPONSE_TIMEOUT_MS);
      return;
    }
    // A healthy socket is left alone: a new handshake changes the socket id and drops the rooms of every
    // other run using it. An anonymous socket no longer needs this, because the server now answers a send
    // it refuses and the session guard repairs the socket on that answer.
    // `active` is false after a deliberate disconnect (the app tore the socket down); never revive that
    const shouldRehandshake = socket.active !== false && !isSocketHealthy(socket);
    stop();
    discardBufferedSend(socket, event, payload);
    notifySendFailure(socket, event, payload, SEND_NO_RESPONSE_MESSAGE, SEND_NO_RESPONSE_CODE);
    if (shouldRehandshake) socket.disconnect().connect();
  };

  socket.onAny(handleFrame);
  timer = setTimeout(handleTimeout, SEND_RESPONSE_TIMEOUT_MS);
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
      notifySendFailure(socket, event, payload, SESSION_EXPIRED_MESSAGE, SESSION_EXPIRED_CODE);
    });
  return false;
};
