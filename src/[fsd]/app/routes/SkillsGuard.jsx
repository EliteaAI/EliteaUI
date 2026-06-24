import { memo } from 'react';

import { Navigate } from 'react-router-dom';

import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

const SkillsGuard = memo(props => {
  const { children } = props;
  const projectId = useSelectedProjectId();

  if (projectId == PUBLIC_PROJECT_ID) {
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
