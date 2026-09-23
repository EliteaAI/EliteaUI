import { useEffect } from 'react';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useAutoVerifyMcpConnection = ({
  values,
  enabled = true,
  authConfig,
  isLoggedIn,
  isRunning,
  patInvalid = false,
  runAuthCheck,
}) => {
  const projectId = useSelectedProjectId();
  const { id, type, settings: { url, headers } = {} } = values ?? {};
  const hasConfiguredHeaders = !!headers && Object.keys(headers).length > 0;

  useEffect(() => {
    if (
      !enabled ||
      authConfig ||
      !projectId ||
      !id ||
      type !== 'mcp' ||
      !url ||
      !hasConfiguredHeaders ||
      isLoggedIn ||
      isRunning ||
      patInvalid ||
      !McpAuthHelpers.claimAutomaticHeaderCheck(projectId, id, url)
    ) {
      return;
    }

    runAuthCheck({ silent: true });
  }, [
    enabled,
    authConfig,
    projectId,
    id,
    type,
    url,
    hasConfiguredHeaders,
    isLoggedIn,
    isRunning,
    patInvalid,
    runAuthCheck,
  ]);
};
