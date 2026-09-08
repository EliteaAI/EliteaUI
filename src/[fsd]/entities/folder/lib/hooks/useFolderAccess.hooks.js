import { useMemo } from 'react';

import { FOLDER_PERMISSION_OPTIONS } from '../constants';

export const useFolderAccess = userPermission => {
  return useMemo(() => {
    const permission = userPermission ?? FOLDER_PERMISSION_OPTIONS.FULL;

    return {
      canRead: permission !== FOLDER_PERMISSION_OPTIONS.NO_ACCESS,
      canWrite:
        permission === FOLDER_PERMISSION_OPTIONS.READ_WRITE || permission === FOLDER_PERMISSION_OPTIONS.FULL,
    };
  }, [userPermission]);
};
