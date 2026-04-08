import { useCallback, useMemo } from 'react';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useMcpAuthCheck, useMcpAuthModal, useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';

export const useMcpLogin = ({ values, onSuccess, authConfig }) => {
  const { id, type: toolkitType, settings: { url, client_id, client_secret, scopes } = {} } = values ?? {};

  // Check if this is a pre-built MCP type (e.g., mcp_github)
  const isPrebuildMcp = useMemo(() => McpAuthHelpers.isPrebuildMcpType(toolkitType), [toolkitType]);

  // Monitor token changes to update UI when logged out elsewhere.
  // authConfig.tokenOptions overrides default derivation for non-MCP toolkits (e.g. SharePoint).
  const { isLoggedIn } = useMcpTokenChange(
    authConfig?.tokenOptions ?? (isPrebuildMcp ? { toolkitType } : { serverUrl: url }),
  );

  // Handle successful connection test (for header-based auth servers without OAuth)
  const handleConnectionSuccess = useCallback(() => {
    // Mark server/toolkit as "connection verified" so UI updates
    if (isPrebuildMcp) {
      McpAuthHelpers.setConnectionVerified(null, toolkitType);
    } else if (url) {
      McpAuthHelpers.setConnectionVerified(url);
    }
    onSuccess?.();
  }, [url, toolkitType, isPrebuildMcp, onSuccess]);

  const { handleMcpAuthRequired, getModalProps } = useMcpAuthModal({
    onSuccess,
    values,
  });

  const { runAuthCheck, isRunning } = useMcpAuthCheck({
    toolkitId: id,
    values,
    onMcpAuthRequired: handleMcpAuthRequired,
    onSuccess: handleConnectionSuccess,
  });

  const onLogin = useCallback(
    e => {
      e.stopPropagation();
      if (authConfig?.onLogin) {
        // Delegate to injected handler (e.g. SharePoint HTTP check_connection).
        // Pass handleMcpAuthRequired so the handler can open the OAuth modal on 401.
        authConfig.onLogin(handleMcpAuthRequired);
        return;
      }
      runAuthCheck('list_tools');
    },
    [authConfig, handleMcpAuthRequired, runAuthCheck],
  );

  // Stop mouse events from bubbling to parent containers
  const stopPropagation = useCallback(e => {
    e.stopPropagation();
  }, []);

  // Effective server URL for McpAuthModal: authConfig override takes priority.
  const effectiveServerUrl = authConfig?.serverUrl ?? url;

  return {
    isLoggedIn,
    isRunning: isRunning || !!authConfig?.isRunning,
    onLogin,
    stopPropagation,
    modalProps: {
      ...getModalProps(),
      serverUrl: effectiveServerUrl,
      tokenStorageKey: authConfig?.tokenStorageKey,
      formClientId: client_id,
      formClientSecret: client_secret,
      formScopes: scopes,
      // Pass toolkitType for pre-built MCPs
      toolkitType: isPrebuildMcp ? toolkitType : undefined,
    },
  };
};
