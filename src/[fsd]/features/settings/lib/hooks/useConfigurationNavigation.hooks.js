import { useCallback, useMemo } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { SearchParams, ViewMode } from '@/common/constants';
import RouteDefinitions from '@/routes';

export const useConfigurationNavigation = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const locationState = useMemo(() => state || { from: [], routeStack: [] }, [state]);

  const navigateToConfiguration = useCallback(
    (configurationId, section) => {
      const newRouteStack = [...(locationState.routeStack ?? [])];
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
          state: { routeStack: newRouteStack, expandSection: section },
        },
      );
    },
    [locationState, navigate],
  );

  const navigateToCreateConfiguration = useCallback(() => {
    const search = `${SearchParams.ViewMode}=${ViewMode.Owner}&from=ai-providers`;
    const aiProvidersPath = RouteDefinitions.SettingsWithTab.replace(':tab', 'ai-providers');

    navigate(
      { pathname: RouteDefinitions.CreateConfiguration, search },
      {
        state: {
          routeStack: [
            {
              breadCrumb: 'AI Providers',
              pagePath: `${aiProvidersPath}?${SearchParams.ViewMode}=${ViewMode.Owner}`,
            },
            {
              breadCrumb: 'New AI Provider',
              viewMode: ViewMode.Owner,
              pagePath: `${RouteDefinitions.CreateConfiguration}?${search}`,
            },
          ],
        },
      },
    );
  }, [navigate]);

  return { navigateToConfiguration, navigateToCreateConfiguration };
};
