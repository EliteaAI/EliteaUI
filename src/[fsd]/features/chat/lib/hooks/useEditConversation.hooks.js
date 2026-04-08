import { useCallback } from 'react';

import { useConversationNavigation } from '@/[fsd]/features/chat/lib/hooks/useConversationNavigation.hooks';
import { useConversationEditMutation } from '@/api/chat';
import { areTheSameConversations, buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useEditConversation = ({
  activeConversation,
  setActiveConversation,
  setConversations,
  setFolders,
  toastError,
}) => {
  const projectId = useSelectedProjectId();
  const { changeUrlByConversation } = useConversationNavigation();
  const [editConversation] = useConversationEditMutation();

  const onEditConversation = useCallback(
    async conversation => {
      let result = {};

      if (!conversation.isPlayback) {
        result = await editConversation({
          projectId,
          id: conversation.id,
          name: conversation.name,
          is_private: conversation.is_private,
        });
      }

      if (!result.error) {
        // Ensure the conversation has the current timestamp when edited
        // Use server response updated_at if provided, otherwise use current timestamp
        const currentTimestamp = new Date().toISOString();
        const updatedConversation = {
          ...conversation,
          updated_at: result.data?.updated_at || currentTimestamp,
          ...(result.data || {}), // Include any server response data
          // Clear isNamingPending when conversation name is actually updated
          isNamingPending: undefined,
        };

        changeUrlByConversation(conversation.id, conversation.name);

        if (areTheSameConversations(conversation, activeConversation)) {
          setActiveConversation({
            ...activeConversation,
            name: updatedConversation.name,
            is_private: updatedConversation.is_private,
            updated_at: updatedConversation.updated_at,
            // Clear isNamingPending when conversation name is actually updated
            isNamingPending: undefined,
          });
        }

        if (conversation.folder_id) {
          // Update for a specific folder in `folders`
          setFolders(prevFolders =>
            prevFolders.map(folder => {
              if (folder.id === conversation.folder_id) {
                return {
                  ...folder,
                  conversations: folder.conversations.map(item =>
                    areTheSameConversations(conversation, item) ? updatedConversation : item,
                  ),
                };
              }
              return folder;
            }),
          );
        } else {
          // Update for `conversations` state
          setConversations(prev =>
            prev.map(item => (areTheSameConversations(conversation, item) ? updatedConversation : item)),
          );
        }
      } else {
        toastError(buildErrorMessage(result.error) || 'Failed to edit conversation, please try again.');
      }
    },
    [
      activeConversation,
      editConversation,
      projectId,
      setActiveConversation,
      setConversations,
      setFolders,
      changeUrlByConversation,
      toastError,
    ],
  );

  return {
    onEditConversation,
  };
};
