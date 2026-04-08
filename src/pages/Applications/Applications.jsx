import { memo, useCallback, useEffect, useMemo } from 'react';

import { useLocation, useMatch, useNavigate, useParams } from 'react-router-dom';

import { ToolbarImportButton } from '@/[fsd]/entities/import-wizard/ui';
import { ApplicationsTabs, PUBLIC_PROJECT_ID, PrivateApplicationTabs } from '@/common/constants';
import DateRangeSelect, { useTrendRange } from '@/components/DateRangeSelect';
import StickyTabs from '@/components/StickyTabs';
import ViewToggle from '@/components/ViewToggle';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useHasAdminPermissionOfThisEntity } from '@/hooks/users/usePermissions';
import RouteDefinitions, { PathSessionMap } from '@/routes';

import StatusFilterSelect from './Components/StatusFilterSelect';
import { useApplicationTabs } from './useApplicationTabs.jsx';
import { useApplicationsData } from './useApplicationsData';

const Applications = memo(() => {
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const hasAdminPermission = useHasAdminPermissionOfThisEntity('agents');
  const location = useLocation();
  const { state: locationState } = location;
  const { tab = 'latest' } = useParams();
  const isCreating = useMatch({ path: RouteDefinitions.CreateApplication });
  const { trendRange } = useTrendRange();

  const {
    latestTotal,
    myLikedTotal,
    trendingTotal,
    applicationsTotal,
    draftTotal,
    publishedTotal,
    moderationTotal,
    approvalTotal,
    rejectedTotal,
  } = useApplicationsData(projectId, trendRange, hasAdminPermission);

  const tabs = useApplicationTabs(
    projectId,
    latestTotal,
    myLikedTotal,
    trendingTotal,
    applicationsTotal,
    draftTotal,
    publishedTotal,
    moderationTotal,
    approvalTotal,
    rejectedTotal,
    trendRange,
    hasAdminPermission,
  );

  const selectedTab = useMemo(
    () =>
      projectId == PUBLIC_PROJECT_ID
        ? ApplicationsTabs.findIndex(item => item === tab)
        : PrivateApplicationTabs.findIndex(item => item === tab),
    [projectId, tab],
  );

  const onChangeTab = useCallback(
    newTab => {
      const pagePath =
        `${RouteDefinitions.Applications}/${projectId == PUBLIC_PROJECT_ID ? ApplicationsTabs[newTab] : PrivateApplicationTabs[newTab]}` +
        location.search;
      navigate(pagePath, {
        state: locationState
          ? {
              ...locationState,
              routeStack: [
                {
                  pagePath,
                  breadCrumb: PathSessionMap[RouteDefinitions.Applications],
                },
              ],
              trendRange,
            }
          : {
              routeStack: [
                {
                  pagePath,
                  breadCrumb: PathSessionMap[RouteDefinitions.Applications],
                },
              ],
            },
      });
    },
    [projectId, location.search, navigate, locationState, trendRange],
  );

  useEffect(() => {
    if (selectedTab === -1 && !isCreating) {
      onChangeTab(0);
    }
  }, [isCreating, onChangeTab, selectedTab]);

  return (
    <StickyTabs
      tabs={tabs}
      value={selectedTab}
      onChangeTab={onChangeTab}
      showTitleAndSwitchBySelect
      title="Agents"
      containerStyle={{ padding: '0 1.5rem 0 0' }}
      tabBarStyle={{ padding: '0 0.5rem 0 1.5rem' }}
      middleTabComponent={
        <>
          <ToolbarImportButton />
          {tab === 'trending' && <DateRangeSelect />}
          {projectId == PUBLIC_PROJECT_ID && (
            <StatusFilterSelect
              projectId={projectId}
              selectedTab={selectedTab}
              tabs={tabs}
              onChangeTab={onChangeTab}
            />
          )}
          <ViewToggle />
        </>
      }
    />
  );
});

Applications.displayName = 'Applications';

Applications.displayName = 'Applications';

export default Applications;
