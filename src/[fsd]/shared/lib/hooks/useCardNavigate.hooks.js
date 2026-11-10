import { useCallback, useMemo } from 'react';

import { useLocation, useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { CardNavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import {
  ApplicationsTabs,
  PUBLIC_PROJECT_ID,
  SearchParams,
  UserPublicTabs,
  ViewMode,
  publicTabs,
} from '@/common/constants';
import RouteDefinitions, { PathSessionMap } from '@/routes';

import { useSearchBar } from './useSearchBar.hooks';
import { useAuthorIdFromUrl, useAuthorNameFromUrl } from './useSearchParamValue.hooks';
import { useSelectedProjectId } from './useSelectedProject.hooks';

const buildReplaceNavOptions = (pagePath, locationState, breadCrumb) => {
  const { routeStack } = locationState || {};
  const newRouteStack = [...(routeStack || [])];
  const stackLength = newRouteStack.length;
  const newRouteInfo = breadCrumb
    ? {
        breadCrumb,
        pagePath,
      }
    : {
        pagePath,
      };
  newRouteStack.splice(stackLength - 1, 1, {
    ...newRouteStack[stackLength - 1],
    ...newRouteInfo,
  });

  return {
    replace: true,
    state: {
      ...locationState,
      routeStack: newRouteStack,
    },
  };
};

export const useSetUrlSearchParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const setUrlSearchParams = useCallback(
    params => {
      const newSearchParams = new URLSearchParams(searchParams);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          newSearchParams.set(key, value);
        } else {
          newSearchParams.delete(key);
        }
      });

      const newPagePath = location.pathname + '?' + newSearchParams.toString();
      setSearchParams(newSearchParams, buildReplaceNavOptions(newPagePath, location.state));
    },
    [location.pathname, location.state, searchParams, setSearchParams],
  );
  return setUrlSearchParams;
};
const useCardNavigationTarget = props => {
  const {
    viewMode,
    id,
    type,
    name,
    extraParam,
    anchor = '',
    replace = false,
    projectId = null,
    customTab = null,
  } = props;
  const { state } = useLocation();
  const authorName = useAuthorNameFromUrl();
  const authorId = useAuthorIdFromUrl();
  const { tab = customTab ?? 'latest' } = useParams();
  const { routeStack = [] } = useMemo(() => state || { routeStack: [] }, [state]);

  return useMemo(() => {
    const { pathname, search, pagePath } = CardNavigationHelpers.buildCardNavigation({
      type,
      id,
      tab,
      projectId,
      viewMode,
      name,
      extraParam,
      anchor,
      authorName,
      authorId,
    });
    const newRouteStack = [...routeStack];
    const routeInfo = { breadCrumb: name, viewMode, pagePath };
    if (replace) {
      newRouteStack.splice(routeStack.length - 1, 1, routeInfo);
    } else {
      newRouteStack.push(routeInfo);
    }

    return {
      to: { pathname, search },
      replace,
      state: { routeStack: newRouteStack },
    };
  }, [
    anchor,
    extraParam,
    viewMode,
    name,
    authorName,
    authorId,
    tab,
    routeStack,
    type,
    replace,
    projectId,
    id,
  ]);
};

export const useCardNavigate = props => {
  const navigate = useNavigate();
  const { to, replace, state } = useCardNavigationTarget(props);

  return useCallback(() => {
    navigate(to, { replace, state });
  }, [navigate, to, replace, state]);
};

/**
 * Same destination as `useCardNavigate`, returned as props for a router `<Link>` so the browser gets a
 * real `href` ("Open link in new tab", Ctrl/Cmd+Click, middle-click). A plain left click still navigates
 * in-app and carries the breadcrumb `routeStack` in `state`.
 */
export const useCardLink = props => {
  const { to, replace, state } = useCardNavigationTarget(props);

  return useMemo(() => ({ to, replace, state }), [to, replace, state]);
};

const buildQueryParams = params => {
  let result = '';
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      const paramString = (result ? '&' : '') + `${key}=${value}`;
      result += paramString;
    }
  }
  return result;
};

export const useSearchPromptNavigate = () => {
  const { state } = useLocation();
  const { routeStack = [] } = useMemo(() => state || { routeStack: [] }, [state]);

  const authorName = useAuthorNameFromUrl();
  const authorId = useAuthorIdFromUrl();
  const navigate = useNavigate();
  const {
    isPublicApplicationsPage,
    isUserPublicPage,
    isPipelinesPage,
    isToolkitsPage,
    isMCPsPage,
    isCredentialsPage,
    isSkillsPage,
  } = useSearchBar();

  const tab = useMemo(
    () =>
      (
        isPublicApplicationsPage ||
        isPipelinesPage ||
        isUserPublicPage ||
        isToolkitsPage ||
        isMCPsPage ||
        isCredentialsPage ||
        isSkillsPage
      )?.params?.tab,
    [
      isPublicApplicationsPage,
      isPipelinesPage,
      isUserPublicPage,
      isToolkitsPage,
      isMCPsPage,
      isCredentialsPage,
      isSkillsPage,
    ],
  );

  const destRoute = useMemo(() => {
    if (isPublicApplicationsPage) {
      return RouteDefinitions.Applications;
    } else if (isPipelinesPage) {
      return RouteDefinitions.Pipelines;
    } else if (isToolkitsPage) {
      return RouteDefinitions.Toolkits;
    } else if (isMCPsPage) {
      return RouteDefinitions.MCPs;
    } else if (isCredentialsPage) {
      return RouteDefinitions.Credentials;
    } else if (isSkillsPage) {
      return RouteDefinitions.Skills;
    }
  }, [
    isPipelinesPage,
    isPublicApplicationsPage,
    isToolkitsPage,
    isMCPsPage,
    isCredentialsPage,
    isSkillsPage,
  ]);

  const getDestPath = useCallback(
    userPublicEntityType => {
      const defaultPath = {
        basePathname: destRoute + `/${tab}/`,
        viewMode: publicTabs.includes(tab) ? ViewMode.Public : ViewMode.Owner,
      };

      if (
        isPublicApplicationsPage ||
        isPipelinesPage ||
        isToolkitsPage ||
        isMCPsPage ||
        isCredentialsPage ||
        isSkillsPage
      )
        return defaultPath;

      if (isUserPublicPage)
        return {
          basePathname: RouteDefinitions.UserPublic + `/${userPublicEntityType || tab}/`,
          viewMode: ViewMode.Owner,
        };

      return defaultPath;
    },
    [
      isPublicApplicationsPage,
      isPipelinesPage,
      isUserPublicPage,
      isToolkitsPage,
      isMCPsPage,
      isCredentialsPage,
      isSkillsPage,
      tab,
      destRoute,
    ],
  );

  const doNavigate = useCallback(
    ({ viewMode, pathname, name, anchor = '' }) => {
      const params = {
        [SearchParams.ViewMode]: viewMode,
        [SearchParams.Name]: encodeURIComponent(name),
        [SearchParams.AuthorName]: authorName ? encodeURIComponent(authorName) : undefined,
        [SearchParams.AuthorId]: authorId,
      };
      const search = buildQueryParams(params);
      const query = anchor + '?' + search;
      const pagePath = pathname + query;
      const newRouteStack = [
        ...routeStack,
        {
          breadCrumb: name,
          viewMode,
          pagePath,
        },
      ];

      navigate(
        {
          pathname,
          search,
        },
        {
          replace: false,
          state: {
            routeStack: newRouteStack,
          },
        },
      );
    },
    [authorName, authorId, routeStack, navigate],
  );

  const navigateToDetail = useCallback(
    ({ id, name, anchor, userPublicEntityType }) => {
      const { basePathname, viewMode } = getDestPath(userPublicEntityType);
      const pathname = basePathname + id;
      doNavigate({
        viewMode,
        pathname,
        name,
        anchor,
      });
    },
    [getDestPath, doNavigate],
  );

  return {
    navigateToDetail,
  };
};

const useMatchApplicationsWithTab = () => {
  const result = useMatch({ path: RouteDefinitions.ApplicationsWithTab });
  return {
    isApplicationsWithTab: !!result,
    breadCrumbs: {
      breadCrumb: PathSessionMap[RouteDefinitions.Applications],
      pagePath: `${RouteDefinitions.Applications}/${ApplicationsTabs[0]}`,
    },
  };
};

export const useNavigateToAuthorPublicPage = () => {
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const { tab = -1 } = useParams();
  const currentAuthorId = useAuthorIdFromUrl();
  const selectedProjectId = useSelectedProjectId();
  const { isApplicationsWithTab, breadCrumbs: applicationBreadCrumbs } = useMatchApplicationsWithTab();
  const currentBreadCrumbs = useMemo(
    () => (isApplicationsWithTab ? applicationBreadCrumbs : undefined),
    [applicationBreadCrumbs, isApplicationsWithTab],
  );

  const navigateToAuthorPublicPage = useCallback(
    (authorId, authorName, viewMode = null) =>
      () => {
        const searchString = `${SearchParams.ViewMode}=${viewMode ? viewMode : selectedProjectId === PUBLIC_PROJECT_ID ? ViewMode.Public : ViewMode.Owner}`;
        const authorString = `&${SearchParams.AuthorId}=${authorId}`;
        const newPath = `${RouteDefinitions.UserPublic}/${UserPublicTabs.find(item => item === tab) ? tab : UserPublicTabs[0]}`;
        const pagePath = `${newPath}?${searchString}${authorString}&${SearchParams.AuthorName}=${authorName}`;
        if (pathname !== newPath || currentAuthorId !== authorId) {
          const navigateOptions = currentAuthorId
            ? buildReplaceNavOptions(pagePath, state, authorName)
            : {
                state: {
                  routeStack: currentBreadCrumbs
                    ? [
                        currentBreadCrumbs,
                        {
                          breadCrumb: authorName,
                          pagePath,
                        },
                      ]
                    : [
                        {
                          breadCrumb: authorName,
                          pagePath,
                        },
                      ],
                },
              };
          navigate(pagePath, navigateOptions);
        }
      },
    [currentAuthorId, currentBreadCrumbs, navigate, pathname, selectedProjectId, state, tab],
  );

  return { navigateToAuthorPublicPage };
};
