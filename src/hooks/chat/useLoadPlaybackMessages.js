import { useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import { useLazyMessageListQuery } from '@/api/chat';
import { buildErrorMessage } from '@/common/utils';
import { PLAYBACK_PAGE_SIZE } from '@/hooks/chat/usePlaybackConversation.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { convertMessagesToChatHistory } from '../../common/convertChatConversationMessages';

const useLoadPlaybackMessages = ({ conversation, toastError }) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const projectId = useSelectedProjectId();
  const user = useSelector(state => state.user);
  const [getMessageList, { isError, error }] = useLazyMessageListQuery();

  const onLoadMoreMessages = useCallback(async () => {
    if (!isLoadingMore && conversation?.messages_count > page * PLAYBACK_PAGE_SIZE) {
      setIsLoadingMore(true);
      const result = await getMessageList({
        projectId,
        conversationId: conversation?.id,
        page,
        pageSize: PLAYBACK_PAGE_SIZE,
        params: {
          sort_by: 'created_at',
          sort_order: 'asc',
        },
      });
      if (result.data) {
        setPage(prev => prev + 1);
        setIsLoadingMore(false);
        return convertMessagesToChatHistory(result.data.rows, conversation?.participants, user);
      }
      setIsLoadingMore(false);
    }
  }, [
    conversation?.id,
    conversation?.messages_count,
    conversation?.participants,
    getMessageList,
    isLoadingMore,
    page,
    projectId,
    user,
  ]);

  useEffect(() => {
    setPage(1);
  }, []);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return {
    onLoadMoreMessages,
    setPage,
    isLoadingMore,
  };
};

export default useLoadPlaybackMessages;
