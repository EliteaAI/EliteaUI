import { memo, useCallback, useEffect, useMemo } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ApplicationCatalog } from '@/[fsd]/features/apps/ui/catalog';
import ToolkitsList from '@/[fsd]/features/toolkits/ui/list/ToolkitsList';
import { useToolkitsListQuery } from '@/api/toolkits';
import AppCatalogIcon from '@/assets/app-catalog-icon.svg?react';
import ApplicationsIcon from '@/assets/applications-icon.svg?react';
import { AppsTabs, ContentType, SearchParams } from '@/common/constants';
import StickyTabs from '@/components/StickyTabs';
import ViewToggle from '@/components/ViewToggle';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useShouldCollapseRightToolbar from '@/hooks/useShouldCollapseRightToolbar';
import RouteDefinitions from '@/routes';

const LEGACY_APPS_TABS = {
  all: AppsTabs[1],
};

const APP_TAB_INDEX_BY_KEY = AppsTabs.reduce((acc, tab, index) => {
  acc[tab] = index;
  return acc;
}, {});

const Apps = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams();
  const { shouldCollapseRightToolbar } = useShouldCollapseRightToolbar();
  const projectId = useSelectedProjectId();

  const { data: applicationsData } = useToolkitsListQuery(
    { projectId, page: 1, page_size: 1, params: { application: true } },
    { skip: !projectId },
  );

  const hasApplications = (applicationsData?.total ?? 0) > 0;
  const defaultTab = hasApplications ? AppsTabs[0] : AppsTabs[1];

  const getSearchForAppsTab = useCallback((nextTab, search) => {
    if (nextTab !== AppsTabs[1]) return search;

    const searchParams = new URLSearchParams(search);
    searchParams.delete(SearchParams.View);

    const nextSearch = searchParams.toString();
    return nextSearch ? `?${nextSearch}` : '';
  }, []);

  const normalizedTab = useMemo(() => {
    if (LEGACY_APPS_TABS[tab]) return LEGACY_APPS_TABS[tab];

    if (APP_TAB_INDEX_BY_KEY[tab] === undefined) return defaultTab;

    return tab;
  }, [tab, defaultTab]);
  const normalizedSearch = useMemo(
    () => getSearchForAppsTab(normalizedTab, location.search),
    [getSearchForAppsTab, location.search, normalizedTab],
  );
  const selectedTab = APP_TAB_INDEX_BY_KEY[normalizedTab] ?? APP_TAB_INDEX_BY_KEY[AppsTabs[1]];
  const isConfiguredTab = selectedTab === APP_TAB_INDEX_BY_KEY[AppsTabs[0]];

  useEffect(() => {
    if (normalizedTab === tab && normalizedSearch === location.search) return;

    navigate(`${RouteDefinitions.Apps}/${normalizedTab}${normalizedSearch}`, {
      replace: true,
      state: location.state,
    });
  }, [location.search, location.state, navigate, normalizedSearch, normalizedTab, tab]);

  const handleChangeTab = useCallback(
    nextTabIndex => {
      const nextTab = AppsTabs[nextTabIndex] || AppsTabs[0];
      const nextSearch = getSearchForAppsTab(nextTab, location.search);

      navigate(`${RouteDefinitions.Apps}/${nextTab}${nextSearch}`, {
        state: location.state,
      });
    },
    [getSearchForAppsTab, location.search, location.state, navigate],
  );

  const tabs = useMemo(
    () => [
      {
        label: 'Applications',
        content: (
          <ToolkitsList
            isApplication={true}
            cardContentType={ContentType.AppAll}
            disableEmptyRedirect={true}
          />
        ),
        icon: <ApplicationsIcon />,
      },
      {
        label: 'App Catalog',
        content: <ApplicationCatalog />,
        icon: <AppCatalogIcon />,
      },
    ],
    [],
  );

  return (
    <StickyTabs
      tabs={tabs}
      value={selectedTab}
      containerStyle={{ padding: '0 1.5rem 0 0' }}
      tabBarStyle={{ padding: '0 0.5rem 0 1.5rem' }}
      noRightPanel={!isConfiguredTab || shouldCollapseRightToolbar}
      middleTabComponent={isConfiguredTab ? <ViewToggle /> : undefined}
      onChangeTab={handleChangeTab}
    />
  );
});

Apps.displayName = 'Apps';

export default Apps;
