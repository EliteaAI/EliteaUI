import { useCallback } from 'react';

import { useConversationEditMutation } from '@/api/chat';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

/**
 * Custom hook to update a conversation's updated_at timestamp on the backend
 * This ensures that date-based grouping persists correctly after page refresh
 */
const useUpdateConversationTimestamp = () => {
  const projectId = useSelectedProjectId();
  const [conversationEdit] = useConversationEditMutation();

  const updateConversationTimestamp = useCallback(
    async conversationId => {
      if (!conversationId || !projectId) return;

      try {
        // Call the backend API to update the conversation's updated_at field
        // We're just sending an empty body to trigger the backend to update the timestamp
        await conversationEdit({
          projectId,
          id: conversationId,
          // Sending minimal data to trigger an update - the backend should update updated_at automatically
          _timestamp_update: new Date().toISOString(),
        });
      } catch {
        // Silently fail - this is a background operation to improve UX
        // The main chat functionality should not be affected if this fails
      }
    },
    [conversationEdit, projectId],
  );

  return { updateConversationTimestamp };
};

export default useUpdateConversationTimestamp;
