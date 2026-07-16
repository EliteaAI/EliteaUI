import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { useTrackEvent } from '@/GA';
import { actions as importWizardActions } from '@/[fsd]/entities/import-wizard/model/importWizard.slice';
import { useLazySkillExportForkQuery } from '@/[fsd]/features/skill/api';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useForkSkill = overrideProjectId => {
  const dispatch = useDispatch();
  const currentProjectId = useSelectedProjectId();
  const projectId = overrideProjectId ?? currentProjectId;
  const trackEvent = useTrackEvent();
  const { toastError } = useToast();
  const [exportForFork, { isFetching }] = useLazySkillExportForkQuery();

  const doFork = useCallback(
    async ({ skillId, versionId, skillName } = {}) => {
      if (!projectId || !skillId) return;

      const result = await exportForFork({ projectId, skillId, versionId });
      if (result?.error) {
        toastError(buildErrorMessage(result.error));
        return;
      }

      trackEvent(GA_EVENT_NAMES.ENTITY_FORKED, {
        [GA_EVENT_PARAMS.ENTITY_ID]: skillId || 'unknown',
        [GA_EVENT_PARAMS.ENTITY_NAME]: skillName || 'unknown',
        [GA_EVENT_PARAMS.ENTITY_TYPE]: 'skills',
        [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
      });

      dispatch(importWizardActions.openImportWizard({ isForking: true, data: result.data }));
    },
    [projectId, exportForFork, dispatch, toastError, trackEvent],
  );

  return { doFork, isForking: isFetching };
};
