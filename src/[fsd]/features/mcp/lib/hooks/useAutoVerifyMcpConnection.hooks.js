import { useEffect, useRef } from 'react';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useAutoVerifyMcpConnection = ({
  values,
  enabled = true,
  authConfig,
  isRunning,
  patInvalid = false,
  runAuthCheck,
}) => {
  const projectId = useSelectedProjectId();
  const automaticallyCheckedRef = useRef(null);
  const { id, type, settings: { url, headers } = {} } = values ?? {};
  const hasConfiguredHeaders = !!headers && Object.keys(headers).length > 0;
  const toolkitKey = id && url ? `${projectId}:${id}:${url}` : null;

  useEffect(() => {
    if (
      !enabled ||
      authConfig ||
      !projectId ||
      type !== 'mcp' ||
      !toolkitKey ||
      !hasConfiguredHeaders ||
      automaticallyCheckedRef.current === toolkitKey
    ) {
      return;
    }

    // A reused card may still expose the previous server's login state for this render.
    if (McpAuthHelpers.getAccessToken(url) !== null || isRunning) {
      automaticallyCheckedRef.current = toolkitKey;
      return;
    }
    if (patInvalid) return;

    // Keep this mount from retrying after the session claim expires while
    // an editor is changing its unsaved header values.
    automaticallyCheckedRef.current = toolkitKey;
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
    toolkitKey,
    hasConfiguredHeaders,
    isRunning,
    patInvalid,
    runAuthCheck,
  ]);
};
