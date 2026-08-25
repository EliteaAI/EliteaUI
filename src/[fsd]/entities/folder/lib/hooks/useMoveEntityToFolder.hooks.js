import { useCallback } from 'react';

import { useMoveEntityToFolderMutation } from '@/api';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useMoveEntityToFolder = () => {
  const projectId = useSelectedProjectId();
  const [moveEntityMutation, { isLoading, isError, error }] = useMoveEntityToFolderMutation();

  const moveEntityToFolder = useCallback(
    async ({ folderId, folderName, entityType, entityId, previousFolderId }) => {
      if (!projectId) return null;
      const result = await moveEntityMutation({
        projectId,
        folderId,
        folderName,
        entityType,
        entityId,
        previousFolderId,
      });
      return result.data;
    },
    [projectId, moveEntityMutation],
  );

  return {
    moveEntityToFolder,
    isLoading,
    isError,
    error,
  };
};
