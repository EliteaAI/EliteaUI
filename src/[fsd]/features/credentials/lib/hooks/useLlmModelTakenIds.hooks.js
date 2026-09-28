import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useGetConfigurationsListQuery } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const BEST_EFFORT_TAKEN_IDS_LIMIT = 500;

export const useLlmModelTakenIds = ({ skip }) => {
  const selectedProjectId = useSelectedProjectId();
  const [searchParams] = useSearchParams();
  const targetProjectId = searchParams.get('project_id') || selectedProjectId;
  const { data } = useGetConfigurationsListQuery(
    { projectId: targetProjectId, page: 0, pageSize: BEST_EFFORT_TAKEN_IDS_LIMIT },
    { skip: skip || !targetProjectId },
  );

  return useMemo(() => (data?.items || []).map(item => item.elitea_title), [data?.items]);
};
