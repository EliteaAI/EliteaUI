import { useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import RouteDefinitions from '@/routes';

export default function useFromApplications() {
  const { state, pathname } = useLocation();
  const { routeStack = [] } = state ?? {};
  return useMemo(() => {
    return (
      !!(
        routeStack.length && `/${routeStack[0]['breadCrumb']}`.toLowerCase() === RouteDefinitions.Applications
      ) ||
      pathname.startsWith(RouteDefinitions.Applications) ||
      pathname.startsWith(RouteDefinitions.UserPublicApplicationDetail) ||
      pathname.startsWith(RouteDefinitions.Pipelines) ||
      pathname.startsWith(RouteDefinitions.UserPublicPipelineDetail)
    );
  }, [pathname, routeStack]);
}
