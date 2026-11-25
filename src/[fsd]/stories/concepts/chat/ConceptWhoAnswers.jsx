// Chat concept: «who answers» with the participants' details it reads (ParticipantDetailsProvider, as the right
// Participants panel has them); the button and its list are WhoAnswers.
import { memo } from 'react';

import { ParticipantDetailsProvider } from '@/[fsd]/features/chat/participants/lib/context/ParticipantDetailsContext';

import WhoAnswers from './WhoAnswers';

const ConceptWhoAnswers = memo(props => {
  const { participants = [] } = props;
  return (
    <ParticipantDetailsProvider participants={participants}>
      <WhoAnswers {...props} />
    </ParticipantDetailsProvider>
  );
});

ConceptWhoAnswers.displayName = 'ConceptWhoAnswers';

export default ConceptWhoAnswers;
