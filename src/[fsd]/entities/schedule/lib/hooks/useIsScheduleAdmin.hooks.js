import { useSelector } from 'react-redux';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks/useSelectedProject.hooks';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

/**
 * True when the selected project is the personal project of the current user. A private project makes
 * its owner an editor, not an admin, so owning it stands in for the permission.
 *
 * @returns {boolean}
 */
export const useIsOwnPersonalProject = () => {
  const projectId = useSelectedProjectId();
  const personalProjectId = useSelector(state => state.user?.personal_project_id);

  return Boolean(personalProjectId) && String(projectId) === String(personalProjectId);
};

/**
 * Schedule admin: has the admin permission, or owns the selected personal project.
 * Editors of a team project stay blocked.
 *
 * @returns {boolean}
 */
export const useIsScheduleAdmin = () => {
  const { checkPermission } = useCheckPermission();
  const isOwnPersonalProject = useIsOwnPersonalProject();

  return checkPermission(PERMISSIONS.schedules.admin) || isOwnPersonalProject;
};
