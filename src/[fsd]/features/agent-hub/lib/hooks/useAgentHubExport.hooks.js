import { useCallback } from 'react';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useLazyApplicationExportMdQuery } from '@/api/applications';
import { buildErrorMessage, downloadBlobFile } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useAgentHubExport = overrideProjectId => {
  const currentProjectId = useSelectedProjectId();
  const projectId = overrideProjectId ?? currentProjectId;
  const trackEvent = useTrackEvent();
  const { toastError } = useToast();
  const [exportAgent, { isFetching: isExporting }] = useLazyApplicationExportMdQuery();

  const doExport = useCallback(
    async ({ agentId, versionId, agentName } = {}) => {
      if (!agentId) return;

      try {
        const { blob, filename } = await exportAgent({
          projectId,
          id: agentId,
          follow_version_ids: versionId ? [versionId] : [],
        }).unwrap();
        // Filename from Content-Disposition (parsed in the slice); fall back to the agent name.
        const downloadName = filename || `${agentName || 'agent'}.md`;
        downloadBlobFile(blob, downloadName);

        trackEvent(GA_EVENT_NAMES.ENTITY_EXPORTED, {
          [GA_EVENT_PARAMS.ENTITY_ID]: agentId || 'unknown',
          [GA_EVENT_PARAMS.ENTITY_NAME]: agentName || 'unknown',
          [GA_EVENT_PARAMS.ENTITY_TYPE]: 'applications',
          [GA_EVENT_PARAMS.EXPORT_FORMAT]: 'md',
          [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
        });
      } catch (error) {
        toastError(buildErrorMessage(error) || 'Failed to export agent.');
      }
    },
    [exportAgent, projectId, toastError, trackEvent],
  );

  return { doExport, isExporting };
};
