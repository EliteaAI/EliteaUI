import { useCallback } from 'react';

import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useUpdateContextStrategyMutation } from '@/api';

/**
 * Quick Balanced / Full switch for one conversation, applied optimistically and rolled back on error.
 */
export const useContextWindowSwitch = ({ conversationId, contextStrategy, setActiveConversation }) => {
  const selectedProjectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [updateContextStrategy, { isLoading }] = useUpdateContextStrategyMutation();

  const applyStrategy = useCallback(
    strategy =>
      setActiveConversation?.(prev => ({
        ...prev,
        meta: { ...(prev?.meta || {}), context_strategy: strategy },
      })),
    [setActiveConversation],
  );

  const switchMode = useCallback(
    async mode => {
      const previous = contextStrategy || {};
      applyStrategy({ ...previous, context_window_mode: mode });
      try {
        const result = await updateContextStrategy({
          projectId: selectedProjectId,
          conversationId,
          context_window_mode: mode,
        }).unwrap();
        if (result?.updated_strategy) applyStrategy(result.updated_strategy);
      } catch (error) {
        applyStrategy(previous);
        toastError(error?.data?.error || 'Failed to change the context window');
      }
    },
    [contextStrategy, applyStrategy, updateContextStrategy, selectedProjectId, conversationId, toastError],
  );

  return { switchMode, isSwitching: isLoading };
};
