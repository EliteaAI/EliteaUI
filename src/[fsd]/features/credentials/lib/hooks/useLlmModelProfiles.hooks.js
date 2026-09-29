import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useGetLlmModelProfilesQuery } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { LLM_MODEL_EFFORT_LEVELS } from '../constants/llmModelForm.constants.js';

// Without the list every name is unrecognized, which is the full-set fallback the form already renders.
const NO_PROFILES = { profiles: [] };

export const useLlmModelProfiles = () => {
  const selectedProjectId = useSelectedProjectId();
  const [searchParams] = useSearchParams();
  const targetProjectId = searchParams.get('project_id') || selectedProjectId;
  const { data, isFetching } = useGetLlmModelProfilesQuery(
    { projectId: targetProjectId },
    { skip: !targetProjectId },
  );

  return useMemo(
    () => ({
      profilesPayload: data ?? NO_PROFILES,
      effortLevels: data?.effort_levels?.length ? data.effort_levels : LLM_MODEL_EFFORT_LEVELS,
      isProfilesPending: isFetching && !data,
    }),
    [data, isFetching],
  );
};
