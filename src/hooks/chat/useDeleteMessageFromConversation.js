import { useCallback, useEffect } from 'react';

import { useDeleteMessageFromConversationMutation } from '@/api/chat';
import { areTheSameConversations, buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import useUpdateConversationTimestamp from './useUpdateConversationTimestamp';

const useDeleteMessageFromConversation = ({
  activeConversation,
  setActiveConversation,
  setConversations,
  setFolders,
  toastError,
  toastInfo,
}) => {
  const projectId = useSelectedProjectId();
  const { updateConversationTimestamp } = useUpdateConversationTimestamp();
  const [deleteMessage, { isSuccess, isError, error, reset }] = useDeleteMessageFromConversationMutation();
  const onDeleteMessage = useCallback(
    async (id, callback) => {
      const result = await deleteMessage({
        conversationId: activeConversation.id,
        projectId,
        id,
      });
      if (!result.error) {
        setActiveConversation(prev => {
          const updatedConversation = {
            ...prev,
            message_groups_count: prev.message_groups_count - 1,
            message_groups: prev.message_groups?.filter(message => message.id !== id),
            updated_at: new Date().toISOString(),
          };

          setConversations(prevConversations => {
            return prevConversations.map(item =>
              areTheSameConversations(prev, item) ? updatedConversation : item,
            );
          });

          // Update conversations in folders
          if (setFolders) {
            setFolders(prevFolders => {
              return prevFolders.map(folder => ({
                ...folder,
                conversations: folder.conversations.map(item =>
                  areTheSameConversations(prev, item) ? updatedConversation : item,
                ),
              }));
            });
          }

          return updatedConversation;
        });

        // Update the conversation timestamp on the backend to ensure persistence after page refresh
        updateConversationTimestamp(activeConversation.id);

        callback && callback();
      }
    },
    [
      activeConversation,
      deleteMessage,
      projectId,
      setActiveConversation,
      setConversations,
      setFolders,
      updateConversationTimestamp,
    ],
  );

  const onRemoteDeleteMessage = useCallback(
    async id => {
      setActiveConversation(prev => {
        const updatedConversation = {
          ...prev,
          chat_history: prev.chat_history.filter(message => message.id != id),
          message_groups_count: prev.message_groups_count - 1,
          message_groups: prev.message_groups?.filter(message => message.id !== id),
          updated_at: new Date().toISOString(),
        };

        setConversations(prevConversations => {
          return prevConversations.map(item =>
            areTheSameConversations(prev, item) ? updatedConversation : item,
          );
        });

        // Update conversations in folders
        if (setFolders) {
          setFolders(prevFolders => {
            return prevFolders.map(folder => ({
              ...folder,
              conversations: folder.conversations.map(item =>
                areTheSameConversations(prev, item) ? updatedConversation : item,
              ),
            }));
          });
        }

        return updatedConversation;
      });

      // Update the conversation timestamp on the backend to ensure persistence after page refresh
      updateConversationTimestamp(activeConversation.id);
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
      toastInfo('The message has been deleted');
      reset();
    }
  }, [isSuccess, reset, toastInfo]);

  return {
    onDeleteMessage,
    onRemoteDeleteMessage,
  };
};

export default useDeleteMessageFromConversation;
