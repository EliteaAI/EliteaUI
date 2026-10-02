import { useMemo } from 'react';

import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useForkProjectIds = (isForking, sourceProjectId) => {
  const selectedProjectId = useSelectedProjectId();
  const forkedFromProjectId = sourceProjectId ?? selectedProjectId;

  const excludedProjectIds = useMemo(
    () => (isForking ? [PUBLIC_PROJECT_ID, forkedFromProjectId] : []),
    [isForking, forkedFromProjectId],
  );

  return {
    excludedProjectIds,
  };
};
