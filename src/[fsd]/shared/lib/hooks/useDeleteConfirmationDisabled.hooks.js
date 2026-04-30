import { useEffect, useState } from 'react';

import { useLazySecretShowQuery, useSecretsListQuery } from '@/api/secrets';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const SECRET_NAME = 'disable_confirmation_delete_mode';

export const useDeleteConfirmationDisabled = () => {
  const [isDisabled, setIsDisabled] = useState(false);
  const projectId = useSelectedProjectId();

  const { data: secrets = [] } = useSecretsListQuery(projectId, {
    skip: !projectId,
  });

  const [showSecret] = useLazySecretShowQuery();

  useEffect(() => {
    const checkSecret = async () => {
      const secret = secrets.find(s => s.name === SECRET_NAME);

      if (!secret) {
        setIsDisabled(false);
        return;
      }

      try {
        const { data, error } = await showSecret({ projectId, name: SECRET_NAME });

        if (error) {
          setIsDisabled(false);
          return;
        }

        setIsDisabled((data?.value || '').toLowerCase() === 'true');
      } catch {
        setIsDisabled(false);
      }
    };

    if (projectId && secrets.length > 0) {
      checkSecret();
    } else {
      setIsDisabled(false);
    }
  }, [secrets, projectId, showSecret]);

  return isDisabled;
};
