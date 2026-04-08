import { useCallback, useMemo } from 'react';

import { useApplicationListQuery, usePublicApplicationsListQuery } from '@/api/applications';
import { ViewMode } from '@/common/constants';
import { useAuthorIdFromUrl } from '@/hooks/useSearchParamValue';
import { getQueryStatuses } from '@/utils/getQueryStatus';

import usePageQuery from './usePageQuery';

export const useLoadApplications = (
  viewMode,
  sortBy,
  sortOrder,
  statuses,
  forceSkip = false,
  onlyPipeline,
  onlyAgent,
) => {
  const { query, page, pageSize, setPage, tagList, selectedTagIds, projectId } = usePageQuery();
  const authorId = useAuthorIdFromUrl();
  const {
    data: publicApplicationData,
    error: publicApplicationError,
    isError: isPublicApplicationError,
    isLoading: isPublicApplicationLoading,
    isFetching: isPublicApplicationFetching,
  } = usePublicApplicationsListQuery(
    {
      page,
      pageSize,
      params: {
        tags: selectedTagIds,
        author_id: authorId,
        statuses: getQueryStatuses(statuses),
        sort_by: sortBy,
        sort_order: sortOrder,
        query,
        agents_type: onlyPipeline ? 'pipeline' : onlyAgent ? 'classic' : undefined,
      },
    },
    { skip: viewMode !== ViewMode.Public || forceSkip },
  );

  const {
    data: privateApplicationData,
    error: privateApplicationError,
    isError: isPrivateApplicationError,
    isLoading: isPrivateApplicationLoading,
    isFetching: isPrivateApplicationFetching,
  } = useApplicationListQuery(
    {
      projectId,
      page,
      pageSize,
      params: {
        tags: selectedTagIds,
        author_id: authorId,
        statuses: getQueryStatuses(statuses),
        sort_by: sortBy,
        sort_order: sortOrder,
        query,
        agents_type: onlyPipeline ? 'pipeline' : onlyAgent ? 'classic' : undefined,
      },
    },
    { skip: viewMode !== ViewMode.Owner || !projectId || forceSkip },
  );

  const data = useMemo(
    () => (viewMode === ViewMode.Owner ? privateApplicationData : publicApplicationData),
    [privateApplicationData, publicApplicationData, viewMode],
  );
  const totalCount = useMemo(() => {
    const { total = 0 } = data || { total: 0 };
    return total;
  }, [data]);

  const onLoadMoreApplications = useCallback(() => {
    if (!isPublicApplicationFetching && !isPrivateApplicationFetching && (page + 1) * pageSize < totalCount) {
      setPage(page + 1);
    }
  }, [isPublicApplicationFetching, isPrivateApplicationFetching, page, pageSize, totalCount, setPage]);

  return {
    tagList,
    onLoadMoreApplications,
    data,
    isApplicationsError: viewMode === ViewMode.Owner ? isPrivateApplicationError : isPublicApplicationError,
    isApplicationsFetching:
      viewMode === ViewMode.Owner
        ? !!page && isPrivateApplicationFetching
        : !!page && isPublicApplicationFetching,
    isApplicationsLoading:
      viewMode === ViewMode.Owner ? isPrivateApplicationLoading : isPublicApplicationLoading,
    isMoreApplicationsError:
      viewMode === ViewMode.Owner ? !!page && isPrivateApplicationError : !!page && isPublicApplicationError,
    isApplicationsFirstFetching:
      viewMode === ViewMode.Owner
        ? !page && isPrivateApplicationFetching
        : !page && isPublicApplicationFetching,
    applicationsError: viewMode === ViewMode.Owner ? privateApplicationError : publicApplicationError,
    page,
    pageSize,
    setPage,
    query,
  };
};
