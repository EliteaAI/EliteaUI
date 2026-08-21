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

  const folders = useMemo(() => data?.folders || [], [data]);
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
