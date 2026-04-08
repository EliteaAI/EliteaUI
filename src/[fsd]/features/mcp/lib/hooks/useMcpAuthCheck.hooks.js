import { useCallback, useEffect, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

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

export const useMcpAuthCheck = ({ toolkitId, values, onMcpAuthRequired, onSuccess }) => {
  const { toastError } = useToast();
  const projectId = useSelectedProjectId();
  const [isRunning, setIsRunning] = useState(false);
  const streamIdRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const onMcpAuthRequiredRef = useRef(onMcpAuthRequired);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onMcpAuthRequiredRef.current = onMcpAuthRequired;
  }, [onMcpAuthRequired]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const cleanupSession = useCallback(() => {
    setIsRunning(false);
    unsubscribeRef.current?.();
    streamIdRef.current = null;
  }, []);

  const handleSocketResponse = useCallback(
    message => {
      // Only process messages for our stream
      const messageStreamId = message?.stream_id;

      if (streamIdRef.current && messageStreamId !== streamIdRef.current) {
        return;
      }

      // Handle MCP authorization required
      if (message.type === SocketMessageType.McpAuthorizationRequired) {
        cleanupSession();
        onMcpAuthRequiredRef.current?.(message);
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
        if (message.content) {
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

  const runAuthCheck = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);

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
        type: 'mcp',
        settings: values?.settings || {
          url: values?.url,
          headers: values?.headers,
          session_id: values?.session_id,
        },
      };

      subscribeSocket();

      // Emit to test_mcp_connection endpoint
      // This uses protocol-level list_tools (tools/list JSON-RPC method)
      // instead of trying to execute a tool named 'list_tools'
      socketEmit({
        stream_id: streamId,
        message_id: messageId,
        project_id: projectId,
        toolkit_config: toolkitConfig,
        mcp_tokens: values?.mcp_tokens || {},
      });
    } catch (error) {
      cleanupSession();
      // eslint-disable-next-line no-console
      console.error('MCP auth check failed:', error);
    }
  }, [isRunning, toolkitId, projectId, values, subscribeSocket, socketEmit, cleanupSession]);

  return { runAuthCheck, isRunning };
};
