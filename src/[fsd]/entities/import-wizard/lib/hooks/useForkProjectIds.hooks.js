import { useMemo } from 'react';

import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useForkProjectIds = isForking => {
  const selectedProjectId = useSelectedProjectId();

  const excludedProjectIds = useMemo(
    () => (isForking ? [PUBLIC_PROJECT_ID, selectedProjectId] : []),
    [isForking, selectedProjectId],
  );

  return {
    excludedProjectIds,
  };
};
