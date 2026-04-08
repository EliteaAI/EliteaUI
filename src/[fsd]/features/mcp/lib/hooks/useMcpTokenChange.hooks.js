import { useCallback, useEffect, useState } from 'react';

import { McpAuthConstants } from '@/[fsd]/features/mcp/lib/constants';
import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';

/**
 * Hook to monitor MCP token changes for a specific server or pre-built toolkit.
 * @param {string|Object} serverUrlOrOptions - Either a server URL string (legacy) or options object
 * @param {string} [serverUrlOrOptions.serverUrl] - The MCP server URL (for remote MCPs)
 * @param {string} [serverUrlOrOptions.toolkitType] - The toolkit type (for pre-built MCPs like mcp_github)
 * @returns {{ isLoggedIn: boolean, refreshLoginStatus: () => void }}
 */
export const useMcpTokenChange = serverUrlOrOptions => {
  // Support both legacy string argument and new object argument
  const options =
    typeof serverUrlOrOptions === 'string' ? { serverUrl: serverUrlOrOptions } : serverUrlOrOptions || {};

  const { serverUrl, toolkitType } = options;

  // Get the storage key based on serverUrl or toolkitType
  const storageKey = McpAuthHelpers.getStorageKey({ serverUrl, toolkitType });

  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    storageKey ? McpAuthHelpers.getAccessToken(serverUrl, toolkitType) !== null : false,
  );

  const refreshLoginStatus = useCallback(() => {
    if (storageKey) {
      setIsLoggedIn(McpAuthHelpers.getAccessToken(serverUrl, toolkitType) !== null);
    }
  }, [storageKey, serverUrl, toolkitType]);

  useEffect(() => {
    // Update login status when storageKey changes
    refreshLoginStatus();
  }, [refreshLoginStatus]);

  useEffect(() => {
    if (!storageKey) return;

    const handleTokenChange = event => {
      const { serverUrl: changedKey } = event.detail || {};
      // Only update if the changed key matches our monitored key
      if (changedKey === storageKey) {
        refreshLoginStatus();
      }
    };

    // Listen for token change events
    window.addEventListener(McpAuthConstants.MCP_TOKEN_CHANGE_EVENT, handleTokenChange);

    return () => {
      window.removeEventListener(McpAuthConstants.MCP_TOKEN_CHANGE_EVENT, handleTokenChange);
    };
  }, [storageKey, refreshLoginStatus]);

  return { isLoggedIn, refreshLoginStatus };
};
