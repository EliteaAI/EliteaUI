import { useCallback, useMemo } from 'react';

import { useApplicationListQuery } from '@/api/applications';
import usePageQuery from '@/hooks/usePageQuery';

export const useLoadApplications = (sortBy, sortOrder, specifiedProjectId) => {
  const { projectId, query, page, pageSize, setPage } = usePageQuery(specifiedProjectId);

  const { data, error, isError, isLoading, isFetching } = useApplicationListQuery(
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
    { skip: !projectId },
  );

  const totalCount = useMemo(() => {
    const { total = 0 } = data || { total: 0 };
    return total;
  }, [data]);
  const onLoadMoreApplications = useCallback(() => {
    if (!isFetching && (page + 1) * pageSize < totalCount) {
      setPage(page + 1);
    }
  }, [isFetching, page, pageSize, totalCount, setPage]);

  return {
    onLoadMoreApplications,
    data,
    isApplicationsError: isError,
    isApplicationsFetching: isFetching,
    isApplicationsLoading: isLoading,
    applicationsError: error,
  };
};
