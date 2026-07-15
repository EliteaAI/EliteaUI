import { useCallback, useEffect, useState } from 'react';

import { useLazyMessageListQuery, useLazyMessageTracesQuery } from '@/api';
import {
  convertMessagesToChatHistory,
  groupTraceStepsByGroupId,
} from '@/common/convertChatConversationMessages';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const useLoadMoreMessages = ({ setChatHistory, activeConversation, toastError }) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const projectId = useSelectedProjectId();
  const [getMessageList, { isError, error }] = useLazyMessageListQuery();
  const [getMessageTraces] = useLazyMessageTracesQuery();

  const onLoadMoreMessages = useCallback(
    async callback => {
      if (!isLoadingMore && activeConversation?.messages_count > page * 10) {
        setIsLoadingMore(true);
        const result = await getMessageList({
          projectId,
          conversationId: activeConversation?.id,
          page,
          pageSize: 10,
        });
        if (result.data) {
          // Pins for the loaded page come from message_trace_step (TS-4). Cached per conversation,
          // so repeated load-more calls dedupe. Failure degrades to no pins for the page.
          const tracesResult = await getMessageTraces({
            projectId,
            conversationId: activeConversation?.id,
          });
          const traceStepsByGroupId = groupTraceStepsByGroupId(tracesResult.data);
          setChatHistory(prev => {
            callback && callback();
            return [
              ...convertMessagesToChatHistory(
                result.data.rows.slice().reverse(),
                activeConversation?.participants,
                undefined,
                traceStepsByGroupId,
              ).filter(message => !prev.find(preMessage => preMessage.id === message.id)),
              ...prev,
            ];
          });
        }
        setPage(prev => prev + 1);
        setIsLoadingMore(false);
      }
    },
    [
      activeConversation?.id,
      activeConversation?.messages_count,
      activeConversation?.participants,
      getMessageList,
      getMessageTraces,
      isLoadingMore,
      page,
      projectId,
      setChatHistory,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [projectId]);

  useEffect(() => {
    setPage(1);
  }, [activeConversation?.id]);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return {
    onLoadMoreMessages,
    isLoadingMore,
  };
};

export default useLoadMoreMessages;
