import { useCallback } from 'react';

import { usePinFolderMutation } from '@/[fsd]/entities/folder/api/entityFoldersApi';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const usePinFolder = entityType => {
  const projectId = useSelectedProjectId();
  const [pinFolder, { isLoading }] = usePinFolderMutation();

  const togglePin = useCallback(
    folder => {
      const isPinned = !!folder.meta?.is_pinned;
      return pinFolder({
        projectId,
        folderId: folder.id,
        isPinned: !isPinned,
        entityType,
      });
    },
    [projectId, pinFolder, entityType],
  );

  return { togglePin, isLoading };
};
