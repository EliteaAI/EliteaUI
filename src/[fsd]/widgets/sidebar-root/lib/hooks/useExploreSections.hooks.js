import { useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { ExploreSections } from '@/[fsd]/widgets/sidebar-root/lib/constants/sidebar.constants';
import { PERMISSIONS, PERMISSION_GROUPS, PUBLIC_PROJECT_ID } from '@/common/constants';

export const useExploreSections = () => {
  const { pathname } = useLocation();
  const permissions = useSelector(state => state.user.permissions);
  const selectedProjectId = useSelector(state => state.settings.project?.id);
  const isMcpVisible = useIsMcpVisible();

  const sections = useMemo(() => {
    const permissionsSet = new Set(permissions || []);
    const isSelectedProjectPublic = selectedProjectId == PUBLIC_PROJECT_ID;

    return ExploreSections.filter(section => {
      if (section.value === 'mcps' && !isMcpVisible) return false;
      if (
        section.value === 'skills' &&
        isSelectedProjectPublic &&
        !permissionsSet.has(PERMISSIONS.skills.publish)
      ) {
        return false;
      }
      const group = PERMISSION_GROUPS[section.permissionKey];
      return group?.length ? group.some(permission => permissionsSet.has(permission)) : true;
    });
  }, [isMcpVisible, permissions, selectedProjectId]);

  const selectedSection = useMemo(
    () => sections.find(section => pathname.startsWith(section.url))?.value ?? null,
    [pathname, sections],
  );

  return { sections, selectedSection };
};
