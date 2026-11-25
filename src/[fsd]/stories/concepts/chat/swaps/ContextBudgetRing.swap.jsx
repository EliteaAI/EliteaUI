// Switch for the context ring that ContextBudgetInfo draws (Storybook only, see .storybook/main.js): the team's ring, or
// the concept ring that sits in the input field.
import { memo } from 'react';

import ContextBudgetRing from '@/[fsd]/widgets/context-budget/ui/ContextBudgetRing';

import ConceptContextRing from '../ConceptContextRing';
import { useConceptSwap } from '../conceptSwap.hooks';

const ContextBudgetRingSwap = memo(props => {
  const { contextRing } = useConceptSwap();
  const Ring = contextRing ? ConceptContextRing : ContextBudgetRing;
  return <Ring {...props} />;
});

ContextBudgetRingSwap.displayName = 'ContextBudgetRingSwap';

export default ContextBudgetRingSwap;
