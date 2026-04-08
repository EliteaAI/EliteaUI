import { useCallback, useEffect } from 'react';

import { useUpdateParticipantSettingsMutation } from '@/api/chat';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const useChangeParticipantSettings = ({
  setActiveConversation,
  setConversations,
  activeConversation,
  activeParticipant,
  setActiveParticipant,
  toastError,
}) => {
  const projectId = useSelectedProjectId();
  const [updateParticipantSettings, { isError, error }] = useUpdateParticipantSettingsMutation();
  const onChangeParticipantSettings = useCallback(
    async (editedParticipant, hasBeenChanged) => {
      if (hasBeenChanged) {
        let success = true;
        if (!activeConversation?.isNew) {
          const { id, entity_settings } = editedParticipant;
          const result = await updateParticipantSettings({
            projectId,
            conversationId: activeConversation?.id,
            participantId: id,
            ...entity_settings,
          });
          success = !result.error;
        }

        if (success) {
          setActiveConversation(prev => ({
            ...prev,
            participants: prev.participants.map(participant => {
              if (participant.id == editedParticipant.id) {
                return editedParticipant;
              }
              return participant;
            }),
          }));
          setConversations(prev => {
            return prev.map(conversation =>
              !conversation.isPlayback && conversation.id === activeConversation?.id
                ? {
                    ...activeConversation,
                    participants: activeConversation?.participants?.map(participant => {
                      if (participant.id == editedParticipant.id) {
                        return editedParticipant;
                      }
                      return participant;
                    }),
                  }
                : conversation,
            );
          });
          if (activeParticipant?.id == editedParticipant.id) {
            setActiveParticipant(editedParticipant);
          }
        }
      }
    },
    [
      projectId,
      activeConversation,
      updateParticipantSettings,
      activeParticipant,
      setActiveConversation,
      setConversations,
      setActiveParticipant,
    ],
  );

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return {
    onChangeParticipantSettings,
  };
};

export default useChangeParticipantSettings;
