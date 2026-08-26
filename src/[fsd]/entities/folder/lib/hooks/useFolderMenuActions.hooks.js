import { useCallback, useMemo, useState } from 'react';

import useToast from '@/hooks/useToast';

import { getFolderEntityType } from '../helpers';
import { useEntityFolders } from './useEntityFolders.hooks';
import { useMoveEntityToFolder, useRemoveEntityFromFolder } from './useFolderMutation.hooks';

/**
 * Shared hook for folder menu actions used by MoveToFolderButton and MoveToFolderSubmenu.
 * Handles folder selection, creation, move/remove operations, and toast notifications.
 */
export const useFolderMenuActions = ({ entityId, entityType, currentFolderId, onAction }) => {
  const folderEntityType = useMemo(() => getFolderEntityType(entityType), [entityType]);
  const { folders, isLoading: foldersLoading } = useEntityFolders(folderEntityType, {
    skip: !folderEntityType,
  });
  const { moveEntityToFolder, isLoading: isMoving } = useMoveEntityToFolder();
  const { removeEntityFromFolder, isLoading: isRemoving } = useRemoveEntityFromFolder();
  const { toastSuccess, toastError } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isLoading = foldersLoading || isMoving || isRemoving;

  const handleFolderClick = useCallback(
    async (event, folder) => {
      event.stopPropagation();
      onAction?.();

      if (folder.id === currentFolderId) return;

      try {
        await moveEntityToFolder({
          folderId: folder.id,
          folderName: folder.name,
          entityType: folderEntityType,
          entityId,
          previousFolderId: currentFolderId,
        });
        toastSuccess(`Moved to "${folder.name}"`);
      } catch {
        toastError('Failed to move to folder');
      }
    },
    [currentFolderId, entityId, folderEntityType, moveEntityToFolder, onAction, toastSuccess, toastError],
  );

  const handleRemoveFromFolder = useCallback(
    async event => {
      event.stopPropagation();
      onAction?.();

      try {
        await removeEntityFromFolder({
          entityType: folderEntityType,
          entityId,
          previousFolderId: currentFolderId,
        });
        toastSuccess('Removed from folder');
      } catch {
        toastError('Failed to remove from folder');
      }
    },
    [currentFolderId, entityId, folderEntityType, onAction, removeEntityFromFolder, toastSuccess, toastError],
  );

  const handleCreateFolderClick = useCallback(
    event => {
      event.stopPropagation();
      onAction?.();
      setCreateDialogOpen(true);
    },
    [onAction],
  );

  const handleFolderCreated = useCallback(
    async newFolder => {
      setCreateDialogOpen(false);
      if (!newFolder?.id) return;

      try {
        await moveEntityToFolder({
          folderId: newFolder.id,
          folderName: newFolder.name,
          entityType: folderEntityType,
          entityId,
          previousFolderId: currentFolderId,
        });
        toastSuccess(`Moved to "${newFolder.name}"`);
      } catch {
        toastError('Failed to move to folder');
      }
    },
    [currentFolderId, entityId, folderEntityType, moveEntityToFolder, toastSuccess, toastError],
  );

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  return {
    folderEntityType,
    folders,
    isLoading,
    createDialogOpen,
    handleFolderClick,
    handleRemoveFromFolder,
    handleCreateFolderClick,
    handleFolderCreated,
    handleCloseCreateDialog,
  };
};
