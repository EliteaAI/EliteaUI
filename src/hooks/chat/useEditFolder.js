import { useCallback, useEffect } from 'react';

import { useFolderPinUpdateMutation, useFolderUpdateMutation } from '@/api/chat';
import { PERMISSIONS } from '@/common/constants.js';
import { areTheSameFolders, buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const useEditFolder = ({ activeFolder, setActiveFolder, setFolders, toastError }) => {
  const { checkPermission } = useCheckPermission();
  const projectId = useSelectedProjectId();
  const [editFolder, { isError, error }] = useFolderUpdateMutation();
  const [pinFolder] = useFolderPinUpdateMutation();

  const onEditFolder = useCallback(
    async folder => {
      let result = {};
      if (!folder.isPlayback) {
        result = await editFolder(
          {
            projectId,
            id: folder.id,
            name: folder.name,
            meta: folder.meta,
          },
          { skip: !projectId || !checkPermission(PERMISSIONS.chat.folders.update) },
        );
      }
      if (!result.error) {
        if (areTheSameFolders(folder, activeFolder)) {
          setActiveFolder(folder);
        }
        setFolders(prev => {
          return prev.map(item => (areTheSameFolders(folder, item) ? folder : item));
        });
      }
    },
    [activeFolder, checkPermission, editFolder, projectId, setActiveFolder, setFolders],
  );

  const onPinFolder = useCallback(
    async (folder, is_pinned) => {
      if (!checkPermission(PERMISSIONS.chat.folders.update)) {
        return;
      }

      try {
        await pinFolder({
          projectId,
          id: folder.id,
          is_pinned,
        }).unwrap();

        setFolders(prev =>
          prev.map(item => (item.id === folder.id ? { ...item, meta: { ...item.meta, is_pinned } } : item)),
        );
      } catch (err) {
        toastError(buildErrorMessage(err));
      }
    },
    [checkPermission, pinFolder, projectId, setFolders, toastError],
  );

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return {
    onEditFolder,
    onPinFolder,
  };
};

export default useEditFolder;
