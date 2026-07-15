import { useCallback, useEffect } from 'react';

import { useDeleteFolderMutation } from '@/api';
import { areTheSameFolders, buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useDeleteFolder = props => {
  const projectId = useSelectedProjectId();

  const { setFolders, toastError, toastSuccess } = props;

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
        const folderName = conversation.name || conversation.title || 'folder';
        toastSuccess?.(`The ${folderName} folder has been successfully deleted.`);
        setFolders(prev => {
          return prev.filter(item => !areTheSameFolders(conversation, item));
        });
      }
    },
    [deleteFolder, projectId, setFolders, toastSuccess],
  );

  useEffect(() => {
    if (isError) toastError(buildErrorMessage(error));
  }, [error, isError, toastError]);

  return {
    onDeleteFolder,
  };
};
