import { useProjectInfoQuery } from '@/[fsd]/features/settings/api';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

// #6789: team-project settings are admin-only, a private project's owner keeps them; the backend decides
export const useCanManageProjectSettings = () => {
  const projectId = useSelectedProjectId();
  const { data, isLoading } = useProjectInfoQuery(
    { projectId, fields: 'can_manage_settings' },
    { skip: !projectId },
  );

  return { canManageSettings: Boolean(data?.can_manage_settings), isLoading };
};
