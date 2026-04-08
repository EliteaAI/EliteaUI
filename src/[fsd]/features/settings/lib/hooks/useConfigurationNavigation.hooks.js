import { useCallback, useMemo } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import RouteDefinitions from '@/routes';

export const useConfigurationNavigation = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const locationState = useMemo(() => state || { from: [], routeStack: [] }, [state]);

  const navigateToConfiguration = useCallback(
    configurationId => {
      const newRouteStack = [...locationState.routeStack];
      const newPagePath = RouteDefinitions.EditIntegration.replace(':uid', configurationId);

      newRouteStack.push({
        breadCrumb: 'Model Configuration',
        pagePath: RouteDefinitions.SettingsWithTab.replace(':tab', 'model-configuration'),
      });

      newRouteStack.push({
        breadCrumb: 'New Credential',
        pagePath: newPagePath,
      });

      navigate(
        {
          pathname: newPagePath,
          search: 'from=model-configuration',
        },
        {
          state: { routeStack: newRouteStack },
        },
      );
    },
    [locationState.routeStack, navigate],
  );

  return { navigateToConfiguration };
};
