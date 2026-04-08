import { useCallback, useEffect, useState } from 'react';

import { usePublicApplicationsListQuery } from '@/api/applications';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useCanListThisPublicEntity } from '@/hooks/users/usePermissions';

import { useParticipantsQueryParams } from './useParticipantsQueryParams';

export const usePublicApplicationParticipants = ({
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
  const { queryParams, onLoadMore } = useParticipantsQueryParams({
    projectId,
    sortBy,
    sortOrder,
    query,
    pageSize,
    selectedTagIds,
    forPublic: true,
    agents_type,
  });

  const { data, error, isError, isSuccess, isLoading, isFetching, refetch } = usePublicApplicationsListQuery(
    queryParams,
    {
      skip: !PUBLIC_PROJECT_ID || forceSkip || canListPublicAgents,
    },
  );

  const onLoadMorePublicApplications = useCallback(() => {
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
    onLoadMorePublicApplications,
    refetchPublicApplications: refetch,
    publicApplicationData: data
      ? { ...data, rows: data.rows?.map(item => ({ ...item, project_id: +PUBLIC_PROJECT_ID })) }
      : undefined,
    isPublicApplicationsError: isError,
    isPublicApplicationsFetching: isFetching,
    isPublicApplicationsLoading: isLoading,
    publicApplicationsError: error,
  };
};
