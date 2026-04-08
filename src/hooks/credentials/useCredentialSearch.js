import { useCallback } from 'react';

import { useLocation, useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useGroupedCategories } from '@/[fsd]/shared/lib/hooks';
import RouteDefinitions from '@/routes.js';

export const useCredentialSearch = ({ credentialsMenuItems } = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { credentialType } = useParams();
  const [searchParams] = useSearchParams();
  const isFromSettings = useMatch({ path: RouteDefinitions.CreateIntegration });

  // Helper function to get category for credentials
  const getCategoryForCredential = useCallback(credential => {
    return credential.category || 'Other';
  }, []);

  // Handle credential selection
  const onSelectItem = useCallback(
    credential => {
      const newSearchParams = new URLSearchParams(searchParams);
      if (credentialType !== credential.key) {
        // Set up route stack for proper back navigation
        const locationState = location.state || {};
        const routeStack = locationState.routeStack || [];
        const destRoute = !isFromSettings
          ? RouteDefinitions.CreateCredentialTypeFromMain
          : RouteDefinitions.CreateIntegrationWithType;
        const newPagePath = destRoute.replace(':credentialType', credential.key);
        // Create new route stack entry for credentials page
        const newRouteStack = [...routeStack];
        newRouteStack.push({
          breadCrumb: 'New Credential',
          pagePath: `${newPagePath}?${newSearchParams.toString()}`,
        });

        navigate(
          {
            pathname: newPagePath,
            search: newSearchParams.toString(),
          },
          {
            state: {
              routeStack: newRouteStack,
            },
          },
        );
      }

      if (credential.onClick) {
        credential.onClick();
      }
    },
    [searchParams, credentialType, location.state, isFromSettings, navigate],
  );

  // Use the generic search menu hook
  const searchMenuProps = useGroupedCategories(credentialsMenuItems, getCategoryForCredential, onSelectItem);

  return {
    ...searchMenuProps,
  };
};
