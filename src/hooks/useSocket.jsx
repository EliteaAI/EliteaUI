import { useCallback, useContext, useEffect } from 'react';

import { ReactReduxContext } from 'react-redux';

import { SocketSessionGateHelpers } from '@/[fsd]/features/auth/lib/helpers';
import { SocketContext } from '@/[fsd]/shared/lib/context';
import { generateTraceId } from '@/services/tracing';

// Check if tracing is enabled
const TRACING_ENABLED = import.meta.env.VITE_TRACING_ENABLED === 'true';

export const useManualSocket = (event, responseHandler) => {
  const socket = useContext(SocketContext);
  // Read lazily at emit time: subscribing every socket hook to the store would re-render all of them
  const reduxContext = useContext(ReactReduxContext);

  const reconnect = useCallback(() => {
    socket && socket.disconnected && socket.connect();
  }, [socket]);

  const subscribe = useCallback(() => {
    reconnect();

    socket && responseHandler && socket.on(event, responseHandler);
  }, [event, responseHandler, socket, reconnect]);

  const unsubscribe = useCallback(() => {
    socket && socket.off(event, responseHandler);
  }, [event, responseHandler, socket]);

  const emit = useCallback(
    payload => {
      reconnect();

      // Add trace context to payload if tracing is enabled
      const enrichedPayload = TRACING_ENABLED
        ? {
            ...payload,
            _trace: {
              trace_id: generateTraceId(),
              timestamp: Date.now(),
              event,
            },
          }
        : payload;

      return SocketSessionGateHelpers.emitWithSessionGate({
        socket,
        event,
        payload: enrichedPayload,
        isSessionExpired: !!reduxContext?.store?.getState().settings?.sessionExpired,
      });
    },
    [socket, event, reconnect, reduxContext],
  );

  return {
    subscribe,
    unsubscribe,
    emit,
    socket,
  };
};

const useSocket = (event, responseHandler) => {
  const { subscribe, unsubscribe, emit, socket } = useManualSocket(event, responseHandler);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    emit,
    connected: socket?.connected || false,
  };
};

export default useSocket;
