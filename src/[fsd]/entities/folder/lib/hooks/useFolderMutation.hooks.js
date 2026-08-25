import { useCallback } from 'react';

import { usePinFolderMutation } from '@/[fsd]/entities/folder/api/entityFoldersApi';
import {
  useCreateEntityFolderMutation,
  useDeleteEntityFolderMutation,
  useMoveEntityToFolderMutation,
  useRemoveEntityFromFolderMutation,
  useUpdateEntityFolderMutation,
} from '@/api';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

/**
 * Consolidated folder mutation hooks. Each mutation type follows the same pattern:
 * wraps an RTK mutation, injects projectId, and returns { action, isLoading, isError, error }.
 */

export const useCreateFolder = () => {
  const projectId = useSelectedProjectId();
  const [mutation, { isLoading, isError, error }] = useCreateEntityFolderMutation();

  const createFolder = useCallback(
    async ({ name, entityType, meta }) => {
      if (!projectId) return null;
      const result = await mutation({ projectId, name, entityType, meta });
      return result.data;
    },
    [projectId, mutation],
  );

  return { createFolder, isLoading, isError, error };
};

export const useUpdateFolder = () => {
  const projectId = useSelectedProjectId();
  const [mutation, { isLoading, isError, error }] = useUpdateEntityFolderMutation();

  const updateFolder = useCallback(
    async ({ folderId, name, meta, entityType }) => {
      if (!projectId) return null;
      const result = await mutation({ projectId, folderId, name, meta, entityType });
      return result.data;
    },
    [projectId, mutation],
  );

  return { updateFolder, isLoading, isError, error };
};

export const useDeleteFolder = () => {
  const projectId = useSelectedProjectId();
  const [mutation, { isLoading, isError, error }] = useDeleteEntityFolderMutation();

  const deleteFolder = useCallback(
    async ({ folderId, entityType }) => {
      if (!projectId) return null;
      const result = await mutation({ projectId, folderId, entityType });
      return result.data;
    },
    [projectId, mutation],
  );

  return { deleteFolder, isLoading, isError, error };
};

export const useMoveEntityToFolder = () => {
  const projectId = useSelectedProjectId();
  const [mutation, { isLoading, isError, error }] = useMoveEntityToFolderMutation();

  const moveEntityToFolder = useCallback(
    async ({ folderId, folderName, entityType, entityId, previousFolderId }) => {
      if (!projectId) return null;
      const result = await mutation({
        projectId,
        folderId,
        folderName,
        entityType,
        entityId,
        previousFolderId,
      });
      return result.data;
    },
    [projectId, mutation],
  );

  return { moveEntityToFolder, isLoading, isError, error };
};

export const useRemoveEntityFromFolder = () => {
  const projectId = useSelectedProjectId();
  const [mutation, { isLoading, isError, error }] = useRemoveEntityFromFolderMutation();

  const removeEntityFromFolder = useCallback(
    async ({ entityType, entityId, previousFolderId }) => {
      if (!projectId) return null;
      const result = await mutation({ projectId, entityType, entityId, previousFolderId });
      return result.data;
    },
    [projectId, mutation],
  );

  return { removeEntityFromFolder, isLoading, isError, error };
};

export const usePinFolder = entityType => {
  const projectId = useSelectedProjectId();
  const [pinFolder, { isLoading }] = usePinFolderMutation();

  const togglePin = useCallback(
    folder => {
      const isPinned = !!folder.meta?.is_pinned;
      return pinFolder({
        projectId,
        folderId: folder.id,
        isPinned: !isPinned,
        entityType,
      });
    },
    [projectId, pinFolder, entityType],
  );

  return { togglePin, isLoading };
};
