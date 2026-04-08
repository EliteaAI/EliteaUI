import { useCallback, useState } from 'react';

import { useTestConfigurationConnectionMutation } from '@/api/configurations';

export const useSharepointCheckConnection = ({ projectId, spConfig, onSuccess }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testConnection] = useTestConfigurationConnectionMutation();

  const runCheck = useCallback(
    async (handleConfigAuthRequired, tokenStorageKey) => {
      if (isRunning || !spConfig || !projectId) return;
      setIsRunning(true);
      try {
        await testConnection({
          projectId,
          configType: 'sharepoint',
          body: spConfig,
        }).unwrap();
        // Success — invoke optional callback (e.g. to call setConnectionVerified for non-delegated toolkits)
        onSuccess?.();
      } catch (error) {
        if (error?.status === 401 && error?.data?.requires_authorization) {
          const discoveryEndpoint = spConfig?.oauth_discovery_endpoint;
          // Call handleConfigAuthRequired matching useConfigOAuthModal's signature:
          //   handleConfigAuthRequired(errorData, serverUrlOverride, tokenStorageKeyOverride)
          // Pass discoveryEndpoint as the display URL and tokenStorageKey (composite key) as
          // the storage key so the token lands where get_toolkit() will look for it.
          handleConfigAuthRequired?.(error.data, discoveryEndpoint, tokenStorageKey || discoveryEndpoint);
        }
        // Other errors (network, 400, etc.) are silently ignored here.
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning, spConfig, projectId, testConnection, onSuccess],
  );

  return { runCheck, isRunning };
};
