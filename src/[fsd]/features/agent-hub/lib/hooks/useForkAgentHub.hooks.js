import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { useTrackEvent } from '@/GA';
import { actions as importWizardActions } from '@/[fsd]/entities/import-wizard/model/importWizard.slice';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useLazyApplicationExportQuery } from '@/api/applications';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useForkAgentHub = overrideProjectId => {
  const dispatch = useDispatch();
  const currentProjectId = useSelectedProjectId();
  const projectId = overrideProjectId ?? currentProjectId;
  const trackEvent = useTrackEvent();
  const { toastError } = useToast();
  const [exportForFork, { isFetching }] = useLazyApplicationExportQuery();

  const doFork = useCallback(
    async ({ agentId, versionId, agentName } = {}) => {
      if (!projectId || !agentId) return;

      const result = await exportForFork({
        projectId,
        id: agentId,
        fork: true,
        follow_version_ids: versionId ? [versionId] : [],
      });
      if (result?.error) {
        toastError(buildErrorMessage(result.error));
        return;
      }

      trackEvent(GA_EVENT_NAMES.ENTITY_FORKED, {
        [GA_EVENT_PARAMS.ENTITY_ID]: agentId || 'unknown',
        [GA_EVENT_PARAMS.ENTITY_NAME]: agentName || 'unknown',
        [GA_EVENT_PARAMS.ENTITY_TYPE]: 'applications',
        [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
      });

      dispatch(importWizardActions.openImportWizard({ isForking: true, data: result.data }));
    },
    [projectId, exportForFork, dispatch, toastError, trackEvent],
  );

  return { doFork, isForking: isFetching };
};
