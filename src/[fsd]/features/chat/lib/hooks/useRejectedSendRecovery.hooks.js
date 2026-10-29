import { useCallback, useRef } from 'react';

import { SessionConstants } from '@/[fsd]/features/auth/lib/constants';
import { useSocket } from '@/[fsd]/features/auth/lib/hooks';
import { sioEvents } from '@/common/constants';

const { SOCKET_UNAUTHENTICATED_CODE, SEND_NO_RESPONSE_CODE, SESSION_EXPIRED_CODE } = SessionConstants;

// What the user gets back after a failed send. Only the text is remembered: mentions, attachments
// and the chosen participant are cleared when a message is sent, and are not restored.
const RECOVERABLE_CODES = new Set([SOCKET_UNAUTHENTICATED_CODE, SEND_NO_RESPONSE_CODE, SESSION_EXPIRED_CODE]);

// Failures where the message is known not to have been processed, so the user can send the text again at once
const NOT_PROCESSED_CODES = new Set([SOCKET_UNAUTHENTICATED_CODE, SESSION_EXPIRED_CODE]);

const MAX_REMEMBERED_SENDS = 10;

/**
 * Keeps a user's text when a send fails before it was answered.
 *
 * The socket is repaired after such a failure and the conversation is reloaded from the server, which
 * may never have stored the message, so the message would vanish with the failure. This tells the user
 * what happened and puts the text back in the input, unless they have already typed something new there.
 *
 * Only a send made by this instance is handled. Every mounted chat listens on the same shared socket
 * (the pipeline test panel stays mounted while closed), so a failure of another chat's send must not
 * toast again here.
 *
 * Whether it is safe to send the same text again depends on the failure:
 * - `socket_unauthenticated`: the server refused the message, so it was not processed.
 * - `session_expired`: the send waited for a new login that was abandoned, so it never left the browser.
 *   In both cases the input is focused so the user can resend straight away.
 * - `send_no_response`: nothing came back, which also happens when the server is slow or a frame was
 *   lost, so the message might still arrive. The text is restored without taking focus, and the
 *   message of the toast says so.
 */
export const useRejectedSendRecovery = props => {
  const { chatInput, toastError, activeConversationRef } = props;
  const sentQuestionsRef = useRef(new Map());

  const rememberSend = useCallback((questionId, text, conversationUuid) => {
    if (!questionId || !text) return;
    const sentQuestions = sentQuestionsRef.current;
    sentQuestions.set(questionId, { text, conversationUuid });
    if (sentQuestions.size > MAX_REMEMBERED_SENDS) sentQuestions.delete(sentQuestions.keys().next().value);
  }, []);

  const handleRejection = useCallback(
    frame => {
      if (!RECOVERABLE_CODES.has(frame?.code)) return;

      const sentQuestions = sentQuestionsRef.current;
      if (!sentQuestions.has(frame.message_id)) return;

      const { text, conversationUuid } = sentQuestions.get(frame.message_id);
      sentQuestions.delete(frame.message_id);

      // This instance did send it, so the user is told. The text goes back only when the conversation it
      // was sent to is still the one on screen: one instance and one input serve every conversation, so
      // after a switch it would land in an unrelated chat, one Enter away from being sent there.
      toastError(frame.content);

      const isSentFromActiveConversation = conversationUuid === activeConversationRef.current?.uuid;
      const input = chatInput.current;
      if (isSentFromActiveConversation && input && !input.getInputContent()) {
        input.setValue(text);
        if (NOT_PROCESSED_CODES.has(frame.code)) input.focus();
      }
    },
    [chatInput, toastError, activeConversationRef],
  );

  useSocket(sioEvents.socket_validation_error, handleRejection);

  return { rememberSend };
};
