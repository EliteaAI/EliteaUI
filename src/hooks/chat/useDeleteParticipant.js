import { useCallback, useEffect } from 'react';

import { useDeleteParticipantFromConversationMutation } from '@/api/chat';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import useLocalActiveParticipant from './useLocalActiveParticipant';

const useDeleteParticipant = ({
  setActiveConversation,
  setConversations,
  activeConversation,
  activeParticipant,
  setActiveParticipant,
  toastError,
  newConversationViewRef,
}) => {
  const projectId = useSelectedProjectId();
  const [deleteParticipant, { isError, error }] = useDeleteParticipantFromConversationMutation();
  const { clearLocalActiveParticipant } = useLocalActiveParticipant();
  const onDeleteParticipant = useCallback(
    async participantToDel => {
      // Check if conversation is in temporary state (isNew flag)
      // If so, handle participant deletion locally without API call
      if (activeConversation?.isNew || !activeConversation?.id) {
        // Handle temporary conversation state - no API call needed
        setActiveConversation(prev => {
          return {
            ...prev,
            participants: prev.participants.filter(
              participant =>
                participant.entity_name !== participantToDel.entity_name ||
                participant.entity_meta.id !== participantToDel.entity_meta.id,
            ),
          };
        });
        setConversations(prev => {
          return prev.map(conversation =>
            conversation.id === activeConversation?.id
              ? {
                  ...conversation,
                  participants: conversation?.participants?.filter(
                    participant =>
                      participant.entity_name !== participantToDel.entity_name ||
                      participant.entity_meta.id !== participantToDel.entity_meta.id,
                  ),
                }
              : conversation,
          );
        });
        if (activeParticipant?.id === participantToDel.id) {
          setActiveParticipant(null);
          clearLocalActiveParticipant(activeConversation?.id);
        }

        // Clear the selected participant from NewConversationView if it matches the deleted participant
        if (newConversationViewRef?.current?.onDeleteParticipant) {
          // We need to check if the deleted participant matches the currently selected one
          // Since we don't have direct access to selectedParticipant here, we'll clear it
          // This is safe because if they're deleting a participant, they likely want to clear the selection
          newConversationViewRef.current.onDeleteParticipant(participantToDel);
        }

        return; // Exit early, no API call needed
      }

      // Handle existing conversation - make API call
      const result = await deleteParticipant({
        projectId,
        conversationId: activeConversation?.id,
        id: participantToDel.id,
      });
      if (!result.error) {
        setActiveConversation(prev => {
          return {
            ...prev,
            participants: prev.participants.filter(participant => participant.id !== participantToDel.id),
          };
        });
        setConversations(prev => {
          return prev.map(conversation =>
            conversation.id === activeConversation?.id
              ? {
                  ...conversation,
                  participants: conversation?.participants?.filter(
                    participant => participant.id !== participantToDel.id,
                  ),
                }
              : conversation,
          );
        });
        if (activeParticipant?.id === participantToDel.id) {
          setActiveParticipant(null);
          clearLocalActiveParticipant(activeConversation?.id);
        }
      }
    },
    [
      projectId,
      activeConversation,
      activeParticipant,
      setActiveConversation,
      setActiveParticipant,
      setConversations,
      deleteParticipant,
      clearLocalActiveParticipant,
      newConversationViewRef,
    ],
  );

  const onRemoteDeleteParticipant = useCallback(
    async (conversation_id, participant_id) => {
      if (conversation_id === activeConversation?.id) {
        setActiveConversation(prev => {
          return {
            ...prev,
            participants: prev.participants.filter(participant => participant.id !== participant_id),
          };
        });
        if (activeParticipant?.id === participant_id) {
          setActiveParticipant(null);
          clearLocalActiveParticipant(conversation_id);
        }
      }
      setConversations(prev => {
        return prev.map(conversation =>
          conversation.id === conversation_id
            ? {
                ...conversation,
                participants: conversation.participants?.filter(
                  participant => participant.id !== participant_id,
                ),
              }
            : conversation,
        );
      });
    },
    [
      activeConversation,
      activeParticipant,
      setActiveConversation,
      setActiveParticipant,
      setConversations,
      clearLocalActiveParticipant,
    ],
  );

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return {
    onDeleteParticipant,
    onRemoteDeleteParticipant,
  };
};

export default useDeleteParticipant;
