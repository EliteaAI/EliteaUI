import { useCallback, useEffect, useMemo, useState } from 'react';

import { useApplicationListQuery } from '@/api/applications';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useCanListThisPublicEntity } from '@/hooks/users/usePermissions';

import { useParticipantsQueryParams } from './useParticipantsQueryParams';

export const useApplicationParticipants = ({
  sortBy,
  sortOrder,
  query,
  pageSize,
  selectedTagIds,
  forceSkip = false,
  agents_type = 'all',
}) => {
  const projectId = useSelectedProjectId();
  const canListPublicAgents = useCanListThisPublicEntity('agents');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Add statuses=published only when current project_id equals public project_id
  const shouldFilterByPublished = useMemo(() => projectId === PUBLIC_PROJECT_ID, [projectId]);

  const { queryParams, onLoadMore } = useParticipantsQueryParams({
    projectId,
    sortBy,
    sortOrder,
    query,
    pageSize,
    selectedTagIds,
    agents_type,
  });

  // Enhance queryParams with conditional statuses parameter
  const enhancedQueryParams = useMemo(
    () => ({
      ...queryParams,
      params: {
        ...queryParams.params,
        ...(shouldFilterByPublished && { statuses: 'published' }),
      },
    }),
    [queryParams, shouldFilterByPublished],
  );

  const { data, error, isError, isSuccess, isLoading, isFetching, refetch } = useApplicationListQuery(
    enhancedQueryParams,
    {
      skip: !projectId || forceSkip || (projectId == PUBLIC_PROJECT_ID && !canListPublicAgents),
    },
  );
  const onLoadMoreApplications = useCallback(() => {
    if (!isFetching && !isLoadingMore && queryParams.page * queryParams.pageSize <= data?.total) {
      setIsLoadingMore(true);
      onLoadMore();
    }
  }, [data?.total, isFetching, isLoadingMore, onLoadMore, queryParams.page, queryParams.pageSize]);

  useEffect(() => {
    if (isLoadingMore && (isError || isSuccess)) {
      setIsLoadingMore(false);
    }
  }, [isError, isSuccess, isLoadingMore]);

  return {
    onLoadMoreApplications,
    refetchApplications: refetch,
    data: data ? { ...data, rows: data.rows?.map(item => ({ ...item, project_id: projectId })) } : undefined,
    isApplicationsError: isError,
    isApplicationsFetching: isFetching,
    isApplicationsLoading: isLoading,
    applicationsError: error,
  };
};
