import { useMemo } from 'react';

import { useGetFolderItemsQuery } from '../../api/entityFoldersApi';

/**
 * Fetches folder items and returns IDs for the entity list query's `ids` filter.
 */
export const useFolderItems = ({ folderId, projectId, sortBy = 'name', sortOrder = 'asc', limit = 100 }) => {
  const shouldSkip = !folderId || !projectId;

  const {
    data: folderItemsData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetFolderItemsQuery(
    {
      projectId,
      folderId,
      sortBy,
      sortOrder,
      limit,
      offset: 0,
    },
    { skip: shouldSkip },
  );

  const hasData = folderItemsData !== undefined;
  const isLoadingOrFetching = isLoading || isFetching;

  const entityIds = useMemo(() => {
    if (shouldSkip) return [];
    if (!folderItemsData?.items?.length) return [];
    return folderItemsData.items.map(item => item.entity_id);
  }, [folderItemsData?.items, shouldSkip]);

  const idsQueryParam = useMemo(() => {
    if (shouldSkip) return null;
    if (!entityIds.length) return '0';
    return entityIds.join(',');
  }, [entityIds, shouldSkip]);

  // Folder is empty when: selected, data loaded, and no items
  const isEmpty = !shouldSkip && hasData && !isLoadingOrFetching && entityIds.length === 0;

  return {
    entityIds,
    idsQueryParam,
    total: folderItemsData?.total || 0,
    entityType: folderItemsData?.entity_type || null,
    isLoading: isLoadingOrFetching && !shouldSkip,
    isFetching: isFetching && !shouldSkip,
    isError,
    error,
    isEmpty,
  };
};

export const useFolderApplications = ({ folderId, projectId, sortBy, sortOrder }) => {
  return useFolderItems({ folderId, projectId, sortBy, sortOrder, limit: 100 });
};
