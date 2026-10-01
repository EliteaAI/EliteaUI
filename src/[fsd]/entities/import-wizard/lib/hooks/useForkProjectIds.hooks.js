import { useMemo } from 'react';

import { PUBLIC_PROJECT_ID } from '@/common/constants';

export const useForkProjectIds = (isForking, sourceProjectId) => {
  const excludedProjectIds = useMemo(
    () => (isForking ? [PUBLIC_PROJECT_ID, sourceProjectId] : []),
    [isForking, sourceProjectId],
  );

  return {
    excludedProjectIds,
  };
};
