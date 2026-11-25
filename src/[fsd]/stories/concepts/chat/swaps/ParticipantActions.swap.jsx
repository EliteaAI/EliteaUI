// Switch for the actions of a participant row (imported by ParticipantNormalCard and ParticipantAttentionCard in
// Storybook, see .storybook/main.js): the team's ParticipantActions, or the concept's when the row sits in the
// «who answers» list — the right Participants panel keeps the team's.
import { memo } from 'react';

import ParticipantActions from '@/[fsd]/features/chat/participants/ui/participant-actions/ParticipantActions';

import ConceptParticipantActions from '../ConceptParticipantActions';
import { useConceptSwap } from '../ConceptSwapContext';
import { useWhoAnswers } from '../WhoAnswersContext';

const ParticipantActionsSwap = memo(props => {
  const { whoAnswers } = useConceptSwap();
  const { inList } = useWhoAnswers();
  const Actions = whoAnswers && inList ? ConceptParticipantActions : ParticipantActions;
  return <Actions {...props} />;
});

ParticipantActionsSwap.displayName = 'ParticipantActionsSwap';

export default ParticipantActionsSwap;
