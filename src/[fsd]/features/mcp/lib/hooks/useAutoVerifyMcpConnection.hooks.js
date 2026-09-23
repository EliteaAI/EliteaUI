import { useEffect, useRef } from 'react';

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
  const automaticallyCheckedRef = useRef(false);
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
      automaticallyCheckedRef.current
    ) {
      return;
    }

    if (isLoggedIn || isRunning) {
      automaticallyCheckedRef.current = true;
      return;
    }
    if (patInvalid) return;

    // Keep this mount from retrying after the session claim expires while
    // an editor is changing its unsaved header values.
    automaticallyCheckedRef.current = true;
    if (McpAuthHelpers.claimAutomaticHeaderCheck(projectId, id, url)) {
      runAuthCheck({ silent: true });
    }
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
