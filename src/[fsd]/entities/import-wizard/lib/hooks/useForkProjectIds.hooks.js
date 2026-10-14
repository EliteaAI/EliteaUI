import { useMemo } from 'react';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

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
