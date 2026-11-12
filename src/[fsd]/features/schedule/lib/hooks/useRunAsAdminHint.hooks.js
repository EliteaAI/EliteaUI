import { useSelector } from 'react-redux';

import { useIsScheduleAdmin } from '@/[fsd]/entities/schedule';

import { runAsAdminHint } from '../helpers/scheduleList.helpers';

// The Run now tooltip for a project admin who is not the schedule owner: the run acts as the admin
export const useRunAsAdminHint = schedule => {
  const userId = useSelector(state => state.user.id);
  const isAdmin = useIsScheduleAdmin();
  return runAsAdminHint(schedule, { isAdmin, userId });
};
