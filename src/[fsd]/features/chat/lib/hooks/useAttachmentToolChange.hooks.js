import { useCallback } from 'react';

/**
 * Hook to handle attachment tool changes in chat context.
 * Refetches participant details when the active participant's attachment settings change.
 */
export const useAttachmentToolChange = ({ activeParticipant, refetchParticipantDetails }) => {
  const handleAttachmentToolChange = useCallback(
    async participantId => {
      // Only refetch if the changed participant is the currently active one
      if (!activeParticipant?.id || activeParticipant?.id !== participantId) {
        return;
      }

      // Refetch participant details to get updated attachment settings
      await refetchParticipantDetails?.();
    },
    [activeParticipant?.id, refetchParticipantDetails],
  );

  return { handleAttachmentToolChange };
};
