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
