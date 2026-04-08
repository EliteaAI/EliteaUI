import { useCallback, useEffect } from 'react';

import { useConversationEditMutation, useFolderCreateMutation } from '@/api/chat';
import { DefaultFolderName, dummyConversation } from '@/common/constants.js';
import { buildErrorMessage } from '@/common/utils';
import { sortConversations } from '@/hooks/chat/usePinConversation.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

// Helper function to check if there are playback conversations for this original conversation
const hasPlaybackConversations = (originalConversationId, conversations, folders) => {
  // Check in ungrouped conversations
  const ungroupedPlaybacks = conversations.some(
    conv => conv.isPlayback && conv.id === originalConversationId,
  );

  if (ungroupedPlaybacks) {
    return true;
  }

  // Check in folders
  for (const folder of folders) {
    const folderPlaybacks = (folder.conversations || []).some(
      conv => conv.isPlayback && conv.id === originalConversationId,
    );
    if (folderPlaybacks) {
      return true;
    }
  }

  return false;
};

const useMoveToFolderConversation = ({
  setFolders,
  setActiveFolder,
  setConversations,
  toastError,
  toastSuccess,
  // Add these dependencies to access conversation lists
  conversations = [],
  folders = [],
}) => {
  const projectId = useSelectedProjectId();
  const [editConversation, { isError: isEditError, error: editError }] = useConversationEditMutation();
  const [createFolder, { isError: isCreateError, error: createError }] = useFolderCreateMutation();

  const moveConversationToFolder = useCallback(
    (conversation, targetFolder) => {
      const targetFolderId = targetFolder?.id;
      const isMovingToFolder = targetFolderId !== null && targetFolderId !== undefined;

      // Moving to a folder (either from ungrouped or between folders)
      if (isMovingToFolder) {
        if (!conversation.folder_id) {
          setConversations(prevUngrouped => {
            const filtered = sortConversations(prevUngrouped.filter(item => item.id !== conversation.id));
            return filtered;
          });
        }

        // Move the conversation into the target folder
        setFolders(prevFolders => {
          const updated = prevFolders.map(folder => {
            if (folder.id === targetFolderId) {
              return {
                ...folder,
                conversations: sortConversations([
                  { ...conversation, folder_id: targetFolderId },
                  ...(folder.conversations || []),
                ]),
              };
            }

            if (folder.id === conversation.folder_id) {
              return {
                ...folder,
                conversations: sortConversations(
                  (folder.conversations || []).filter(item => item.id !== conversation.id),
                ),
              };
            }

            return folder;
          });
          return updated;
        });
      } else {
        // Moving from a folder back to ungroupedConversations
        setFolders(prevFolders => {
          const updated = prevFolders.map(folder => {
            if (folder.id === conversation.folder_id) {
              return {
                ...folder,
                conversations: sortConversations(
                  (folder.conversations || []).filter(item => item.id !== conversation.id),
                ),
              };
            }
            return folder;
          });
          return updated;
        });

        setConversations(prevUngrouped => {
          const updated = sortConversations([{ ...conversation, folder_id: null }, ...prevUngrouped]);
          return updated;
        });
      }
    },
    [setConversations, setFolders],
  );

  const updateConversationWithTargetFolder = useCallback(
    (conversation, targetFolder) => {
      const targetFolderId = targetFolder && targetFolder?.id ? targetFolder.id : null;

      if (!conversation.folder_id) {
        // Update in `conversations` state
        setConversations(prevConversations => {
          const updatedConversations = prevConversations.map(item =>
            item.id === conversation.id ? { ...item, targetFolderId } : item,
          );
          return sortConversations(updatedConversations);
        });
      } else {
        //Update in `folders` for conversations within each folder
        setFolders(prevFolders => {
          return prevFolders.map(folder => ({
            ...folder,
            conversations: sortConversations(
              (folder.conversations || []).map(item =>
                item.id === conversation.id ? { ...item, targetFolderId } : item,
              ),
            ),
          }));
        });
      }
    },
    [setConversations, setFolders],
  );

  const onMoveToFolderConversation = useCallback(
    async (conversation, targetFolder) => {
      // Don't allow moving playback conversations
      if (conversation.isPlayback) {
        return { error: 'Cannot move playback conversations' };
      }

      // Don't allow moving original conversations if they have playback conversations
      if (!conversation.isPlayback && hasPlaybackConversations(conversation.id, conversations, folders)) {
        if (toastError) {
          toastError(
            'Cannot move this conversation while playback conversations exist. Please delete all playback conversations first.',
          );
        }
        return { error: 'Cannot move conversation with active playback conversations' };
      }

      const targetFolderId = targetFolder?.id || null;
      const currentFolderId = conversation.folder_id || null;

      // Skip if the conversation is already in the target location
      if (String(currentFolderId) === String(targetFolderId)) {
        return { data: conversation };
      }

      let result = {};
      if (!conversation.isPlayback) {
        result = await editConversation({
          projectId,
          id: conversation.id,
          folder_id: targetFolderId,
        });
      }

      if (!result.error) {
        moveConversationToFolder(conversation, targetFolder);

        // Show success notification
        if (toastSuccess) {
          const message = targetFolder
            ? `Conversation moved to "${targetFolder.name}" folder successfully`
            : 'Conversation moved to ungrouped area successfully';
          toastSuccess(message);
        }

        return result.data;
      }
    },
    [editConversation, moveConversationToFolder, projectId, toastSuccess, toastError, conversations, folders],
  );

  const onMoveToNewFolderConversation = useCallback(
    async conversation => {
      // Don't allow moving playback conversations
      if (conversation.isPlayback) {
        return { error: 'Cannot move playback conversations' };
      }

      // Don't allow moving original conversations if they have playback conversations
      if (!conversation.isPlayback && hasPlaybackConversations(conversation.id, conversations, folders)) {
        if (toastError) {
          toastError(
            'Cannot move this conversation while playback conversations exist. Please delete all playback conversations first.',
          );
        }
        return { error: 'Cannot move conversation with active playback conversations' };
      }

      if (!conversation.isPlayback) {
        // Fake async delay to simulate real BE-related updates to prevent multiple events due to double-clicking
        await new Promise(resolve => setTimeout(resolve, 10));

        const newFolderTempId = `${conversation.id}_to_new_folder`;

        const newFolder = {
          id: newFolderTempId,
          name: DefaultFolderName,
          conversations: [],
          isNew: true,
          targetConversationId: conversation.id, //@todo: think about refactoring to replace with targetConversation.id
          targetConversation: conversation,
        };

        updateConversationWithTargetFolder(conversation, newFolder);

        setFolders(prevFolders => {
          const folderExists = prevFolders.some(folder => folder.id === newFolderTempId);
          if (folderExists) return prevFolders; // Skip if folder already exists

          return [newFolder, ...prevFolders];
        });

        setActiveFolder({ ...newFolder });
      }
      // if (!result.error) {
      //
      // }
    },
    [setActiveFolder, setFolders, updateConversationWithTargetFolder, toastError, conversations, folders],
  );

  const moveTargetConversationToNewFolder = useCallback(
    async folder => {
      const conversation = folder.targetConversation;
      let result = {};

      setActiveFolder({
        ...folder,
      });
      result = await createFolder({
        name: folder.name,
        projectId,
      });

      if (result.data) {
        const newCreatedFolder = { ...result.data, conversations: [] };
        setActiveFolder({
          ...newCreatedFolder,
        });

        setFolders(prev => {
          const excludedNewFolders = prev.filter(folderItem => !folderItem.isNew);

          return [newCreatedFolder, ...excludedNewFolders];
        });

        const updatedConversation = await onMoveToFolderConversation(conversation, newCreatedFolder);

        if (!updatedConversation.error) {
          return updatedConversation;
        }
      } else {
        setActiveFolder(dummyConversation);
        setFolders(prev => {
          return prev.filter(item => !item.isNew);
        });
      }

      // if (!result.error) {
      //
      // }
    },
    [createFolder, onMoveToFolderConversation, projectId, setActiveFolder, setFolders],
  );

  const cancelMovingTargetConversationToNewFolder = useCallback(
    async folder => {
      const conversation = folder.targetConversation;
      updateConversationWithTargetFolder(conversation, null);
    },
    [updateConversationWithTargetFolder],
  );

  useEffect(() => {
    if (isEditError) {
      toastError(buildErrorMessage(editError));
    }
  }, [editError, isEditError, toastError]);

  useEffect(() => {
    if (isCreateError) {
      toastError(buildErrorMessage(createError));
    }
  }, [createError, isCreateError, toastError]);

  return {
    onMoveToFolderConversation,
    onMoveToNewFolderConversation,
    moveTargetConversationToNewFolder,
    cancelMovingTargetConversationToNewFolder,
  };
};

export default useMoveToFolderConversation;
