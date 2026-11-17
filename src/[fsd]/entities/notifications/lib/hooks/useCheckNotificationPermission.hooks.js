import { useMemo } from 'react';

import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

export const useCheckNotificationPermission = () => {
  const { checkPermission } = useCheckPermission();
  const canUpdate = useMemo(() => checkPermission(PERMISSIONS.notification.update), [checkPermission]);

  return { canUpdate };
};
