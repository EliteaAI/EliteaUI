import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDatasourceListQuery } from '@/api/datasources';
import { PAGE_SIZE, SortFields, SortOrderOptions } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { getQueryStatuses } from '@/utils/getQueryStatus';

export const useDatasourcesOptions = ({ query, specifiedProjectId }) => {
  const [datasourcePage, setDatasourcePage] = useState(0);
  const pageSize = PAGE_SIZE;
  const selectedProjectId = useSelectedProjectId();
  const projectId = useMemo(
    () => specifiedProjectId || selectedProjectId,
    [selectedProjectId, specifiedProjectId],
  );
  useEffect(() => {
    setDatasourcePage(0);
  }, [query, projectId]);

  const { data, error, isError, isLoading, isFetching } = useDatasourceListQuery(
    {
      projectId,
      page: datasourcePage,
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
    setDatasourcePage(datasourcePage + 1);
  }, [data?.rows?.length, data?.total, isFetching, datasourcePage]);

  return {
    onLoadMore,
    data,
    error,
    isError,
    isLoading,
    isFetching,
  };
};
