import { useCallback, useContext, useEffect } from 'react';

import SocketContext from '@/contexts/SocketContext';
import { generateTraceId } from '@/services/tracing';

// Check if tracing is enabled
const TRACING_ENABLED = import.meta.env.VITE_TRACING_ENABLED === 'true';

export const useManualSocket = (event, responseHandler) => {
  const socket = useContext(SocketContext);

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

      return !!socket?.emit(event, enrichedPayload);
    },
    [socket, event, reconnect],
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
