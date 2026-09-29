import { useMemo } from 'react';

import { useGetLlmModelProfilesQuery } from '@/api/configurations';

import { LLM_MODEL_EFFORT_LEVELS } from '../constants/llmModelForm.constants.js';
import { useLlmModelTargetProjectId } from './useLlmModelTargetProjectId.hooks.js';

const NO_PROFILES = { profiles: [] };

export const useLlmModelProfiles = () => {
  const targetProjectId = useLlmModelTargetProjectId();
  const { data } = useGetLlmModelProfilesQuery({ projectId: targetProjectId }, { skip: !targetProjectId });

  return useMemo(
    () => ({
      profilesPayload: data ?? NO_PROFILES,
      effortLevels: data?.effort_levels?.length ? data.effort_levels : LLM_MODEL_EFFORT_LEVELS,
    }),
    [data],
  );
};
