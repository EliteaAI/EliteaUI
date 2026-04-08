import { useCallback, useEffect } from 'react';

import { useFolderUpdateMutation } from '@/api/chat';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const useReorderFolders = ({ folders, setFolders, toastError, toastSuccess }) => {
  const { checkPermission } = useCheckPermission();
  const projectId = useSelectedProjectId();
  const [updateFolder, { isLoading: isFolderUpdate, isError, error }] = useFolderUpdateMutation();

  const getChangedFolders = useCallback((newOrder, previousOrder) => {
    const previousMap = new Map((previousOrder || []).map(folder => [folder.id, folder]));

    return newOrder.filter(folder => {
      if (folder.isNew || !folder.id) return false;

      const previous = previousMap.get(folder.id);
      if (!previous) return true;

      const hasNeighborContext = folder.neighbor_above_id != null || folder.neighbor_below_id != null;
      return hasNeighborContext;
    });
  }, []);

  const onReorderFolders = useCallback(
    async newOrder => {
      if (!newOrder || !Array.isArray(newOrder) || newOrder.length === 0) {
        return;
      }

      if (!checkPermission(PERMISSIONS.chat.folders.update)) {
        if (toastError) {
          toastError('You do not have permission to reorder folders');
        }
        return;
      }

      const previousOrder = Array.isArray(folders) ? [...folders] : [];
      setFolders(newOrder);

      try {
        const foldersToUpdate = getChangedFolders(newOrder, previousOrder);

        const updatePromises = foldersToUpdate.map(async folder => {
          if (folder.isNew || !folder.id) {
            return Promise.resolve();
          }

          return updateFolder({
            projectId,
            id: folder.id,
            name: folder.name,
            meta: folder.meta,
            position: folder.position,
            neighbor_above_id: folder.neighbor_above_id,
            neighbor_below_id: folder.neighbor_below_id,
          }).catch(err => {
            toastError(`Failed to update folder ${folder.id}: ${err}`);
            throw err;
          });
        });

        await Promise.all(updatePromises);

        if (toastSuccess) {
          toastSuccess('Folders reordered successfully');
        }
      } catch (err) {
        setFolders(previousOrder || []);
        if (err) {
          toastError(buildErrorMessage(err) || 'Failed to reorder folders');
        }
      }
    },
    [
      checkPermission,
      projectId,
      folders,
      setFolders,
      toastError,
      toastSuccess,
      updateFolder,
      getChangedFolders,
    ],
  );

  useEffect(() => {
    if (isError) {
      toastError?.(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return {
    onReorderFolders,
    isFolderUpdate,
  };
};

export default useReorderFolders;
