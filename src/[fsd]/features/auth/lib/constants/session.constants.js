import { sioEvents } from '@/common/constants';

export const SESSION_STATUS = {
  alive: 'alive',
  expired: 'expired',
  unknown: 'unknown',
};

// Events that start or resume a run. The server drops them silently for a socket bound to an
// expired session, so they must not be sent before the session is renewed.
export const SESSION_GATED_EVENTS = new Set([
  sioEvents.chat_predict,
  sioEvents.chat_continue_predict,
  sioEvents.application_predict,
  sioEvents.application_continue_message,
]);

export const SESSION_EXPIRED_MESSAGE =
  'Your session has expired. Please sign in again and resend the message.';

// Sent by the server with a rejection of a send from a socket it sees as anonymous or not in the
// project, i.e. a socket whose handshake did not carry a valid session
export const SOCKET_UNAUTHENTICATED_CODE = 'socket_unauthenticated';

// Set by the client itself on the failure it raises when a send got no answer at all
export const SEND_NO_RESPONSE_CODE = 'send_no_response';

// A send that gets no frame back at all (neither a run frame nor an error) is checked after this long.
// The first frame of a run is emitted right after dispatch, before the agent initializes, but that is a
// property of the server queue, not a guarantee. So a socket that is still healthy keeps waiting, and
// only one that has lost its connection is reported at this point.
export const SEND_RESPONSE_TIMEOUT_MS = 45 * 1000;

// The latest a send may stay unanswered on a socket that looks healthy before it is reported anyway,
// so the reply placeholder cannot spin forever when a frame was lost
export const SEND_RESPONSE_GIVE_UP_MS = 3 * 60 * 1000;

export const SEND_NO_RESPONSE_MESSAGE =
  'No response from the server. Your message may still arrive; if nothing appears shortly, please resend it.';

// A tab hidden for longer than this re-handshakes its socket when it comes back, because the
// server's view of the session may have been lost while the connection was flapping
export const LONG_HIDDEN_THRESHOLD_MS = 5 * 60 * 1000;
