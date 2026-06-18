import { useMemo } from 'react';

import { useSecretShowQuery, useSecretsListQuery } from '@/api/secrets';

const SECRET_NAME = 'enable_image_generation';

/**
 * Hook to check if image generation is enabled via project secrets
 * @param {number|string} projectId - The project ID
 * @returns {boolean} - True if enable_image_generation secret is set to 'true', false otherwise
 */
export const useImageGenerationEnabled = projectId => {
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
