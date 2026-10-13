import { useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import { useUserListQuery } from '@/api/admin';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useUserList = ({ sortBy, sortOrder, query, pageSize, selectedTagIds, forceSkip = false }) => {
  const { personal_project_id: privateProjectId } = useSelector(state => state.user);
  const projectId = useSelectedProjectId();
  const [page, setPage] = useState(0);

  const { data, error, isError, isLoading, isFetching } = useUserListQuery(
    {
      projectId,
      page,
      pageSize,
      params: {
        sort_by: sortBy,
        sort_order: sortOrder,
        query,
      },
    },
    { skip: !projectId || forceSkip || projectId == privateProjectId },
  );

  const onLoadMoreUsers = useCallback(() => {
    if (!isFetching) {
      setPage(page + 1);
    }
  }, [isFetching, setPage, page]);

  useEffect(() => {
    setPage(0);
  }, [projectId, query, selectedTagIds]);

  return {
    onLoadMoreUsers,
    data: data ? { ...data, rows: data.rows?.map(item => ({ ...item, project_id: projectId })) } : undefined,
    isUsersError: isError,
    isUsersFetching: isFetching,
    isUsersLoading: isLoading,
    usersError: error,
  };
};
