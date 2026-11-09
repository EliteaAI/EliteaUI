import { useMemo } from 'react';

import { useLocation, useParams } from 'react-router-dom';

import { TOOLKIT_INDEX_TYPE, buildEntityEditorLink } from '@/[fsd]/entities/schedule';
import { useViewMode } from '@/[fsd]/shared/lib/hooks';
import { SearchParams } from '@/common/constants';

// A schedule form nested in an agent, pipeline or toolkit index page: the editor entity is locked and Save returns to the editor
export const useEntityScheduleRoute = entityType => {
  const { tab, agentId, toolkitId, indexName } = useParams();
  const { search } = useLocation();
  const viewMode = useViewMode();

  return useMemo(() => {
    if (!entityType) return {};
    // The editor answers "Page not found." without viewMode, so the fallback keeps the form search and adds it
    const query = new URLSearchParams(search);
    query.set(SearchParams.ViewMode, viewMode);
    // The editor version rides in SearchParams.VersionId: the form locks to it and Save returns to it
    const versionId = query.get(SearchParams.VersionId);
    query.delete(SearchParams.VersionId);

    if (entityType === TOOLKIT_INDEX_TYPE)
      return {
        // The toolkit options carry numeric ids, as the application options do
        lockedEntity: { type: entityType, id: Number(toolkitId), indexName },
        returnTo: `${buildEntityEditorLink({ entityType, entityId: toolkitId, indexName, tab })}?${query}`,
      };

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
  }, [entityType, tab, agentId, toolkitId, indexName, search, viewMode]);
};
