import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const publicAdminPermissions = {
  agents: ['models.applications.applications.list'],
};

export const useHasAdminPermissionOfThisEntity = entity => {
  const { permissions = [] } = useSelector(s => s.user);
  const permissionsSet = useMemo(() => new Set(permissions), [permissions]);
  const hasAdminPermission = useMemo(
    () => publicAdminPermissions[entity].some(p => permissionsSet.has(p)),
    [entity, permissionsSet],
  );
  return hasAdminPermission;
};

export const useCanListThisPublicEntity = entity => {
  const projectId = useSelectedProjectId();
  const hasAdminPermission = useHasAdminPermissionOfThisEntity(entity);
  return projectId === PUBLIC_PROJECT_ID && hasAdminPermission;
};
