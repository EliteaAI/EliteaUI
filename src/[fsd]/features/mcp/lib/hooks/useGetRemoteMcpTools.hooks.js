import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useMcpAuthModal } from '@/[fsd]/features/mcp/lib/hooks/useMcpAuthModal.hooks';
import { useMcpSyncToolsMutation } from '@/api/toolkits';
import SocketContext from '@/contexts/SocketContext';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

/**
 * Hook for fetching MCP tools with OAuth support.
 * Works with both remote MCPs (using serverUrl) and pre-built MCPs (using toolkitType).
 * Uses the mcp_sync_tools endpoint for both cases.
 */
export const useGetRemoteMcpTools = ({ values, toolkitType, onToolsFetched }) => {
  const projectId = useSelectedProjectId();
  const [isLoading, setIsLoading] = useState(false);
  const socket = useContext(SocketContext);

  const onToolsFetchedRef = useRef(onToolsFetched);
  const pendingRetryRef = useRef(false);

  const { toastError, toastSuccess } = useToast();

  const [mcpSyncTools] = useMcpSyncToolsMutation();

  // Check if this is a pre-built MCP (e.g., mcp_github)
  const isPrebuildMcp = useMemo(
    () => McpAuthHelpers.isPrebuildMcpType(toolkitType || values?.type),
    [toolkitType, values?.type],
  );

  // For pre-built MCPs, use toolkitType; for remote MCPs, use URL
  const effectiveToolkitType = toolkitType || values?.type;

  useEffect(() => {
    onToolsFetchedRef.current = onToolsFetched;
  }, [onToolsFetched]);

  const onAuthSuccess = useCallback(() => {
    pendingRetryRef.current = true;
  }, []);

  // Create values object with toolkitType for useMcpAuthModal
  // This ensures the modal stores tokens under the correct key
  const valuesWithType = useMemo(
    () => ({
      ...values,
      type: effectiveToolkitType,
    }),
    [values, effectiveToolkitType],
  );

  const { handleMcpAuthRequired, getModalProps, showModal } = useMcpAuthModal({
    onSuccess: onAuthSuccess,
    values: valuesWithType,
  });

  const executeFetch = useCallback(async () => {
    if (isLoading) return;

    const serverUrl = values?.settings?.url;

    // For remote MCPs, serverUrl is required
    // For pre-built MCPs, serverUrl is optional (backend resolves it from toolkit_type)
    if (!serverUrl && !isPrebuildMcp) {
      toastError('MCP server URL is required');
      return;
    }

    if (isPrebuildMcp && !effectiveToolkitType) {
      toastError('Toolkit type is required for pre-built MCP');
      return;
    }

    setIsLoading(true);

    try {
      // Get all OAuth tokens (the API will use the appropriate one)
      const mcpTokens = McpAuthHelpers.getAllTokens();

      const response = await mcpSyncTools({
        projectId,
        url: serverUrl, // May be undefined for pre-built MCPs
        headers: values?.settings?.headers,
        timeout: values?.settings?.timeout || 60,
        mcp_tokens: Object.keys(mcpTokens).length > 0 ? mcpTokens : undefined,
        sid: socket?.id,
        ssl_verify: values?.settings?.ssl_verify,
        toolkit_type: isPrebuildMcp ? effectiveToolkitType : undefined, // Pass toolkit_type for pre-built MCPs
      }).unwrap();

      // Check if the response contains the result (for awaited responses)
      const result = response?.result || response;

      // Check if authorization is required
      if (result?.requires_authorization) {
        // Handle OAuth requirement
        handleMcpAuthRequired({
          type: 'mcp_authorization_required',
          response_metadata: result.response_metadata || {},
          content: result.error,
        });
        return;
      }

      // Check for success
      if (result?.success && result?.tools) {
        // Pass both tools array and args_schemas object (if present) for proper schema mapping
        onToolsFetchedRef.current?.(result.tools, result.args_schemas);

        // Mark as connected
        if (isPrebuildMcp) {
          McpAuthHelpers.setConnectionVerified(null, effectiveToolkitType);
        } else if (serverUrl) {
          McpAuthHelpers.setConnectionVerified(serverUrl);
        }

        toastSuccess(`Successfully fetched ${result.tools.length} tools`);
      } else if (result?.success === false && result?.error) {
        // Handle explicit failure response from server
        // Parse common error patterns for user-friendly messages
        let errorMessage = result.error;
        if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          errorMessage =
            'Access denied. The OAuth token may have insufficient permissions or the server rejected the request. Please try re-authorizing with the correct scopes.';
        } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          errorMessage = 'Authorization failed. Please try logging in again.';
        }
        toastError(errorMessage);
      } else if (result?.error) {
        toastError(result.error);
      } else {
        toastError('Failed to fetch tools: Unknown response format');
      }
    } catch (error) {
      const errorMessage = error?.data?.error || error?.message || 'Failed to fetch tools';

      // Check if the error response contains authorization requirement
      if (error?.data?.requires_authorization || error?.data?.response_metadata?.server_url) {
        handleMcpAuthRequired({
          type: 'mcp_authorization_required',
          response_metadata: error.data.response_metadata || {},
          content: error.data.error,
        });
        return;
      }

      toastError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    values,
    projectId,
    mcpSyncTools,
    handleMcpAuthRequired,
    toastError,
    toastSuccess,
    socket,
    isPrebuildMcp,
    effectiveToolkitType,
  ]);

  useEffect(() => {
    if (!showModal && pendingRetryRef.current) {
      pendingRetryRef.current = false;
      setTimeout(executeFetch, 500);
    }
  }, [showModal, executeFetch]);

  const fetchTools = useCallback(() => {
    const serverUrl = values?.settings?.url;

    // For remote MCPs, serverUrl is required
    // For pre-built MCPs, serverUrl is optional
    if (!serverUrl && !isPrebuildMcp) {
      toastError('MCP server URL is required');
      return;
    }
    executeFetch();
  }, [values?.settings?.url, isPrebuildMcp, executeFetch, toastError]);

  return { fetchTools, isLoading, getModalProps };
};
