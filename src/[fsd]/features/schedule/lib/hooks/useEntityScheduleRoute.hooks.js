import { useMemo } from 'react';

import { useLocation, useParams } from 'react-router-dom';

import { buildEntityEditorLink } from '@/[fsd]/entities/schedule';
import { useViewMode } from '@/[fsd]/shared/lib/hooks';
import { SearchParams } from '@/common/constants';

// A schedule form nested in an agent or pipeline editor: the editor entity is locked and Save returns to the editor
export const useEntityScheduleRoute = entityType => {
  const { tab, agentId } = useParams();
  const { search } = useLocation();
  const viewMode = useViewMode();

  return useMemo(() => {
    if (!entityType) return {};
    // The editor answers "Page not found." without viewMode, so the fallback keeps the form search and adds it
    const query = new URLSearchParams(search);
    query.set(SearchParams.ViewMode, viewMode);
    // The editor version rides in SearchParams.VersionId: the form locks to it and Save returns to it (R5.3, R5.5)
    const versionId = query.get(SearchParams.VersionId);
    query.delete(SearchParams.VersionId);
    const editorLink = buildEntityEditorLink({ entityType, entityId: agentId, tab });

    return {
      // The entity options carry numeric ids, so a string id from the URL would match none of them
      lockedEntity: {
        type: entityType,
        id: Number(agentId),
        ...(versionId && { versionId: Number(versionId) }),
      },
      returnTo: `${versionId ? `${editorLink}/${versionId}` : editorLink}?${query}`,
    };
  }, [entityType, tab, agentId, search, viewMode]);
};
