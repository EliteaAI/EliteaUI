import { useCallback } from 'react';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { ChatParticipantType } from '@/common/constants';

/**
 * Custom hook for managing agent creation workflow in chat
 * Handles the agent creation completion and participant addition
 */
const useAgentCreation = ({
  // Agent editor functions
  onAgentEditorCreated,

  // Participant management
  addNewParticipants,
  onSetActiveParticipant,
}) => {
  const trackEvent = useTrackEvent();
  // Transform API response to agent participant format for chat context and handle auto-activation
  const onAgentCreated = useCallback(
    async result => {
      if (!result) return;

      trackEvent(GA_EVENT_NAMES.AGENT_CREATED_FROM_CHAT, {
        [GA_EVENT_PARAMS.ENTITY]: 'agent',
        [GA_EVENT_PARAMS.AGENT_ID]: result.id,
        [GA_EVENT_PARAMS.CREATION_SOURCE]: 'chat_canvas',
        [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
        [GA_EVENT_PARAMS.AGENT_NAME]: result.name || 'unknown',
      });

      // Transform the created agent into participant format for the editor
      const agentAsParticipant = {
        entity_meta: {
          id: result.id,
          name: result.name,
          project_id: result.project_id,
        },
        entity_settings: {
          version_id: result.version_details?.id,
          variables: result.version_details?.variables || [],
          icon_meta: result.version_details?.meta?.icon_meta || null,
        },
        meta: {
          name: result.name,
        },
        name: result.name,
      };

      // First, handle the editor's creation workflow (switch to edit mode, etc.)
      onAgentEditorCreated(agentAsParticipant);

      // Transform the created agent to participant format
      const createdAgent = {
        participantType: ChatParticipantType.Applications,
        ...result,
      };

      try {
        // Add the agent to the conversation participants using callback pattern
        await addNewParticipants([createdAgent], addedParticipants => {
          // Auto-activate the newly created agent
          if (addedParticipants && addedParticipants.length > 0) {
            // Find our newly created agent in the added participants
            const addedAgent = addedParticipants.find(
              p => p.entity_name === ChatParticipantType.Applications && p.entity_meta?.id === result.id,
            );

            if (addedAgent) {
              // Set the newly created agent as active participant
              onSetActiveParticipant(addedAgent);
            }
          }
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error adding participant:', error);
      }
    },
    [addNewParticipants, onSetActiveParticipant, onAgentEditorCreated, trackEvent],
  );

  return {
    onAgentCreated,
  };
};

export default useAgentCreation;
