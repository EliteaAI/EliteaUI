import { ROLES } from '@/common/constants';
import { convertJsonToString } from '@/common/utils';

const toExceptionText = error => convertJsonToString(error) || 'Failed to send the message.';

const isReplyTo = (message, questionId) =>
  message.role !== ROLES.User &&
  (message.question_id === questionId ||
    message.replyTo?.uuid === questionId ||
    message.replyTo?.id === questionId);

/**
 * Puts send failures kept while the user was away on their replies, adding the reply (and the question,
 * if the server never stored it) when missing.
 *
 * @param {Array<object>} chatHistory
 * @param {Record<string, {questionId: string, error: unknown, userMessage?: object}>} failures
 * @returns {{ chatHistory: Array<object>, appliedQuestionIds: string[] }}
 */
export const applySendFailures = (chatHistory = [], failures = {}) => {
  const entries = Object.values(failures || {});
  if (!entries.length) return { chatHistory, appliedQuestionIds: [] };

  let history = [...chatHistory];
  const appliedQuestionIds = [];

  entries.forEach(({ questionId, error, userMessage }) => {
    if (!questionId) return;
    const exception = toExceptionText(error);
    const errored = {
      exception,
      isLoading: false,
      isStreaming: false,
      isRegenerating: false,
      isSending: false,
      task_id: undefined,
    };

    const questionIndex = history.findIndex(m => m.role === ROLES.User && m.id === questionId);
    const replyIndex = history.findIndex(m => isReplyTo(m, questionId));

    if (replyIndex !== -1) {
      history[replyIndex] = { ...history[replyIndex], ...errored };
    } else if (questionIndex !== -1) {
      const question = history[questionIndex];
      history.splice(questionIndex + 1, 0, {
        id: `${questionId}-send-failure`,
        role: ROLES.Assistant,
        question_id: questionId,
        replyTo: question,
        participant_id: question.participant_id,
        content: '',
        created_at: question.created_at,
        ...errored,
      });
    } else if (userMessage) {
      history = [
        ...history,
        userMessage,
        {
          id: `${questionId}-send-failure`,
          role: ROLES.Assistant,
          question_id: questionId,
          replyTo: userMessage,
          participant_id: userMessage.participant_id,
          content: '',
          created_at: userMessage.created_at,
          ...errored,
        },
      ];
    } else {
      return;
    }
    appliedQuestionIds.push(questionId);
  });

  return { chatHistory: history, appliedQuestionIds };
};
