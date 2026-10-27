import { useCallback, useRef } from 'react';

import { SessionConstants } from '@/[fsd]/features/auth/lib/constants';
import { useSocket } from '@/[fsd]/features/auth/lib/hooks';
import { sioEvents } from '@/common/constants';

const { SOCKET_UNAUTHENTICATED_CODE, SEND_NO_RESPONSE_CODE } = SessionConstants;

// Failures where the message never reached a run, so sending the same text again is safe
const RECOVERABLE_CODES = new Set([SOCKET_UNAUTHENTICATED_CODE, SEND_NO_RESPONSE_CODE]);

const MAX_REMEMBERED_SENDS = 10;

/**
 * Keeps a user's text when a send fails before any run started.
 *
 * The socket is repaired after such a failure and the conversation is reloaded from the server, which
 * has never stored the message, so the message would vanish with the failure. This tells the user what
 * happened and puts the text back in the input, unless they have already typed something new there.
 */
export const useRejectedSendRecovery = props => {
  const { chatInput, toastError } = props;
  const sentQuestionsRef = useRef(new Map());

  const rememberSend = useCallback((questionId, text) => {
    if (!questionId || !text) return;
    const sentQuestions = sentQuestionsRef.current;
    sentQuestions.set(questionId, text);
    if (sentQuestions.size > MAX_REMEMBERED_SENDS) sentQuestions.delete(sentQuestions.keys().next().value);
  }, []);

  const handleRejection = useCallback(
    frame => {
      if (!RECOVERABLE_CODES.has(frame?.code)) return;

      const text = sentQuestionsRef.current.get(frame.message_id);
      sentQuestionsRef.current.delete(frame.message_id);

      toastError(frame.content);

      const input = chatInput.current;
      if (text && input && !input.getInputContent()) {
        input.setValue(text);
        input.focus();
      }
    },
    [chatInput, toastError],
  );

  useSocket(sioEvents.socket_validation_error, handleRejection);

  return { rememberSend };
};
