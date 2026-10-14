import { useSearchParams } from 'react-router-dom';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

export const useLlmModelTargetProjectId = () => {
  const selectedProjectId = useSelectedProjectId();
  const [searchParams] = useSearchParams();
  return searchParams.get('project_id') || selectedProjectId;
};
