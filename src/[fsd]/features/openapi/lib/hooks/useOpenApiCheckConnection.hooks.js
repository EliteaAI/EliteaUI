import { useCallback, useState } from 'react';

import { useTestConfigurationConnectionMutation } from '@/api/configurations';

export const useOpenApiCheckConnection = ({ projectId, settings, onSuccess }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testConnection] = useTestConfigurationConnectionMutation();

  const runCheck = useCallback(
    async (handleConfigAuthRequired, tokenStorageKey) => {
      if (isRunning || !settings || !projectId) return;
      setIsRunning(true);
      try {
        await testConnection({
          projectId,
          configType: 'openapi',
          body: settings,
        }).unwrap();
        onSuccess?.();
      } catch (error) {
        if (error?.status === 401 && error?.data?.requires_authorization) {
          const discoveryEndpoint = settings?.oauth_discovery_endpoint;
          handleConfigAuthRequired?.(error.data, discoveryEndpoint, tokenStorageKey || discoveryEndpoint);
        }
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, settings, projectId, testConnection, onSuccess],
  );

  return { runCheck, isRunning };
};
