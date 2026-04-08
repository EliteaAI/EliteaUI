import { useCallback } from 'react';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { ChatParticipantType } from '@/common/constants';

/**
 * Custom hook for managing toolkit creation workflow in chat
 * Handles the toolkit creation completion and participant addition
 */
const useToolkitCreation = ({
  // Toolkit editor functions
  onToolkitEditorCreated,

  // Participant management
  addNewParticipants,
}) => {
  const trackEvent = useTrackEvent();
  // Transform API response to toolkit participant format for chat context and handle auto-activation
  const onToolkitCreated = useCallback(
    async result => {
      if (!result) return;

      const isMCP = result.is_mcp || false;
      trackEvent(isMCP ? GA_EVENT_NAMES.MCP_CREATED_FROM_CHAT : GA_EVENT_NAMES.TOOLKIT_CREATED_FROM_CHAT, {
        [GA_EVENT_PARAMS.ENTITY]: isMCP ? 'mcp' : 'toolkit',
        [GA_EVENT_PARAMS.TOOLKIT_NAME]: result.name,
        [GA_EVENT_PARAMS.TOOLKIT_TYPE]: result.type,
        [GA_EVENT_PARAMS.CREATION_SOURCE]: 'chat_canvas',
        [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
      });

      // Transform the created toolkit into participant format for the editor
      const toolkitAsParticipant = {
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
          mcp: result.is_mcp || false,
        },
        name: result.name,
      };

      // First, handle the editor's creation workflow (switch to edit mode, etc.)
      onToolkitEditorCreated(toolkitAsParticipant);

      // Transform the created toolkit to participant format
      const createdToolkit = {
        participantType: ChatParticipantType.Toolkits,
        ...result,
      };

      // Add the toolkit to the conversation participants
      // Note: Toolkits are not set as active participants since they are tools, not conversational entities
      // They will be available in the toolkit dropdown for use but won't be selected as active
      await addNewParticipants([createdToolkit]);
    },
    [addNewParticipants, onToolkitEditorCreated, trackEvent],
  );

  return {
    onToolkitCreated,
  };
};

export default useToolkitCreation;
