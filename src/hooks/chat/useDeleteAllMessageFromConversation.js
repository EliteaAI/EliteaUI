import { useCallback, useEffect } from 'react';

import { useDeleteAllMessagesFromConversationMutation } from '@/api/chat';
import { areTheSameConversations, buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import useUpdateConversationTimestamp from './useUpdateConversationTimestamp';

const useDeleteAllMessageFromConversation = ({
  activeConversation,
  setActiveConversation,
  setConversations,
  setFolders,
  toastError,
  toastInfo,
  toastSuccess,
}) => {
  const projectId = useSelectedProjectId();
  const { updateConversationTimestamp } = useUpdateConversationTimestamp();
  const [deleteAllMessages, { isSuccess, isError, error, reset }] =
    useDeleteAllMessagesFromConversationMutation();
  const onDeleteAllMessages = useCallback(
    async callback => {
      const result = await deleteAllMessages({
        projectId,
        conversationId: activeConversation?.id,
      });
      if (!result.error) {
        const updatedConversation = {
          ...activeConversation,
          chat_history: [],
          message_groups_count: 0,
          message_groups: [],
          updated_at: new Date().toISOString(),
        };

        setActiveConversation(updatedConversation);
        setConversations(prev => {
          return prev.map(item =>
            areTheSameConversations(activeConversation, item) ? updatedConversation : item,
          );
        });

        // Update conversations in folders
        if (setFolders) {
          setFolders(prev => {
            return prev.map(folder => ({
              ...folder,
              conversations: folder.conversations.map(item =>
                areTheSameConversations(activeConversation, item) ? updatedConversation : item,
              ),
            }));
          });
        }

        // Update the conversation timestamp on the backend to ensure persistence after page refresh
        updateConversationTimestamp(activeConversation.id);

        callback && callback();
      }
    },
    [
      activeConversation,
      deleteAllMessages,
      projectId,
      setActiveConversation,
      setConversations,
      setFolders,
      updateConversationTimestamp,
    ],
  );

  const onRemoteDeleteAllMessages = useCallback(
    async conversationId => {
      const updatedConversation = {
        ...activeConversation,
        chat_history: [],
        message_groups_count: 0,
        message_groups: [],
        updated_at: new Date().toISOString(),
      };

      if (areTheSameConversations(activeConversation, { id: conversationId })) {
        setActiveConversation(updatedConversation);
      }
      setConversations(prev => {
        return prev.map(item =>
          areTheSameConversations({ id: conversationId }, item) ? updatedConversation : item,
        );
      });

      // Update conversations in folders
      if (setFolders) {
        setFolders(prev => {
          return prev.map(folder => ({
            ...folder,
            conversations: folder.conversations.map(item =>
              areTheSameConversations({ id: conversationId }, item) ? updatedConversation : item,
            ),
          }));
        });
      }

      // Update the conversation timestamp on the backend to ensure persistence after page refresh
      updateConversationTimestamp(conversationId);
    },
    [activeConversation, setActiveConversation, setConversations, setFolders, updateConversationTimestamp],
  );

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
      reset();
    }
  }, [error, isError, reset, toastError]);

  useEffect(() => {
    if (isSuccess) {
      // Use success toast (green with check icon)
      (toastSuccess || toastInfo)('All messages in this conversation were successfully deleted.');
      reset();
    }
  }, [isSuccess, reset, toastSuccess, toastInfo]);

  return {
    onDeleteAllMessages,
    onRemoteDeleteAllMessages,
  };
};

export default useDeleteAllMessageFromConversation;
