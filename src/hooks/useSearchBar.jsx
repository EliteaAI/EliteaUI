import { useMemo } from 'react';

import { useLocation, useMatch } from 'react-router-dom';

import RouteDefinitions from '@/routes';

const useSearchBar = () => {
  const { pathname } = useLocation();
  const isPublicApplicationsPage = useMatch({ path: RouteDefinitions.ApplicationsWithTab });
  const isPipelinesPage = useMatch({ path: RouteDefinitions.PipelinesWithTab });
  const isToolkitsPage = useMatch({ path: RouteDefinitions.ToolkitsWithTab });
  const isMCPsPage = useMatch({ path: RouteDefinitions.MCPsWithTab });
  const isCredentialsPage = useMatch({ path: RouteDefinitions.CredentialsWithTab });
  const isUserPublicPage = useMatch({ path: RouteDefinitions.UserPublicWithTab });
  const isCreatingNow = useMemo(() => pathname.includes('/create'), [pathname]);

  const showSearchBar = useMemo(() => {
    return (
      !isCreatingNow &&
      (isPublicApplicationsPage ||
        isPipelinesPage ||
        isToolkitsPage ||
        isCredentialsPage ||
        isUserPublicPage ||
        isMCPsPage)
    );
  }, [
    isCreatingNow,
    isPublicApplicationsPage,
    isPipelinesPage,
    isToolkitsPage,
    isCredentialsPage,
    isUserPublicPage,
    isMCPsPage,
  ]);
  return {
    showSearchBar,
    isPublicApplicationsPage,
    isUserPublicPage,
    isPipelinesPage,
    isToolkitsPage,
    isCredentialsPage,
    isMCPsPage,
  };
};

export default useSearchBar;
