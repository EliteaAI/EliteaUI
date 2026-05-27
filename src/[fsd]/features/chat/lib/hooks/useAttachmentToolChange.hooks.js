import { useCallback } from 'react';

/**
 * Hook to handle attachment tool changes in chat context.
 * Refetches participant details when the active participant's attachment settings change.
 */
export const useAttachmentToolChange = ({ activeParticipant, refetchParticipantDetails }) => {
  const handleAttachmentToolChange = useCallback(
    async participantId => {
      // The chat editor callback for the pipeline path passes the entity id,
      // which corresponds to activeParticipant.entity_meta.id — NOT activeParticipant.id
      // (the latter is the conversation participant row id and never matches).
      const activeEntityId = activeParticipant?.entity_meta?.id;
      if (!activeEntityId || activeEntityId !== participantId) {
        return;
      }

      await refetchParticipantDetails?.();
    },
    [activeParticipant?.entity_meta?.id, refetchParticipantDetails],
  );

  return { handleAttachmentToolChange };
};
