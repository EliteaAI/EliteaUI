import { useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { useUserListQuery } from '@/api/admin';

import { useSelectedProjectId } from './useSelectedProject.hooks';

export const useUserList = ({ sortBy, sortOrder, query, pageSize, selectedTagIds, forceSkip = false }) => {
  const { personal_project_id: privateProjectId } = useSelector(state => state.user);
  const projectId = useSelectedProjectId();
  // The page belongs to the filters it was set for. A change of filters drops it in the same render,
  // so the first request after a change never carries the old offset.
  const [pageState, setPageState] = useState({ page: 0, projectId, query, selectedTagIds });
  const page =
    pageState.projectId === projectId &&
    pageState.query === query &&
    pageState.selectedTagIds === selectedTagIds
      ? pageState.page
      : 0;

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
      setPageState({ page: page + 1, projectId, query, selectedTagIds });
    }
  }, [isFetching, page, projectId, query, selectedTagIds]);

  return {
    onLoadMoreUsers,
    data: data ? { ...data, rows: data.rows?.map(item => ({ ...item, project_id: projectId })) } : undefined,
    isUsersError: isError,
    isUsersFetching: isFetching,
    isUsersLoading: isLoading,
    usersError: error,
  };
};
