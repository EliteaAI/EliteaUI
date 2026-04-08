import { useCallback } from 'react';

const useRemoteParticipantUpdate = ({
  setActiveConversation,
  setConversations,
  activeConversation,
  activeParticipant,
  setActiveParticipant,
}) => {
  const onRemoteUpdateParticipant = useCallback(
    async participant => {
      setActiveConversation(prev => {
        const foundParticipant = prev.participants?.find(item => item.id === participant.id);
        return {
          ...prev,
          participants: foundParticipant
            ? prev.participants.map(item => (item.id === participant.id ? participant : item))
            : [...prev.participants, participant],
        };
      });
      if (activeParticipant?.id === participant.id) {
        setActiveParticipant(participant);
      }
      setConversations(prev => {
        return prev.map(conversation => {
          if (conversation.id === activeConversation?.id) {
            const foundParticipant = conversation.participants?.find(item => item.id === participant.id);
            return {
              ...conversation,
              participants: foundParticipant
                ? conversation.participants.map(item => (item.id === participant.id ? participant : item))
                : [...(conversation.participants || []), participant],
            };
          }
          return conversation;
        });
      });
    },
    [activeConversation, activeParticipant, setActiveConversation, setActiveParticipant, setConversations],
  );

  return {
    onRemoteUpdateParticipant,
  };
};

export default useRemoteParticipantUpdate;
