import { useCallback, useEffect, useMemo, useState } from 'react';

import { useConversationListQuery } from '@/api/chat';
import { PAGE_SIZE } from '@/common/constants';

const useLoadConversations = (sortBy, sortOrder, projectId, query) => {
  const [requestParams, setRequestParams] = useState({
    projectId,
    page: 0,
    params: {
      sort_by: sortBy,
      sort_order: sortOrder,
      query,
    },
  });
  const setPage = useCallback(page => {
    setRequestParams(prev => ({
      ...prev,
      page,
    }));
  }, []);

  const {
    data = { rows: [], total: 0 },
    isError: isConversationError,
    error: conversationError,
    isLoading: isConversationLoading,
    isFetching: isConversationFetching,
  } = useConversationListQuery(requestParams, { skip: !projectId || !requestParams.projectId });

  const totalCount = useMemo(() => {
    const { total = 0 } = data || { total: 0 };
    return total;
  }, [data]);

  const onLoadMoreConversations = useCallback(
    () => {
      if (!isConversationFetching && (requestParams.page + 1) * PAGE_SIZE < totalCount) {
        setPage(prev => prev + 1);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isConversationFetching, requestParams.page, totalCount],
  );

  useEffect(() => {
    if (projectId) {
      setRequestParams(prev => ({
        ...prev,
        page: 0,
        projectId,
      }));
    }
  }, [projectId]);

  useEffect(() => {
    setRequestParams(prev => ({
      ...prev,
      page: 0,
      params: {
        ...prev.params,
        query,
      },
    }));
  }, [query]);

  return {
    conversations: isConversationError ? [] : data.rows,
    conversationTotal: isConversationError ? 0 : data?.total || 0,
    isConversationError,
    conversationError,
    isConversationLoading,
    isConversationFetching,
    onLoadMoreConversations,
  };
};

export default useLoadConversations;
