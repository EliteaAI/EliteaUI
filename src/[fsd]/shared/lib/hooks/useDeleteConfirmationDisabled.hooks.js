import { useMemo } from 'react';

import { useSecretShowQuery, useSecretsListQuery } from '@/api';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const SECRET_NAME = 'disable_confirmation_delete_mode';

export const useDeleteConfirmationDisabled = () => {
  const projectId = useSelectedProjectId();

  const { data: secrets = [] } = useSecretsListQuery(projectId, {
    skip: !projectId,
  });

  const secretExists = useMemo(() => secrets.some(s => s.name === SECRET_NAME), [secrets]);

  const { data: secretData } = useSecretShowQuery(
    { projectId, name: SECRET_NAME },
    { skip: !projectId || !secretExists },
  );

  return useMemo(() => (secretData?.value || '').toLowerCase() === 'true', [secretData]);
};
