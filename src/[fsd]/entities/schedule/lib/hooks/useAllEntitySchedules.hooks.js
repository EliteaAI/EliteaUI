import { useEffect, useMemo, useState } from 'react';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks/useSelectedProject.hooks';

import { useGetScheduleListQuery } from '../../api/scheduleApi.js';

// The list API limit
const PAGE_SIZE = 100;
const NO_ROWS = [];

// Every schedule of one agent or pipeline the user may see: pages of 100 load one after another until a page is not full
export const useAllEntitySchedules = ({ entityType, entityId, skip = false }) => {
  const projectId = useSelectedProjectId();
  const key = `${projectId}:${entityType}:${entityId}`;
  const [loaded, setLoaded] = useState({ key, pages: [] });
  const pages = loaded.key === key ? loaded.pages : NO_ROWS;
  const page = pages.length;
  const isDone = page > 0 && pages[page - 1].length < PAGE_SIZE;

  const { currentData } = useGetScheduleListQuery(
    { projectId, entityType, entityId, page, pageSize: PAGE_SIZE },
    { skip: skip || !projectId || !entityId || isDone },
  );

  useEffect(() => {
    if (!currentData) return;
    setLoaded(prev => {
      const prevPages = prev.key === key ? prev.pages : NO_ROWS;
      // A repeat of a stored page (a refetch) changes nothing
      return prevPages.length === page ? { key, pages: [...prevPages, currentData.rows ?? NO_ROWS] } : prev;
    });
  }, [currentData, key, page]);

  // A stable array, so the callers' memos hold between renders
  const rows = useMemo(() => pages.flat(), [pages]);

  return { rows };
};
