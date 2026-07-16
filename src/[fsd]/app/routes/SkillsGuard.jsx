import { memo } from 'react';

import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

const EMPTY_PERMISSIONS = [];

const SkillsGuard = memo(props => {
  const { children } = props;
  const projectId = useSelectedProjectId();
  // Targeted selector: re-render only when permissions change, not on any
  // state.user update. The module-level fallback keeps the reference stable.
  const permissions = useSelector(state => state.user?.permissions ?? EMPTY_PERMISSIONS);

  if (projectId == PUBLIC_PROJECT_ID && !permissions.includes(PERMISSIONS.skills.publish)) {
    return (
      <Navigate
        to={RouteDefinitions.Chat}
        replace
      />
    );
  }
  return children;
});

SkillsGuard.displayName = 'SkillsGuard';

export default SkillsGuard;
