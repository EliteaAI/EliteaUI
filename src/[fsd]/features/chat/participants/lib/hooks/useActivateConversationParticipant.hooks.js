import { useCallback } from 'react';

import { getChatParticipantUniqueId } from '../helpers/participants.helpers';

export const useActivateConversationParticipant = props => {
  const { activeConversationIdRef, setActiveParticipant, setLocalActiveParticipant } = props;

  const activateParticipant = useCallback(
    (conversationId, participant) => {
      if (conversationId && setLocalActiveParticipant) {
        setLocalActiveParticipant(conversationId, getChatParticipantUniqueId(participant));
      }
      if (activeConversationIdRef.current === conversationId) {
        setActiveParticipant(participant);
      }
    },
    [activeConversationIdRef, setActiveParticipant, setLocalActiveParticipant],
  );

  return { activateParticipant };
};
