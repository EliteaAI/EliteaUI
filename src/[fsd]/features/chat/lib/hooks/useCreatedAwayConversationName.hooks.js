import { useCallback, useEffect, useRef } from 'react';

import { useSocket } from '@/[fsd]/features/auth/lib/hooks';
import { useLazyConversationDetailsQuery } from '@/[fsd]/features/chat/api/chatApi';
import { DefaultConversationName, SocketMessageType, sioEvents } from '@/common/constants';

const RUN_END_TYPES = new Set([
  SocketMessageType.AgentResponse,
  SocketMessageType.AgentException,
  SocketMessageType.Error,
  SocketMessageType.LlmError,
]);

// The name is generated next to the run, so it may still be pending when the run ends
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3000;

/**
 * Fetches the generated name of a new chat once its first run ends. `chat_conversation_name_updated` goes
 * to the chat's room, which a user who moved on has left (or never joined), but the run's own frames still
 * reach the sender. Frames are matched on `question_id`: their `stream_id` is the backend's task id.
 */
export const useCreatedAwayConversationName = props => {
  const { projectId, onNameResolved } = props;
  const [getConversationDetail] = useLazyConversationDetailsQuery();
  const watchedRef = useRef(new Map());
  const timersRef = useRef(new Set());
  const onNameResolvedRef = useRef(onNameResolved);

  useEffect(() => {
    onNameResolvedRef.current = onNameResolved;
  }, [onNameResolved]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const resolveName = useCallback(
    async (questionId, attempt = 1) => {
      const conversation = watchedRef.current.get(questionId);
      if (!conversation) return;
      const { data } = await getConversationDetail({ projectId, id: conversation.id, messages_limit: 1 });
      const name = data?.name;
      if ((!name || name === DefaultConversationName) && attempt < MAX_ATTEMPTS) {
        const timer = setTimeout(() => {
          timersRef.current.delete(timer);
          resolveName(questionId, attempt + 1);
        }, RETRY_DELAY_MS);
        timersRef.current.add(timer);
        return;
      }
      watchedRef.current.delete(questionId);
      onNameResolvedRef.current?.({
        conversation_id: conversation.id,
        conversation_uuid: conversation.uuid,
        name: name || DefaultConversationName,
      });
    },
    [getConversationDetail, projectId],
  );

  const handleFrame = useCallback(
    frame => {
      const questionId = frame?.question_id;
      if (!watchedRef.current.has(questionId) || !RUN_END_TYPES.has(frame?.type)) return;
      resolveName(questionId);
    },
    [resolveName],
  );

  useSocket(sioEvents.chat_predict, handleFrame);

  const watchConversationName = useCallback(watch => {
    const { id, uuid, questionId } = watch || {};
    if (id && uuid && questionId) watchedRef.current.set(questionId, { id, uuid });
  }, []);

  return { watchConversationName };
};
