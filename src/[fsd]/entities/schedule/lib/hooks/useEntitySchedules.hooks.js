import { useCallback, useState } from 'react';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks/useSelectedProject.hooks';

import { useGetScheduleListQuery } from '../../api/scheduleApi.js';

const PAGE_SIZE = 20;
// lean: one request of up to 100 rows, the list API limit; page with offset when an entity has more
const MAX_ROWS = 100;

// The schedules of one agent or pipeline; the list API keeps only the rows the user may see
export const useEntitySchedules = ({ entityType, entityId, skip = false }) => {
  const projectId = useSelectedProjectId();
  const [pages, setPages] = useState(1);
  const pageSize = Math.min(pages * PAGE_SIZE, MAX_ROWS);
  // data keeps the shown rows while "Show more" loads the bigger page
  const { data, isError, error, isFetching, refetch } = useGetScheduleListQuery(
    { projectId, entityType, entityId, pageSize },
    { skip: skip || !projectId || !entityId },
  );
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const loadMore = useCallback(() => setPages(prev => prev + 1), []);

  return {
    rows,
    total,
    isError,
    error,
    isFetching,
    refetch,
    loadMore,
    hasMore: rows.length < total && pageSize < MAX_ROWS,
  };
};
