import { useCallback, useEffect, useMemo, useState } from 'react';

import { useApplicationListQuery } from '@/api/applications';
import { PAGE_SIZE, SortFields, SortOrderOptions } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { getQueryStatuses } from '@/utils/getQueryStatus';

export const useApplicationOptions = ({ query, specifiedProjectId }) => {
  const [page, setPage] = useState(0);
  const pageSize = PAGE_SIZE;
  const selectedProjectId = useSelectedProjectId();
  const projectId = useMemo(
    () => specifiedProjectId || selectedProjectId,
    [selectedProjectId, specifiedProjectId],
  );

  useEffect(() => {
    setPage(0);
  }, [query, projectId]);

  const { data, error, isError, isLoading, isFetching } = useApplicationListQuery(
    {
      projectId,
      page,
      pageSize,
      params: {
        tags: [],
        statuses: getQueryStatuses([]),
        sort_by: SortFields.CreatedAt,
        sort_order: SortOrderOptions.DESC,
        query,
      },
    },
    { skip: !projectId },
  );

  const onLoadMore = useCallback(() => {
    const existsMore = data?.rows?.length < data?.total;
    if (!existsMore || isFetching) return;
    setPage(page + 1);
  }, [data?.rows?.length, data?.total, isFetching, page]);

  return {
    onLoadMore,
    data,
    error,
    isError,
    isLoading,
    isFetching,
  };
};
