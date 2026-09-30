import { useCallback, useEffect, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { SocketMessageType, sioEvents } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useManualSocket } from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';

// Message types that indicate the operation has finished successfully
const SUCCESS_MESSAGE_TYPES = [
  SocketMessageType.AgentToolEnd,
  SocketMessageType.AgentResponse,
  SocketMessageType.AgentMessage,
  SocketMessageType.ToolResponseComplete,
  SocketMessageType.FullMessage,
];

// Message types that indicate an error
const ERROR_MESSAGE_TYPES = [
  SocketMessageType.AgentToolError,
  SocketMessageType.Error,
  SocketMessageType.AgentException,
];

const getConnectionSignature = (projectId, toolkitId, settings) =>
  JSON.stringify([projectId, toolkitId, settings?.url, settings?.headers || {}]);

export const useMcpAuthCheck = ({ toolkitId, values, onMcpAuthRequired, onSuccess }) => {
  const { toastError } = useToast();
  const projectId = useSelectedProjectId();
  const currentConnectionSignature = getConnectionSignature(
    projectId,
    toolkitId || values?.id,
    values?.settings,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const activeRef = useRef(false);
  const streamIdRef = useRef(null);
  const checkedSignatureRef = useRef(null);
  const currentSignatureRef = useRef(currentConnectionSignature);
  const silentRef = useRef(false);
  const unsubscribeRef = useRef(null);
  const onMcpAuthRequiredRef = useRef(onMcpAuthRequired);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onMcpAuthRequiredRef.current = onMcpAuthRequired;
  }, [onMcpAuthRequired]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    currentSignatureRef.current = currentConnectionSignature;
  }, [currentConnectionSignature]);

  const cleanupSession = useCallback(() => {
    activeRef.current = false;
    setIsRunning(false);
    setIsVerifying(false);
    unsubscribeRef.current?.();
    streamIdRef.current = null;
    checkedSignatureRef.current = null;
    silentRef.current = false;
  }, []);

  const handleSocketResponse = useCallback(
    message => {
      // Only process messages for our stream
      const messageStreamId = message?.stream_id;

      if (!streamIdRef.current || messageStreamId !== streamIdRef.current) {
        return;
      }

      if (checkedSignatureRef.current !== currentSignatureRef.current) {
        cleanupSession();
        return;
      }

      // Handle MCP authorization required
      if (message.type === SocketMessageType.McpAuthorizationRequired) {
        const silent = silentRef.current;
        cleanupSession();
        if (!silent) onMcpAuthRequiredRef.current?.(message);
        return;
      }

      // Handle successful completion
      if (SUCCESS_MESSAGE_TYPES.includes(message.type)) {
        cleanupSession();
        onSuccessRef.current?.(message);
        return;
      }

      // Handle error completion
      if (ERROR_MESSAGE_TYPES.includes(message.type)) {
        if (!silentRef.current && message.content) {
          toastError(message.content);
        }
        cleanupSession();
      }
    },
    [cleanupSession, toastError],
  );

  // Use the new test_mcp_connection event instead of chat_predict
  const {
    emit: socketEmit,
    subscribe: subscribeSocket,
    unsubscribe: unsubscribeSocket,
  } = useManualSocket(sioEvents.test_mcp_connection, handleSocketResponse);

  useEffect(() => {
    unsubscribeRef.current = unsubscribeSocket;
  }, [unsubscribeSocket]);

  useEffect(() => {
    return () => unsubscribeRef.current?.();
  }, []);

  const runAuthCheck = useCallback(
    async ({ silent = false } = {}) => {
      if (activeRef.current) {
        if (checkedSignatureRef.current !== currentConnectionSignature) {
          // A reused card or edited configuration needs a fresh test.
          cleanupSession();
        } else if (!silent && silentRef.current) {
          // A click adopts the matching background check without a second request.
          silentRef.current = false;
          setIsVerifying(false);
          setIsRunning(true);
          return;
        } else {
          return;
        }
      }

      activeRef.current = true;
      silentRef.current = silent;
      setIsVerifying(silent);
      setIsRunning(!silent);

      try {
        // Generate unique IDs for tracking
        const streamId = uuidv4();
        const messageId = uuidv4();
        streamIdRef.current = streamId;

        // Build toolkit config for MCP connection test
        // values contains the full toolkit object with settings nested inside
        const toolkitConfig = {
          toolkit_id: toolkitId || values?.id,
          toolkit_name: values?.toolkit_name || values?.name || `mcp_toolkit_${toolkitId}`,
          type: values?.type || 'mcp',
          settings: values?.settings || {
            url: values?.url,
            headers: values?.headers,
            session_id: values?.session_id,
          },
        };
        checkedSignatureRef.current = currentConnectionSignature;

        subscribeSocket();

        // Emit to test_mcp_connection endpoint
        // This uses protocol-level list_tools (tools/list JSON-RPC method)
        // instead of trying to execute a tool named 'list_tools'
        socketEmit({
          stream_id: streamId,
          message_id: messageId,
          project_id: projectId,
          toolkit_config: toolkitConfig,
          mcp_tokens: McpAuthHelpers.getAllTokens(),
        });
      } catch (error) {
        cleanupSession();
        if (!silent) {
          // eslint-disable-next-line no-console
          console.error('MCP auth check failed:', error);
        }
      }
    },
    [toolkitId, projectId, values, currentConnectionSignature, subscribeSocket, socketEmit, cleanupSession],
  );

  const currentCheckIsActive = checkedSignatureRef.current === currentConnectionSignature;
  return {
    runAuthCheck,
    isRunning: isRunning && currentCheckIsActive,
    isVerifying: isVerifying && currentCheckIsActive,
  };
};
