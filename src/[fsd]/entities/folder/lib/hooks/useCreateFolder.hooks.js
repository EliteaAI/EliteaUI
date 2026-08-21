import { useCallback } from 'react';

import { useCreateEntityFolderMutation } from '@/api';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useCreateFolder = () => {
  const projectId = useSelectedProjectId();
  const [createFolderMutation, { isLoading, isError, error }] = useCreateEntityFolderMutation();

  const createFolder = useCallback(
    async ({ name, entityType, meta }) => {
      if (!projectId) return null;
      const result = await createFolderMutation({ projectId, name, entityType, meta });
      return result.data;
    },
    [projectId, createFolderMutation],
  );

  return {
    createFolder,
    isLoading,
    isError,
    error,
  };
};
