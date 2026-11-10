import { useProjectInfoQuery } from '@/[fsd]/features/settings/api';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

// #6789: team-project settings are admin-only, a private project's owner keeps them; the backend decides
export const useCanManageProjectSettings = () => {
  const projectId = useSelectedProjectId();
  // Same argument as the other project-info callers so they share one cache entry;
  // currentData drops the previous project's answer while the new one is fetching
  const { currentData, isFetching, isUninitialized } = useProjectInfoQuery(
    { projectId },
    { skip: !projectId },
  );

  return {
    canManageSettings: Boolean(currentData?.can_manage_settings),
    isLoading: !projectId || isUninitialized || isFetching,
  };
};
