import { useCallback, useEffect, useState } from 'react';

import { useLazyMessageListQuery } from '@/[fsd]/features/chat/api';

export const useMessageGroupPages = ({ projectId, conversationId, enabled, pageSize }) => {
  const [fetchMessages, { isFetching }] = useLazyMessageListQuery();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Turning the list off starts it again from the first page next time
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) {
      setRows([]);
      setTotal(0);
      setPage(0);
      setIsLoaded(false);
    }
  }

  useEffect(() => {
    if (!enabled || !conversationId) return undefined;
    let isStale = false;
    fetchMessages({ projectId, conversationId, page, pageSize }).then(result => {
      if (isStale || !result.data) return;
      const newRows = result.data.rows ?? [];
      setRows(prev => {
        const known = new Set(prev.map(item => item.id));
        return page === 0 ? newRows : [...prev, ...newRows.filter(item => !known.has(item.id))];
      });
      setTotal(result.data.total ?? newRows.length);
      setIsLoaded(true);
    });
    return () => {
      isStale = true;
    };
  }, [conversationId, enabled, fetchMessages, page, pageSize, projectId]);

  const onLoadMore = useCallback(() => setPage(prev => prev + 1), []);

  return { rows, total, isFetching, isLoaded, onLoadMore };
};
