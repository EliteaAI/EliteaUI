import { useSelector } from 'react-redux';

import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import { runAsAdminHint } from '../helpers/scheduleList.helpers';

// The Run now tooltip for a project admin who is not the schedule owner: the run acts as the admin
export const useRunAsAdminHint = schedule => {
  const userId = useSelector(state => state.user.id);
  const { checkPermission } = useCheckPermission();
  return runAsAdminHint(schedule, { isAdmin: checkPermission(PERMISSIONS.schedules.admin), userId });
};
