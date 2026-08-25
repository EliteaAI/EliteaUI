import { useCallback } from 'react';

import { useRemoveEntityFromFolderMutation } from '@/api';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useRemoveEntityFromFolder = () => {
  const projectId = useSelectedProjectId();
  const [removeEntityMutation, { isLoading, isError, error }] = useRemoveEntityFromFolderMutation();

  const removeEntityFromFolder = useCallback(
    async ({ entityType, entityId, previousFolderId }) => {
      if (!projectId) return null;
      const result = await removeEntityMutation({ projectId, entityType, entityId, previousFolderId });
      return result.data;
    },
    [projectId, removeEntityMutation],
  );

  return {
    removeEntityFromFolder,
    isLoading,
    isError,
    error,
  };
};
