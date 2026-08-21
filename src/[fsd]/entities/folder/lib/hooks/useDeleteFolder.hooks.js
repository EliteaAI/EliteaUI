import { useCallback } from 'react';

import { useDeleteEntityFolderMutation } from '@/api';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useDeleteFolder = () => {
  const projectId = useSelectedProjectId();
  const [deleteFolderMutation, { isLoading, isError, error }] = useDeleteEntityFolderMutation();

  const deleteFolder = useCallback(
    async ({ folderId, entityType }) => {
      if (!projectId) return null;
      const result = await deleteFolderMutation({ projectId, folderId, entityType });
      return result.data;
    },
    [projectId, deleteFolderMutation],
  );

  return {
    deleteFolder,
    isLoading,
    isError,
    error,
  };
};
