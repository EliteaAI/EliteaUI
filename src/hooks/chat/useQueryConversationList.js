import { useCallback, useEffect, useState } from 'react';

import { useConversationListQuery } from '@/api/chat';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSortQueryParamsFromUrl from '@/hooks/useSortQueryParamsFromUrl';

import { getProjectPinnedConversationList, sortConversations } from './usePinConversation';

export default function useQueryConversationList({ toastError, setConversations }) {
  const { checkPermission } = useCheckPermission();
  const projectId = useSelectedProjectId();
  const { sort_by: sortBy, sort_order: sortOrder } = useSortQueryParamsFromUrl({
    defaultSortOrder: 'desc',
    defaultSortBy: 'created_at',
  });
  const [page, setPage] = useState(0);
  const {
    data,
    isSuccess,
    isError: isLoadConversationListError,
    error: loadConversationListError,
    isLoading: isLoadConversations,
    isFetching: isLoadMoreConversations,
  } = useConversationListQuery(
    {
      projectId,
      page,
      params: {
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    },
    { skip: !projectId || !checkPermission(PERMISSIONS.chat.list) },
  );

  const onLoadMoreConversations = useCallback(() => {
    if (data?.rows?.length && data?.total && data?.rows?.length < data?.total) {
      setPage(prev => prev + 1);
    }
  }, [data?.rows?.length, data?.total]);

  useEffect(() => {
    if (isSuccess) {
      const pinnedConversationList = getProjectPinnedConversationList(projectId);
      const sortedData = sortConversations(
        (data?.rows || []).map(item =>
          pinnedConversationList.includes(item.id) ? { ...item, isPinned: true } : item,
        ),
      );
      setConversations(prev => {
        const filteredNewConversation = prev.filter(item => item.isNew);
        return [...filteredNewConversation, ...sortedData];
      });
    }
  }, [data, data?.rows, isSuccess, projectId, setConversations]);

  useEffect(() => {
    if (isLoadConversationListError) {
      toastError(buildErrorMessage(loadConversationListError));
      setConversations([]);
    }
  }, [loadConversationListError, isLoadConversationListError, toastError, setConversations]);

  return {
    isLoadConversations,
    isLoadMoreConversations,
    onLoadMoreConversations,
    totalConversationCount: data?.total || 0,
  };
}
