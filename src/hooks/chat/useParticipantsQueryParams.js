import { useCallback, useEffect, useState } from 'react';

import { CollectionStatus } from '@/common/constants';

export function useParticipantsQueryParams({
  projectId,
  sortBy,
  sortOrder,
  query,
  pageSize,
  selectedTagIds,
  forPublic,
  agents_type,
}) {
  const [queryParams, setQueryParams] = useState({
    projectId: forPublic ? undefined : projectId,
    page: 0,
    pageSize,
    params: {
      tags: selectedTagIds,
      sort_by: sortBy,
      sort_order: sortOrder,
      statuses: forPublic ? CollectionStatus.Published : undefined,
      query,
      agents_type: agents_type || undefined,
    },
  });

  const onLoadMore = useCallback(() => {
    setQueryParams(prev => ({
      ...prev,
      page: prev.page + 1,
    }));
  }, []);

  useEffect(() => {
    setQueryParams(prev => ({
      ...prev,
      projectId,
      page: 0,
    }));
  }, [projectId]);

  useEffect(() => {
    setQueryParams(prev => ({
      ...prev,
      params: {
        ...prev.params,
        query,
      },
      page: 0,
    }));
  }, [query]);

  useEffect(() => {
    setQueryParams(prev => ({
      ...prev,
      params: {
        ...prev.params,
        tags: selectedTagIds,
      },
      page: 0,
    }));
  }, [selectedTagIds]);

  return {
    queryParams,
    onLoadMore,
  };
}
