import { useMemo } from 'react';

import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

export const useCheckNotificationPermission = () => {
  const { checkPermission } = useCheckPermission();
  const canUpdate = useMemo(() => checkPermission(PERMISSIONS.notification.update), [checkPermission]);
  const canDelete = useMemo(() => checkPermission(PERMISSIONS.notification.delete), [checkPermission]);

  return { canUpdate, canDelete };
};
