import { memo } from 'react';

import { Navigate } from 'react-router-dom';

import { useIsOwnLLMsRestricted } from '@/[fsd]/shared/lib/hooks';
import RouteDefinitions from '@/routes';

const IntegrationGuard = memo(props => {
  const { children } = props;
  const isOwnLLMsRestricted = useIsOwnLLMsRestricted();

  if (isOwnLLMsRestricted) {
    return (
      <Navigate
        to={RouteDefinitions.SettingsWithTab.replace(':tab', 'ai-providers')}
        replace
      />
    );
  }
  return children;
});

IntegrationGuard.displayName = 'IntegrationGuard';

export default IntegrationGuard;
