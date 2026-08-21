import { useCallback } from 'react';

import { useUpdateEntityFolderMutation } from '@/api';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useUpdateFolder = () => {
  const projectId = useSelectedProjectId();
  const [updateFolderMutation, { isLoading, isError, error }] = useUpdateEntityFolderMutation();

  const updateFolder = useCallback(
    async ({ folderId, name, meta, entityType }) => {
      if (!projectId) return null;
      const result = await updateFolderMutation({ projectId, folderId, name, meta, entityType });
      return result.data;
    },
    [projectId, updateFolderMutation],
  );

  return {
    updateFolder,
    isLoading,
    isError,
    error,
  };
};
