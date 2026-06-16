import { useCallback } from 'react';

import { useTrackEvent } from '@/GA';
import { useLazySkillExportMdQuery } from '@/[fsd]/features/skill/api';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { buildErrorMessage, downloadBlobFile } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useSkillExport = () => {
  const projectId = useSelectedProjectId();
  const trackEvent = useTrackEvent();
  const { toastError } = useToast();
  const [exportSkill, { isFetching: isExporting }] = useLazySkillExportMdQuery();

  const doExport = useCallback(
    async ({ skillId, versionName, skillName } = {}) => {
      if (!skillId) return;

      try {
        const { blob, filename } = await exportSkill({ projectId, skillId, versionName }).unwrap();
        // Filename from Content-Disposition (parsed in the slice); fall back to the skill name.
        const downloadName = filename || `${skillName || 'skill'}.md`;
        downloadBlobFile(blob, downloadName);

        trackEvent(GA_EVENT_NAMES.ENTITY_EXPORTED, {
          [GA_EVENT_PARAMS.ENTITY_ID]: skillId || 'unknown',
          [GA_EVENT_PARAMS.ENTITY_NAME]: skillName || 'unknown',
          [GA_EVENT_PARAMS.ENTITY_TYPE]: 'skills',
          [GA_EVENT_PARAMS.EXPORT_FORMAT]: 'md',
          [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
        });
      } catch (error) {
        toastError(buildErrorMessage(error) || 'Failed to export skill.');
      }
    },
    [exportSkill, projectId, toastError, trackEvent],
  );

  return { doExport, isExporting };
};
