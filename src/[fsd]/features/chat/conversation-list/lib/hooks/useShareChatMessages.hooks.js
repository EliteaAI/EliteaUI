import { useMemo } from 'react';

import { toShareMessage } from '@/[fsd]/features/chat/conversation-list/lib/helpers/shareChat.helpers';

import { useMessageGroupPages } from './useMessageGroupPages.hooks';

const MESSAGES_PAGE_SIZE = 20;

export const useShareChatMessages = ({ projectId, conversationId, authorNames, enabled }) => {
  const { rows, total, isFetching, isLoaded, onLoadMore } = useMessageGroupPages({
    projectId,
    conversationId,
    enabled,
    pageSize: MESSAGES_PAGE_SIZE,
  });

  const messages = useMemo(
    () => [...rows].reverse().map(group => toShareMessage(group, authorNames)),
    [authorNames, rows],
  );

  return { messages, total, isFetching, isLoaded, onLoadMore };
};
