import { useCallback } from 'react';

import { useSelector } from 'react-redux';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

export default function useCheckPermission() {
  const selectedProjectID = useSelectedProjectId();
  const { permissions = [], publicPermissions = [] } = useSelector(state => state.user);
  const checkPermission = useCallback(
    permission => {
      if (permission) {
        return selectedProjectID != PUBLIC_PROJECT_ID
          ? permissions.includes(permission)
          : publicPermissions.includes(permission);
      } else {
        return true;
      }
    },
    [permissions, publicPermissions, selectedProjectID],
  );
  const checkPermissions = useCallback(
    (permissionsToCheck = []) => {
      if (permissionsToCheck.length) {
        for (let index = 0; index < permissionsToCheck.length; index++) {
          if (!checkPermission(permissionsToCheck[index])) {
            return false;
          }
        }
        return true;
      } else {
        return true;
      }
    },
    [checkPermission],
  );
  return {
    checkPermission,
    checkPermissions,
  };
}
