/**
 * useTracing - React hook for tracing
 *
 * Provides easy-to-use tracing functions for React components.
 */
import { useCallback, useRef } from 'react';

import { traceService } from './TraceService';

/**
 * Hook for tracing in React components
 *
 * @example
 * const { startTrace, startSpan, endSpan, endTrace, traceId } = useTracing();
 *
 * const handleClick = () => {
 *   const id = startTrace('button_click', { button: 'submit' });
 *   startSpan('api_call');
 *   // ... do work ...
 *   endSpan('api_call', { status: 'success' });
 *   endTrace({ result: 'completed' });
 * };
 */
export const useTracing = () => {
  const activeTraceRef = useRef(null);

  /**
   * Start a new trace
   */
  const startTrace = useCallback((name, metadata = {}) => {
    const traceId = traceService.startTrace(name, metadata);
    activeTraceRef.current = traceId;
    return traceId;
  }, []);

  /**
   * Start a span in the active trace
   */
  const startSpan = useCallback((name, metadata = {}) => {
    if (!activeTraceRef.current) return null;
    return traceService.startSpan(activeTraceRef.current, name, metadata);
  }, []);

  /**
   * End a span by ID
   */
  const endSpan = useCallback((spanIdOrName, metadata = {}) => {
    if (!activeTraceRef.current) return;

    // Try to end by name first (more convenient)
    traceService.endSpanByName(activeTraceRef.current, spanIdOrName, metadata);
  }, []);

  /**
   * End the active trace
   */
  const endTrace = useCallback((metadata = {}) => {
    if (!activeTraceRef.current) return;
    traceService.endTrace(activeTraceRef.current, metadata);
    activeTraceRef.current = null;
  }, []);

  /**
   * Get the current trace ID
   */
  const getTraceId = useCallback(() => {
    return activeTraceRef.current;
  }, []);

  /**
   * Execute a function with automatic span tracking
   */
  const withSpan = useCallback(
    async (name, fn, metadata = {}) => {
      startSpan(name, metadata);
      try {
        const result = await fn();
        endSpan(name, { status: 'success' });
        return result;
      } catch (error) {
        endSpan(name, { status: 'error', error: error.message });
        throw error;
      }
    },
    [startSpan, endSpan],
  );

  return {
    startTrace,
    startSpan,
    endSpan,
    endTrace,
    getTraceId,
    withSpan,
    traceId: activeTraceRef.current,
    isEnabled: traceService.isEnabled(),
  };
};

/**
 * Higher-order function to wrap an async function with tracing
 *
 * @example
 * const tracedFetch = withTracing('api_fetch', async () => {
 *   return fetch('/api/data');
 * });
 */
export const withTracing = (name, fn, metadata = {}) => {
  return async (...args) => {
    if (!traceService.isEnabled()) {
      return fn(...args);
    }

    const traceId = traceService.startTrace(name, metadata);
    traceService.startSpan(traceId, 'execution');

    try {
      const result = await fn(...args);
      traceService.endSpanByName(traceId, 'execution', { status: 'success' });
      traceService.endTrace(traceId, { status: 'success' });
      return result;
    } catch (error) {
      traceService.endSpanByName(traceId, 'execution', { status: 'error', error: error.message });
      traceService.endTrace(traceId, { status: 'error', error: error.message });
      throw error;
    }
  };
};

export default useTracing;
