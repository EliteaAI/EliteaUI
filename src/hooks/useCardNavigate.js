import { useCallback, useMemo } from 'react';

import { useLocation, useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
  ApplicationsTabs,
  ContentType,
  PUBLIC_PROJECT_ID,
  SearchParams,
  UserPublicTabs,
  ViewMode,
  publicTabs,
} from '@/common/constants';
import { useAuthorIdFromUrl, useAuthorNameFromUrl } from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions, { PathSessionMap } from '@/routes';

import useSearchBar from './useSearchBar';

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
const useCardNavigate = props => {
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
  const navigate = useNavigate();
  const doNavigate = useCallback(() => {
    const query = `${anchor}?${extraParam || ''}${SearchParams.ViewMode}=${viewMode}&${SearchParams.Name}=${encodeURIComponent(name)}${authorName ? `&${SearchParams.AuthorName}=${encodeURIComponent(authorName)}` : ''}${authorId ? `&${SearchParams.AuthorId}=${authorId}` : ''}`;

    // Helper function to build URL with optional project ID prefix
    const buildUrl = (route, pathSegment) =>
      projectId ? `/${projectId}${route}/${pathSegment}/${id}` : `${route}/${pathSegment}/${id}`;

    const urlMap = {
      [ContentType.ApplicationAdmin]: buildUrl(RouteDefinitions.Applications, tab),
      [ContentType.ApplicationAll]: buildUrl(RouteDefinitions.Applications, tab),
      [ContentType.ApplicationApproval]: buildUrl(RouteDefinitions.Applications, tab),
      [ContentType.ApplicationDraft]: buildUrl(RouteDefinitions.Applications, tab),
      [ContentType.ApplicationModeration]: buildUrl(RouteDefinitions.Applications, tab),
      [ContentType.ApplicationPublished]: buildUrl(RouteDefinitions.Applications, tab),
      [ContentType.ApplicationRejected]: buildUrl(RouteDefinitions.Applications, tab),
      [ContentType.PipelineAdmin]: buildUrl(RouteDefinitions.Pipelines, tab),
      [ContentType.PipelineAll]: buildUrl(RouteDefinitions.Pipelines, tab),
      [ContentType.PipelineApproval]: buildUrl(RouteDefinitions.Pipelines, tab),
      [ContentType.PipelineDraft]: buildUrl(RouteDefinitions.Pipelines, tab),
      [ContentType.PipelineModeration]: buildUrl(RouteDefinitions.Pipelines, tab),
      [ContentType.PipelinePublished]: buildUrl(RouteDefinitions.Pipelines, tab),
      [ContentType.PipelineRejected]: buildUrl(RouteDefinitions.Pipelines, tab),
      [ContentType.ToolkitAdmin]: buildUrl(RouteDefinitions.Toolkits, tab),
      [ContentType.ToolkitAll]: buildUrl(RouteDefinitions.Toolkits, tab),
      [ContentType.AppAll]: buildUrl(RouteDefinitions.Apps, tab),
      [ContentType.MCPAll]: buildUrl(RouteDefinitions.MCPs, tab),
      [ContentType.CredentialAll]: buildUrl(RouteDefinitions.Credentials, tab),
      [ContentType.ApplicationTop]: buildUrl(RouteDefinitions.Applications, 'top'),
      [ContentType.ApplicationLatest]: buildUrl(RouteDefinitions.Applications, 'latest'),
      [ContentType.ApplicationMyLiked]: buildUrl(RouteDefinitions.Applications, 'my-liked'),
      [ContentType.ApplicationTrending]: buildUrl(RouteDefinitions.Applications, 'trending'),
      [ContentType.PipelineTop]: buildUrl(RouteDefinitions.Pipelines, 'top'),
      [ContentType.PipelineLatest]: buildUrl(RouteDefinitions.Pipelines, 'latest'),
      [ContentType.PipelineMyLiked]: buildUrl(RouteDefinitions.Pipelines, 'my-liked'),
      [ContentType.PipelineTrending]: buildUrl(RouteDefinitions.Pipelines, 'trending'),
      [ContentType.ModerationSpaceApplication]: buildUrl(RouteDefinitions.ModerationSpace, 'agents'),
      [ContentType.UserPublicApplications]: buildUrl(RouteDefinitions.UserPublic, 'agents'),
      [ContentType.UserPublicPipelines]: buildUrl(RouteDefinitions.UserPublic, 'pipelines'),
      [ContentType.UserPublicToolkits]: buildUrl(RouteDefinitions.UserPublic, 'toolkits'),
      [ContentType.UserPublicMCPs]: buildUrl(RouteDefinitions.UserPublic, 'mcps'),
    };
    const searchMap = {
      [ContentType.DatasourcesAdmin]: query,
      [ContentType.DatasourcesAll]: query,
      [ContentType.DatasourcesApproval]: query,
      [ContentType.DatasourcesDraft]: query,
      [ContentType.DatasourcesModeration]: query,
      [ContentType.DatasourcesPublished]: query,
      [ContentType.DatasourcesRejected]: query,
      [ContentType.ApplicationAdmin]: query,
      [ContentType.ApplicationAll]: query,
      [ContentType.ApplicationApproval]: query,
      [ContentType.ApplicationDraft]: query,
      [ContentType.ApplicationModeration]: query,
      [ContentType.ApplicationPublished]: query,
      [ContentType.ApplicationRejected]: query,
      [ContentType.PipelineAdmin]: query,
      [ContentType.PipelineAll]: query,
      [ContentType.PipelineApproval]: query,
      [ContentType.PipelineDraft]: query,
      [ContentType.PipelineModeration]: query,
      [ContentType.PipelinePublished]: query,
      [ContentType.PipelineRejected]: query,
      [ContentType.ToolkitAdmin]: query,
      [ContentType.ToolkitAll]: query,
      [ContentType.AppAll]: query,
      [ContentType.MCPAll]: query,
      [ContentType.CredentialAll]: query,
      [ContentType.MyLibraryApplications]: query,
      [ContentType.MyLibraryDatasources]: query,
      [ContentType.ApplicationTop]: query,
      [ContentType.ApplicationLatest]: query,
      [ContentType.ApplicationMyLiked]: query,
      [ContentType.PipelineTop]: query,
      [ContentType.PipelineLatest]: query,
      [ContentType.PipelineMyLiked]: query,
      [ContentType.DatasourcesLatest]: query,
      [ContentType.DatasourcesMyLiked]: query,
      [ContentType.ModerationSpaceApplication]: query,
      [ContentType.ModerationSpacePipeline]: query,
      [ContentType.UserPublicApplications]: query,
      [ContentType.UserPublicPipelines]: query,
      [ContentType.UserPublicToolkits]: query,
      [ContentType.UserPublicMCPs]: query,
    };
    const newRouteStack = [...routeStack];
    const pagePath = `${urlMap[type]}${searchMap[type]}`;
    if (replace) {
      newRouteStack.splice(routeStack.length - 1, 1, {
        breadCrumb: name,
        viewMode,
        pagePath,
      });
    } else {
      newRouteStack.push({
        breadCrumb: name,
        viewMode,
        pagePath,
      });
    }

    navigate(
      {
        pathname: urlMap[type],
        search: searchMap[type],
      },
      {
        replace,
        state: {
          routeStack: newRouteStack,
        },
      },
    );
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
    navigate,
    projectId,
    id,
  ]);
  return doNavigate;
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
  } = useSearchBar();

  const tab = useMemo(
    () =>
      (
        isPublicApplicationsPage ||
        isPipelinesPage ||
        isUserPublicPage ||
        isToolkitsPage ||
        isMCPsPage ||
        isCredentialsPage
      )?.params?.tab,
    [
      isPublicApplicationsPage,
      isPipelinesPage,
      isUserPublicPage,
      isToolkitsPage,
      isMCPsPage,
      isCredentialsPage,
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
    }
  }, [isPipelinesPage, isPublicApplicationsPage, isToolkitsPage, isMCPsPage, isCredentialsPage]);

  const getDestPath = useCallback(
    userPublicEntityType => {
      const defaultPath = {
        basePathname: destRoute + `/${tab}/`,
        viewMode: publicTabs.includes(tab) ? ViewMode.Public : ViewMode.Owner,
      };

      if (isPublicApplicationsPage || isPipelinesPage || isToolkitsPage || isMCPsPage || isCredentialsPage)
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

export default useCardNavigate;
