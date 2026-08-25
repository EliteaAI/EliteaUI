import { useMemo } from 'react';

import { useGetEntityFoldersQuery } from '@/api';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useEntityFolders = (entityType, options = {}) => {
  const { skip = false, includeCounts = false } = options;
  const projectId = useSelectedProjectId();

  const { data, isLoading, isFetching, isError, error, refetch } = useGetEntityFoldersQuery(
    { projectId, entityType, includeCounts },
    { skip: skip || !projectId || !entityType },
  );

  const folders = useMemo(() => {
    const list = data?.folders || [];
    return [...list].sort((a, b) => {
      const aPinned = a.meta?.is_pinned ? 1 : 0;
      const bPinned = b.meta?.is_pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      const aDate = new Date(a.updated_at || a.created_at);
      const bDate = new Date(b.updated_at || b.created_at);
      return bDate - aDate;
    });
  }, [data]);
  const total = useMemo(() => data?.total || 0, [data]);

  return {
    folders,
    total,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
};
