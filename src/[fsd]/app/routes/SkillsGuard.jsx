import { memo } from 'react';

import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

const SkillsGuard = memo(props => {
  const { children } = props;
  const projectId = useSelectedProjectId();
  const { permissions = [] } = useSelector(state => state.user);

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
