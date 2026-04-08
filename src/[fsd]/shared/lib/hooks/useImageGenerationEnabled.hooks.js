import { useEffect, useState } from 'react';

import { useLazySecretShowQuery, useSecretsListQuery } from '@/api/secrets';

/**
 * Hook to check if image generation is enabled via project secrets
 * @param {number|string} projectId - The project ID
 * @returns {boolean} - True if enable_image_generation secret is set to 'true', false otherwise
 */
export const useImageGenerationEnabled = projectId => {
  const [isEnabled, setIsEnabled] = useState(false);

  const { data: secrets = [] } = useSecretsListQuery(projectId, {
    skip: !projectId,
  });

  const [showSecret] = useLazySecretShowQuery();

  useEffect(() => {
    const checkImageGenerationSecret = async () => {
      const imageGenerationSecret = secrets.find(secret => secret.name === 'enable_image_generation');

      if (!imageGenerationSecret) {
        setIsEnabled(false);
        return;
      }

      try {
        const { data, error } = await showSecret({
          projectId,
          name: 'enable_image_generation',
        });

        if (error) {
          setIsEnabled(false);
          return;
        }

        const secretValue = data?.value || '';
        const isImageGenerationEnabled = secretValue.toLowerCase() === 'true';
        setIsEnabled(isImageGenerationEnabled);
      } catch {
        setIsEnabled(false);
      }
    };

    if (projectId && secrets.length > 0) {
      checkImageGenerationSecret();
    } else {
      setIsEnabled(false);
    }
  }, [secrets, projectId, showSecret]);

  return isEnabled;
};
