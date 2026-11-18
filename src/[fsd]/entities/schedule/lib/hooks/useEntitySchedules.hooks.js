import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks/useSelectedProject.hooks';

import { useGetScheduleListQuery } from '../../api/scheduleApi.js';

const PAGE_SIZE = 20;
// The list API limit: up to 100 rows come in one growing request, then whole pages of 100 by offset
const MAX_ROWS = 100;
const NO_ROWS = [];

// The schedules of one agent or pipeline version, or of one toolkit index; the list API keeps only the rows
// the user may see.
// sortBy / sortOrder are optional; without them the list API orders by next run.
// "Show more" adds 20 rows each time, with no upper limit.
export const useEntitySchedules = ({
  entityType,
  entityId,
  versionId,
  indexName,
  triggerKind,
  sortBy,
  sortOrder,
  skip = false,
}) => {
  const projectId = useSelectedProjectId();
  const [shown, setShown] = useState(PAGE_SIZE);
  const listKey = `${entityId}:${versionId}:${indexName}:${triggerKind}:${sortBy}:${sortOrder}`;
  const [shownKey, setShownKey] = useState(listKey);
  // Another agent, pipeline or version starts at the first 20 rows, before any request
  if (shownKey !== listKey) {
    setShownKey(listKey);
    setShown(PAGE_SIZE);
  }
  const listArgs = { projectId, entityType, entityId, versionId, indexName, triggerKind, sortBy, sortOrder };
  const isSkipped = skip || !projectId || !entityId;

  // The first 100 rows: one request that grows by 20; data keeps the shown rows while it loads
  const firstSize = Math.min(shown, MAX_ROWS);
  const { data, isError, error, isFetching, refetch } = useGetScheduleListQuery(
    { ...listArgs, pageSize: firstSize },
    { skip: isSkipped },
  );

  // Past 100: the next whole page of 100, by offset, appended once it arrives
  const [extraPages, setExtraPages] = useState({ key: listKey, pages: [] });
  const storedPages = extraPages.key === listKey ? extraPages.pages : NO_ROWS;
  const neededPages = Math.max(0, Math.ceil((shown - MAX_ROWS) / MAX_ROWS));
  const nextPage = storedPages.length + 1;
  const extra = useGetScheduleListQuery(
    { ...listArgs, pageSize: MAX_ROWS, page: nextPage },
    { skip: isSkipped || storedPages.length >= neededPages },
  );
  useEffect(() => {
    if (!extra.currentData) return;
    setExtraPages(prev => {
      const prevPages = prev.key === listKey ? prev.pages : NO_ROWS;
      // A repeat of a stored page (a refetch) changes nothing
      if (prevPages.length !== nextPage - 1) return prev;
      return { key: listKey, pages: [...prevPages, extra.currentData.rows ?? NO_ROWS] };
    });
  }, [extra.currentData, listKey, nextPage]);

  const total = data?.total ?? 0;
  const rows = useMemo(
    () => [...(data?.rows ?? NO_ROWS), ...storedPages.flat()].slice(0, shown),
    [data?.rows, shown, storedPages],
  );
  const loadMore = useCallback(() => setShown(prev => prev + PAGE_SIZE), []);
  const retry = useCallback(() => {
    refetch();
    if (extra.isError) extra.refetch();
  }, [extra, refetch]);

  return {
    rows,
    total,
    isError: isError || extra.isError,
    error: error ?? extra.error,
    isFetching: isFetching || extra.isFetching,
    refetch: retry,
    loadMore,
    hasMore: rows.length < total,
  };
};
