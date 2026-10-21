import { useCallback, useEffect, useRef } from 'react';

import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useUpdateContextStrategyMutation } from '@/api';

/**
 * Quick Balanced / Full switch for one conversation, applied optimistically and rolled back on error.
 * With rapid switches only the latest request settles the state; a failure restores the strategy
 * from before the first pending switch.
 */
export const useContextWindowSwitch = ({ conversationId, contextStrategy, setActiveConversation }) => {
  const selectedProjectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [updateContextStrategy, { isLoading }] = useUpdateContextStrategyMutation();

  const strategyRef = useRef(contextStrategy);
  const requestIdRef = useRef(0);
  const baselineRef = useRef(null);

  useEffect(() => {
    strategyRef.current = contextStrategy;
  }, [contextStrategy]);

  const applyStrategy = useCallback(
    strategy => {
      strategyRef.current = strategy;
      setActiveConversation?.(prev => ({
        ...prev,
        meta: { ...(prev?.meta || {}), context_strategy: strategy },
      }));
    },
    [setActiveConversation],
  );

  const switchMode = useCallback(
    async mode => {
      const requestId = ++requestIdRef.current;
      const current = strategyRef.current || {};
      if (baselineRef.current === null) baselineRef.current = current;
      applyStrategy({ ...current, context_window_mode: mode });
      try {
        const result = await updateContextStrategy({
          projectId: selectedProjectId,
          conversationId,
          context_window_mode: mode,
        }).unwrap();
        if (requestId !== requestIdRef.current) return;
        baselineRef.current = null;
        if (result?.updated_strategy) applyStrategy(result.updated_strategy);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        const baseline = baselineRef.current;
        baselineRef.current = null;
        applyStrategy(baseline);
        toastError(error?.data?.error || 'Failed to change the context window');
      }
    },
    [applyStrategy, updateContextStrategy, selectedProjectId, conversationId, toastError],
  );

  return { switchMode, isSwitching: isLoading };
};
