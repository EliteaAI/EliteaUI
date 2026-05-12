import { memo } from 'react';

import { Navigate } from 'react-router-dom';

import { ALLOW_PROJECT_OWN_LLMS, PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

const IntegrationGuard = memo(props => {
  const { children } = props;
  const projectId = useSelectedProjectId();

  if (ALLOW_PROJECT_OWN_LLMS === false && projectId != PUBLIC_PROJECT_ID) {
    return (
      <Navigate
        to={RouteDefinitions.SettingsWithTab.replace(':tab', 'model-configuration')}
        replace
      />
    );
  }
  return children;
});

IntegrationGuard.displayName = 'IntegrationGuard';

export default IntegrationGuard;
