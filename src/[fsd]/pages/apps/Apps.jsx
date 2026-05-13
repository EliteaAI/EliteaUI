import { memo, useCallback, useEffect, useMemo } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Typography } from '@mui/material';

import { ApplicationCatalog } from '@/[fsd]/features/apps/ui/catalog';
import ToolkitsList from '@/[fsd]/features/toolkits/ui/list/ToolkitsList';
import { AppsTabs, ContentType, SearchParams } from '@/common/constants';
import StickyTabs from '@/components/StickyTabs';
import ViewToggle from '@/components/ViewToggle';
import useShouldCollapseRightToolbar from '@/hooks/useShouldCollapseRightToolbar';
import RouteDefinitions from '@/routes';

const LEGACY_APPS_TABS = {
  all: AppsTabs[1],
};

const APP_TAB_INDEX_BY_KEY = AppsTabs.reduce((acc, tab, index) => {
  acc[tab] = index;
  return acc;
}, {});

const CONFIGURED_APPS_EMPTY_PLACEHOLDER = (
  <Typography component="span">
    No configured applications yet. Use the Request App tab to request or create one for this project.
  </Typography>
);

const Apps = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab = AppsTabs[0] } = useParams();
  const { shouldCollapseRightToolbar } = useShouldCollapseRightToolbar();

  const getSearchForAppsTab = useCallback((nextTab, search) => {
    if (nextTab !== AppsTabs[0]) return search;

    const searchParams = new URLSearchParams(search);
    searchParams.delete(SearchParams.View);

    const nextSearch = searchParams.toString();
    return nextSearch ? `?${nextSearch}` : '';
  }, []);

  const normalizedTab =
    LEGACY_APPS_TABS[tab] || (APP_TAB_INDEX_BY_KEY[tab] === undefined ? AppsTabs[0] : tab);
  const normalizedSearch = useMemo(
    () => getSearchForAppsTab(normalizedTab, location.search),
    [getSearchForAppsTab, location.search, normalizedTab],
  );
  const selectedTab = APP_TAB_INDEX_BY_KEY[normalizedTab] ?? APP_TAB_INDEX_BY_KEY[AppsTabs[0]];
  const isConfiguredTab = selectedTab === APP_TAB_INDEX_BY_KEY[AppsTabs[1]];

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
        label: 'Request App',
        content: <ApplicationCatalog />,
      },
      {
        label: 'Configured',
        content: (
          <ToolkitsList
            isApplication={true}
            cardContentType={ContentType.AppAll}
            disableEmptyRedirect={true}
            emptyListPlaceHolder={CONFIGURED_APPS_EMPTY_PLACEHOLDER}
          />
        ),
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
