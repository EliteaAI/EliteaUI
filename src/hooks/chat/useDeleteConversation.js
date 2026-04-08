import { useCallback, useEffect } from 'react';

import { useDeleteConversationMutation, useUnselectConversationMutation } from '@/api/chat';
import { dummyConversation } from '@/common/constants';
import { areTheSameConversations, buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import useLocalActiveParticipant from './useLocalActiveParticipant';
import useResetCreateFlag from './useResetCreateFlag';

const useDeleteConversation = ({
  activeConversation,
  setActiveConversation,
  setConversations,
  setFolders,
  toastError,
  emitLeaveRoom,
  stopListenCanvasEditorsChangeEvent,
  stopListenCanvasContentChangeEvent,
  // Add new parameters for conversation selection
  conversations,
  folders,
  onSelectConversation,
}) => {
  const projectId = useSelectedProjectId();
  const { resetCreateFlag } = useResetCreateFlag();
  const [deleteConversation, { isError, error }] = useDeleteConversationMutation();
  const { clearLocalActiveParticipant } = useLocalActiveParticipant();
  const [unselectConversation] = useUnselectConversationMutation();

  // Helper function to find the next conversation to select
  const findNextConversation = useCallback((deletedConversation, allConversations, allFolders) => {
    let conversationsToSearch = [];

    if (deletedConversation.folder_id) {
      // If conversation is in a folder, search within that folder first
      const folder = allFolders.find(f => f.id === deletedConversation.folder_id);
      if (folder && folder.conversations) {
        conversationsToSearch = folder.conversations.filter(
          conv => conv.id !== deletedConversation.id || conv.isPlayback !== deletedConversation.isPlayback,
        );
      }
      // If no conversations in folder, fall back to ungrouped conversations
      if (conversationsToSearch.length === 0) {
        conversationsToSearch = allConversations.filter(
          conv => conv.id !== deletedConversation.id || conv.isPlayback !== deletedConversation.isPlayback,
        );
      }
    } else {
      // If conversation is ungrouped, search in ungrouped conversations
      conversationsToSearch = allConversations.filter(
        conv => conv.id !== deletedConversation.id || conv.isPlayback !== deletedConversation.isPlayback,
      );
    }

    // Return the most recent conversation (first in sorted order)
    return conversationsToSearch.length > 0 ? conversationsToSearch[0] : null;
  }, []);

  const onDeleteConversation = useCallback(
    async conversation => {
      let result = {};
      if (!conversation.isPlayback) {
        result = await deleteConversation({
          projectId,
          id: conversation.id,
        });
      }
      if (!result.error) {
        // Find next conversation to select BEFORE deleting current one
        const nextConversation = areTheSameConversations(conversation, activeConversation)
          ? findNextConversation(conversation, conversations, folders)
          : null;

        if (areTheSameConversations(conversation, activeConversation)) {
          // If we have a next conversation to select, select it; otherwise use dummy
          if (nextConversation && onSelectConversation) {
            // Select the next conversation
            onSelectConversation(nextConversation);
          } else {
            setActiveConversation(dummyConversation);
          }

          if (activeConversation?.id && !activeConversation?.isPlayback) {
            stopListenCanvasEditorsChangeEvent();
            stopListenCanvasContentChangeEvent();
            emitLeaveRoom({
              conversation_id: activeConversation.id,
              conversation_uuid: activeConversation.uuid,
              project_id: projectId,
            });
          }
          resetCreateFlag();
          clearLocalActiveParticipant(activeConversation?.id);
          unselectConversation({ projectId });
        }
        if (conversation.folder_id) {
          // Remove from a specific folder in `folders`
          setFolders(prevFolders => {
            return prevFolders.map(folder => {
              if (folder.id === conversation.folder_id) {
                return {
                  ...folder,
                  conversations: folder.conversations.filter(
                    item => item.id !== conversation.id || item.isPlayback != conversation?.isPlayback,
                  ),
                };
              }
              return folder;
            });
          });
        } else {
          // Remove from `conversations` state
          setConversations(prevConversations => {
            return prevConversations.filter(
              item => item.id !== conversation.id || item.isPlayback != conversation?.isPlayback,
            );
          });
        }
      }
    },
    [
      activeConversation,
      clearLocalActiveParticipant,
      deleteConversation,
      emitLeaveRoom,
      projectId,
      resetCreateFlag,
      setActiveConversation,
      setConversations,
      setFolders,
      unselectConversation,
      stopListenCanvasEditorsChangeEvent,
      stopListenCanvasContentChangeEvent,
      // Add new dependencies
      conversations,
      folders,
      onSelectConversation,
      findNextConversation,
    ],
  );

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return {
    onDeleteConversation,
  };
};

export default useDeleteConversation;
