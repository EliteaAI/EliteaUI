import { useCallback } from 'react';

import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useIsCreatingEntities, useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import { usePageDetails } from '@/hooks/usePageDetails';
import RouteDefinitions from '@/routes';

export const useRestoreLastListRoute = () => {
  const navigate = useNavigate();
  const { pageType } = usePageDetails();
  const isCreatingNow = useIsCreatingEntities();
  const isFromUserPublic = useIsFrom(RouteDefinitions.UserPublic);

  const onMonitorProjectChange = useCallback(() => {
    if (pageType && !isCreatingNow) {
      const listRoute = NavigationHelpers.getListRouteByPageType(pageType);
      if (listRoute) {
        // Use flushSync to ensure navigation completes synchronously
        // This prevents React from batching and potentially ignoring the navigation
        flushSync(() => {
          navigate(listRoute, { replace: true });
        });
      }
    } else if (isFromUserPublic) {
      flushSync(() => {
        navigate(RouteDefinitions.Chat, { replace: true });
      });
    }
  }, [isCreatingNow, isFromUserPublic, navigate, pageType]);

  return {
    onMonitorProjectChange,
  };
};
