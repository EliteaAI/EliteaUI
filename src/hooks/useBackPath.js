import { useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import {
  ApplicationsTabs,
  PUBLIC_PROJECT_ID,
  SearchParams,
  ToolkitsTabs,
  UserPublicTabs,
  UserSettingsTabs,
  ViewMode,
} from '@/common/constants';
import { useAuthorIdFromUrl, useAuthorNameFromUrl, useNameFromUrl } from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useViewMode from '@/hooks/useViewMode';

import RouteDefinitions, { PathSessionMap } from '../routes';

const getPrevPathName = (routeStack, currentPath, name, authorName) => {
  if (routeStack.length > 1) {
    return routeStack[routeStack.length - 2].breadCrumb;
  } else {
    if (currentPath.startsWith(RouteDefinitions.Applications)) {
      return PathSessionMap[RouteDefinitions.Applications];
    } else if (currentPath.startsWith(RouteDefinitions.Pipelines)) {
      return PathSessionMap[RouteDefinitions.Pipelines];
    } else if (currentPath.startsWith(RouteDefinitions.Toolkits)) {
      return PathSessionMap[RouteDefinitions.Toolkits];
    } else if (currentPath.startsWith(RouteDefinitions.Apps)) {
      return PathSessionMap[RouteDefinitions.Apps];
    } else if (currentPath.startsWith(RouteDefinitions.UserPublic)) {
      if (name && authorName) {
        return authorName;
      }
      return PathSessionMap[RouteDefinitions.UserPublic];
    } else if (
      currentPath.startsWith(RouteDefinitions.CreatePersonalToken) ||
      currentPath.startsWith(RouteDefinitions.CreateIntegration) ||
      currentPath.match(/\/settings\/edit-integration\/\d+/g)
    ) {
      return PathSessionMap[RouteDefinitions.Settings];
    }
    return '';
  }
};

const getTabFromUrl = (url, defaultTab) => {
  const paths = url.split('/').filter(item => item.length > 0);
  const tab = paths.length > 2 ? paths[1] : defaultTab;
  return tab;
};

const getPrevPath = (routeStack, currentPath, search, viewMode, authorId, authorName) => {
  if (routeStack.length > 1) {
    return routeStack[routeStack.length - 2].pagePath;
  } else {
    if (currentPath.startsWith(RouteDefinitions.Applications)) {
      return `${RouteDefinitions.Applications}/${getTabFromUrl(currentPath, ApplicationsTabs[0])}?${SearchParams.ViewMode}=${viewMode}`;
    } else if (currentPath.startsWith(RouteDefinitions.Pipelines)) {
      return `${RouteDefinitions.Pipelines}/${getTabFromUrl(currentPath, ApplicationsTabs[0])}?${SearchParams.ViewMode}=${viewMode}`;
    } else if (
      currentPath.startsWith(RouteDefinitions.Toolkits) &&
      search.includes(SearchParams.ToolkitType)
    ) {
      return `${RouteDefinitions.CreateToolkit}/?${SearchParams.ViewMode}=${viewMode}`;
    } else if (
      currentPath.startsWith(RouteDefinitions.Toolkits) &&
      !search.includes(SearchParams.ToolkitType)
    ) {
      return `${RouteDefinitions.Toolkits}/${getTabFromUrl(currentPath, ToolkitsTabs[0])}?${SearchParams.ViewMode}=${viewMode}`;
    } else if (currentPath.startsWith(RouteDefinitions.MCPs) && search.includes(SearchParams.ToolkitType)) {
      return `${RouteDefinitions.CreateMCP}/?${SearchParams.ViewMode}=${viewMode}`;
    } else if (currentPath.startsWith(RouteDefinitions.MCPs) && !search.includes(SearchParams.ToolkitType)) {
      return `${RouteDefinitions.MCPs}/${getTabFromUrl(currentPath, ToolkitsTabs[0])}?${SearchParams.ViewMode}=${viewMode}`;
    } else if (currentPath.startsWith(RouteDefinitions.Apps) && hasSubPath(currentPath)) {
      // Handle /apps/create/:appType - go back to /apps/create
      return `${RouteDefinitions.CreateApp}/?${SearchParams.ViewMode}=${viewMode}`;
    } else if (currentPath.startsWith(RouteDefinitions.Apps) && !hasSubPath(currentPath)) {
      // Handle /apps/create (selector page) - go back to apps list
      return `${RouteDefinitions.Apps}/all?${SearchParams.ViewMode}=${viewMode}`;
    } else if (currentPath.startsWith(RouteDefinitions.UserPublic)) {
      if (currentPath.match(/\/user-public\/pipelines\/\d+/g)) {
        return `${RouteDefinitions.UserPublic}/${UserPublicTabs[2]}?${SearchParams.ViewMode}=${viewMode}&${SearchParams.AuthorId}=${authorId}&${SearchParams.AuthorName}=${authorName}`;
      } else if (currentPath.match(/\/user-public\/agents\/\d+/g)) {
        return `${RouteDefinitions.UserPublic}/${UserPublicTabs[1]}?${SearchParams.ViewMode}=${viewMode}&${SearchParams.AuthorId}=${authorId}&${SearchParams.AuthorName}=${authorName}`;
      }
      return RouteDefinitions.Chat;
    } else if (currentPath.startsWith(RouteDefinitions.CreatePersonalToken)) {
      return `${RouteDefinitions.Settings}/information`;
    } else if (
      currentPath.startsWith(RouteDefinitions.CreateIntegration) ||
      currentPath.match(/\/settings\/edit-integration\/\d+/g)
    ) {
      return `${RouteDefinitions.Settings}/${UserSettingsTabs[1]}`;
    }
    return '';
  }
};

const getPrevState = (routeStack, prevPath, prevPathName, viewMode) => {
  if (routeStack.length > 1) {
    return {
      routeStack: routeStack.slice(0, routeStack.length - 1),
    };
  } else {
    return {
      routeStack: [
        {
          pagePath: prevPath,
          breadCrumb: prevPathName,
          viewMode,
        },
      ],
    };
  }
};

const hasSubPath = url => {
  const paths = url.split('/').filter(item => item.length > 0);
  return paths.length > 2;
};

export default function useBackPath() {
  const { pathname, search, state: locationState } = useLocation();
  // const location = useLocation();
  const isCreating = useMemo(
    () =>
      pathname.startsWith(RouteDefinitions.CreateApplication) ||
      pathname.startsWith(RouteDefinitions.CreatePipeline) ||
      pathname.startsWith(RouteDefinitions.CreateToolkit) ||
      pathname.startsWith(RouteDefinitions.CreateMCP) ||
      pathname.startsWith(RouteDefinitions.CreateApp),
    [pathname],
  );
  const name = useNameFromUrl();
  const viewMode = useViewMode();
  const selectedProjectId = useSelectedProjectId();
  const authorName = useAuthorNameFromUrl();
  const authorId = useAuthorIdFromUrl();
  const { routeStack } = locationState ?? { routeStack: [] };
  const hasMultiplePaths = useMemo(() => {
    if (routeStack.length > 1) {
      return true;
    } else {
      if (pathname.startsWith(RouteDefinitions.Applications)) {
        return hasSubPath(pathname);
      } else if (pathname.startsWith(RouteDefinitions.Pipelines)) {
        return hasSubPath(pathname);
      } else if (pathname.startsWith(RouteDefinitions.Toolkits)) {
        return hasSubPath(pathname);
      } else if (pathname.startsWith(RouteDefinitions.Apps)) {
        return hasSubPath(pathname);
      } else if (pathname.startsWith(RouteDefinitions.UserPublic)) {
        return true;
      } else if (pathname.startsWith(RouteDefinitions.CreatePersonalToken)) {
        return true;
      } else if (pathname.startsWith(RouteDefinitions.CreateIntegration)) {
        return true;
      } else if (pathname.match(/\/settings\/edit-integration\/\d+/g)) {
        return true;
      }
      return false;
    }
  }, [routeStack.length, pathname]);

  const prevPathInfo = useMemo(() => {
    if (hasMultiplePaths || isCreating) {
      const realViewMode =
        selectedProjectId != PUBLIC_PROJECT_ID && viewMode === ViewMode.Public ? ViewMode.Owner : viewMode;
      const prevPath = getPrevPath(routeStack, pathname, search, realViewMode, authorId, authorName);
      const prevPathName = getPrevPathName(routeStack, pathname, name, authorName);
      const prevState = getPrevState(routeStack, prevPath, prevPathName, realViewMode);
      return {
        prevPath,
        prevState,
      };
    }
    return {};
  }, [
    hasMultiplePaths,
    isCreating,
    routeStack,
    pathname,
    viewMode,
    authorId,
    authorName,
    selectedProjectId,
    name,
    search,
  ]);

  return prevPathInfo;
}
