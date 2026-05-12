import { memo, useCallback, useEffect, useMemo } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Typography } from '@mui/material';

import { ApplicationCatalog } from '@/[fsd]/features/apps/ui/catalog';
import ToolkitsList from '@/[fsd]/features/toolkits/ui/list/ToolkitsList';
import { AppsTabs, ContentType } from '@/common/constants';
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

  const normalizedTab =
    LEGACY_APPS_TABS[tab] || (APP_TAB_INDEX_BY_KEY[tab] === undefined ? AppsTabs[0] : tab);
  const selectedTab = APP_TAB_INDEX_BY_KEY[normalizedTab] ?? APP_TAB_INDEX_BY_KEY[AppsTabs[0]];
  const isConfiguredTab = selectedTab === APP_TAB_INDEX_BY_KEY[AppsTabs[1]];

  useEffect(() => {
    if (normalizedTab === tab) return;

    navigate(`${RouteDefinitions.Apps}/${normalizedTab}${location.search}`, {
      replace: true,
      state: location.state,
    });
  }, [location.search, location.state, navigate, normalizedTab, tab]);

  const handleChangeTab = useCallback(
    nextTabIndex => {
      const nextTab = AppsTabs[nextTabIndex] || AppsTabs[0];
      navigate(`${RouteDefinitions.Apps}/${nextTab}${location.search}`, {
        state: location.state,
      });
    },
    [location.search, location.state, navigate],
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
