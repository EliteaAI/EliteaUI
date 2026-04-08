import { useCallback, useEffect } from 'react';

import { useDeleteFolderMutation } from '@/api/chat';
import { areTheSameFolders, buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useDeleteFolder = ({ setFolders, toastError }) => {
  const projectId = useSelectedProjectId();
  const [deleteFolder, { isError, error }] = useDeleteFolderMutation();

  const onDeleteFolder = useCallback(
    async conversation => {
      let result = {};
      if (!conversation.isPlayback) {
        result = await deleteFolder({
          projectId,
          id: conversation.id,
        });
      }
      if (!result.error) {
        setFolders(prev => {
          return prev.filter(item => !areTheSameFolders(conversation, item));
        });
      }
    },
    [deleteFolder, projectId, setFolders],
  );

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return {
    onDeleteFolder,
  };
};
