import { useCallback, useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { ROLES } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { actions } from '@/slices/chat';

export default function useChatStreaming({
  conversationId,
  chatHistory,
  onStopStreaming,
  isChatStreaming = true,
}) {
  const dispatch = useDispatch();
  const projectId = useSelectedProjectId();
  const { currentStreamingInfo } = useSelector(state => state.chat);
  const [isStreamingNow, setIsStreamingNow] = useState(false);
  const [answerMessage, setAnswerMessage] = useState(null);
  const currentQuestionId = currentStreamingInfo[projectId]?.[conversationId] || '';

  const setStreamingInfo = useCallback(
    questionId => {
      dispatch(
        actions.setStreamingInfo({
          projectId,
          conversationId,
          questionId,
        }),
      );
    },
    [conversationId, dispatch, projectId],
  );

  const setConversationStreamingInfo = useCallback(
    (conversationUUID, questionId) => {
      dispatch(
        actions.setStreamingInfo({
          projectId,
          conversationId: conversationUUID,
          questionId,
        }),
      );
    },
    [dispatch, projectId],
  );

  const clearConversationStreamingInfo = useCallback(() => {
    dispatch(
      actions.clearConversationStreamingInfo({
        projectId,
        conversationId,
      }),
    );
  }, [conversationId, dispatch, projectId]);

  const stopStreaming = useCallback(() => {
    if (answerMessage) {
      onStopStreaming?.(answerMessage)();
    }
    clearConversationStreamingInfo();
  }, [onStopStreaming, answerMessage, clearConversationStreamingInfo]);

  useEffect(() => {
    if (isChatStreaming) {
      if (currentQuestionId && chatHistory?.length > 0) {
        const foundStreamingMessage = chatHistory?.find(
          item =>
            (item.replyTo?.uuid === currentQuestionId ||
              item.replyTo?.id === currentQuestionId ||
              (item.role === ROLES.Assistant && item.question_id === currentQuestionId)) &&
            (item.isStreaming || item.isLoading || item.isRegenerating),
        );
        if (foundStreamingMessage) {
          setIsStreamingNow(true);
          setAnswerMessage(foundStreamingMessage);
          return;
        } else if (
          chatHistory?.find(
            item =>
              (item.replyTo?.uuid === currentQuestionId ||
                item.replyTo?.id === currentQuestionId ||
                (item.role === ROLES.Assistant && item.question_id === currentQuestionId)) &&
              !item.isStreaming &&
              !item.isLoading &&
              !item.isRegenerating,
          )
        ) {
          setIsStreamingNow(false);
          setAnswerMessage(null);
          clearConversationStreamingInfo();
        }
      } else {
        setIsStreamingNow(false);
        setAnswerMessage(null);
      }
    } else {
      const foundStreamingMessage = chatHistory?.find(
        item => item.isStreaming || item.isLoading || item.isRegenerating,
      );
      if (foundStreamingMessage) {
        setIsStreamingNow(true);
        setAnswerMessage(foundStreamingMessage);
        return;
      } else {
        setIsStreamingNow(false);
        setAnswerMessage(null);
        clearConversationStreamingInfo();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionId, chatHistory, chatHistory.length]);

  return {
    setStreamingInfo,
    clearConversationStreamingInfo,
    setConversationStreamingInfo,
    stopStreaming,
    isStreamingNow,
  };
}
