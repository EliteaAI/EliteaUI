import { useMemo } from 'react';

import { getStartersLimitState } from '../helpers/conversationStarters.helpers';
import { useConversationStartersLimit } from './useConversationStartersLimit.hooks';

// One add rule for every starters editor (main editor, Generate Agent, Edit with AI), so the counter and
// the "+ Starter" state can't drift apart between screens
export const useConversationStartersAddGate = ({ count, hasBlank = false }) => {
  const maxStarters = useConversationStartersLimit();

  return useMemo(() => {
    const { isOverLimit, canAdd, addTooltip } = getStartersLimitState({ count, max: maxStarters });
    return { maxStarters, isOverLimit, disableAdd: !canAdd || hasBlank, addTooltip };
  }, [count, hasBlank, maxStarters]);
};
