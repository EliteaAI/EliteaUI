import { useCallback, useState } from 'react';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

/**
 * Server-side search and infinite scroll over a project list query whose cache merges the pages
 * (`serializeQueryArgs` without `page` + `merge`), so `rows` holds every loaded page.
 * @param {Function} useListQuery RTK Query hook
 * @param {(projectId: number, page: number) => object} buildArgs query args for a page
 */
export const usePagedPickerList = ({ useListQuery, buildArgs, pageSize, query = '', skip = false }) => {
  const projectId = useSelectedProjectId();

  const [page, setPage] = useState(0);
  const pageKey = `${projectId}:${query}`;
  const [prevPageKey, setPrevPageKey] = useState(pageKey);
  if (pageKey !== prevPageKey) {
    // Reset during render, so a new query never requests the previous query's offset first
    setPrevPageKey(pageKey);
    setPage(0);
  }

  const { data, isLoading, isFetching, isError, refetch } = useListQuery(buildArgs(projectId, page), {
    skip: !projectId || skip,
  });

  const total = Number(data?.total) || 0;
  const hasMore = (page + 1) * pageSize < total;

  const onLoadMore = useCallback(() => {
    if (!isFetching && hasMore) setPage(prev => prev + 1);
  }, [hasMore, isFetching]);

  const reload = useCallback(() => {
    if (page === 0) refetch();
    else setPage(0);
  }, [page, refetch]);

  return {
    rows: data?.rows || [],
    total,
    isLoading,
    isFetching,
    isError,
    hasMore,
    onLoadMore,
    reload,
  };
};
