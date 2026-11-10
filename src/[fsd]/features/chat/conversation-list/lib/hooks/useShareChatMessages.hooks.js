import { useCallback, useEffect, useMemo, useState } from 'react';

import { useLazyMessageListQuery } from '@/[fsd]/features/chat/api';
import { toShareMessage } from '@/[fsd]/features/chat/conversation-list/lib/helpers/shareChat.helpers';

const MESSAGES_PAGE_SIZE = 20;

export const useShareChatMessages = ({ projectId, conversationId, authorNames, enabled }) => {
  const [fetchMessages, { isFetching }] = useLazyMessageListQuery();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!enabled || !conversationId) return undefined;
    let isStale = false;
    fetchMessages({ projectId, conversationId, page, pageSize: MESSAGES_PAGE_SIZE }).then(result => {
      if (isStale || !result.data) return;
      const newRows = result.data.rows ?? [];
      setRows(prev => {
        const known = new Set(prev.map(item => item.id));
        return page === 0 ? newRows : [...prev, ...newRows.filter(item => !known.has(item.id))];
      });
      setTotal(result.data.total ?? newRows.length);
    });
    return () => {
      isStale = true;
    };
  }, [conversationId, enabled, fetchMessages, page, projectId]);

  const onLoadMore = useCallback(() => setPage(prev => prev + 1), []);

  const messages = useMemo(
    () => [...rows].reverse().map(group => toShareMessage(group, authorNames)),
    [authorNames, rows],
  );

  return { messages, total, isFetching, onLoadMore };
};
