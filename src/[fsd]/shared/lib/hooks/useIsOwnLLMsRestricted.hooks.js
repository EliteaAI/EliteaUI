import { useMemo } from 'react';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks/useSelectedProject.hooks';
import { ALLOW_PROJECT_OWN_LLMS, PUBLIC_PROJECT_ID } from '@/common/constants';

export const useIsOwnLLMsRestricted = () => {
  const projectId = useSelectedProjectId();

  return useMemo(() => ALLOW_PROJECT_OWN_LLMS === false && projectId != PUBLIC_PROJECT_ID, [projectId]);
};
