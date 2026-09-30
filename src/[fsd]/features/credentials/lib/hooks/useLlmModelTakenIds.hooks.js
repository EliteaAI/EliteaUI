import { useMemo } from 'react';

import { useGetConfigurationsListQuery } from '@/api/configurations';

import { useLlmModelTargetProjectId } from './useLlmModelTargetProjectId.hooks.js';

const BEST_EFFORT_TAKEN_IDS_LIMIT = 500;

export const useLlmModelTakenIds = ({ skip }) => {
  const targetProjectId = useLlmModelTargetProjectId();
  const { data } = useGetConfigurationsListQuery(
    { projectId: targetProjectId, page: 0, pageSize: BEST_EFFORT_TAKEN_IDS_LIMIT },
    { skip: skip || !targetProjectId },
  );

  return useMemo(() => (data?.items || []).map(item => item.elitea_title), [data?.items]);
};
