import { useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { useUserListQuery } from '@/api/admin';

import { useSelectedProjectId } from './useSelectedProject.hooks';

// Callers often build the tag list inline, so a new array with the same items is not a filter change
const sameTagIds = (a, b) => a === b || (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((id, i) => id === b[i]));

export const useUserList = ({ sortBy, sortOrder, query, pageSize, selectedTagIds, forceSkip = false }) => {
  const { personal_project_id: privateProjectId } = useSelector(state => state.user);
  const projectId = useSelectedProjectId();
  // The page belongs to the filters it was set for. When they change, reset the stored state in the
  // same render, so the first request never carries the old offset and a return to an old filter starts at 0.
  const [pageState, setPageState] = useState({ page: 0, projectId, query, selectedTagIds });
  const filtersChanged =
    pageState.projectId !== projectId ||
    pageState.query !== query ||
    !sameTagIds(pageState.selectedTagIds, selectedTagIds);
  if (filtersChanged) {
    setPageState({ page: 0, projectId, query, selectedTagIds });
  }
  const page = filtersChanged ? 0 : pageState.page;

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
