import { useSearchParams } from 'react-router-dom';

import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useLlmModelTargetProjectId = () => {
  const selectedProjectId = useSelectedProjectId();
  const [searchParams] = useSearchParams();
  return searchParams.get('project_id') || selectedProjectId;
};
