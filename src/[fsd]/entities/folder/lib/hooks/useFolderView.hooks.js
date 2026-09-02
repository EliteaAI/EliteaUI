import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

const FOLDER_QUERY_PARAM = 'folder';

/**
 * Hook for managing folder view state via URL query parameters.
 * Stores folder ID in URL so links can be shared and page can be reloaded.
 */
export const useFolderView = (folders = []) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFolderId = useMemo(() => {
    const folderId = searchParams.get(FOLDER_QUERY_PARAM);
    return folderId ? Number(folderId) : null;
  }, [searchParams]);

  const selectedFolder = useMemo(() => {
    if (!selectedFolderId || !folders.length) return null;
    return folders.find(f => f.id === selectedFolderId) || null;
  }, [selectedFolderId, folders]);

  const isFolderViewActive = Boolean(selectedFolderId);

  const closeFolder = useCallback(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.delete(FOLDER_QUERY_PARAM);
      return newParams;
    });
  }, [setSearchParams]);

  const openFolder = useCallback(
    folder => {
      if (!folder?.id) return;

      // If clicking the same folder, close it (toggle behavior)
      if (folder.id === selectedFolderId) {
        closeFolder();
        return;
      }

      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set(FOLDER_QUERY_PARAM, String(folder.id));
        return newParams;
      });
    },
    [selectedFolderId, setSearchParams, closeFolder],
  );

  const onFolderDelete = useCallback(
    folder => {
      if (folder.id === selectedFolderId) {
        closeFolder();
        return;
      }
    },
    [selectedFolderId, closeFolder],
  );

  return {
    selectedFolderId,
    selectedFolder,
    isFolderViewActive,
    openFolder,
    closeFolder,
    onFolderDelete,
  };
};
