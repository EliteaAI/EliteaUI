import { useMemo } from 'react';

import { useParams } from 'react-router-dom';

import { buildEntityEditorLink } from '@/[fsd]/entities/schedule/lib/helpers';

// A schedule form nested in an agent or pipeline editor: the editor entity is locked and Save returns to the editor
export const useEntityScheduleRoute = entityType => {
  const { tab, agentId } = useParams();

  return useMemo(
    () =>
      entityType
        ? {
            lockedEntity: { type: entityType, id: agentId },
            returnTo: buildEntityEditorLink({ entityType, entityId: agentId, tab }),
          }
        : {},
    [entityType, tab, agentId],
  );
};
