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
      const newPagePath = RouteDefinitions.EditConfiguration.replace(':uid', configurationId);

      newRouteStack.push({
        breadCrumb: 'AI Providers',
        pagePath: RouteDefinitions.SettingsWithTab.replace(':tab', 'ai-providers'),
      });

      newRouteStack.push({
        breadCrumb: 'New Credential',
        pagePath: newPagePath,
      });

      navigate(
        {
          pathname: newPagePath,
          search: 'from=ai-providers',
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
