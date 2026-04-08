import { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { ToolbarImportButton } from '@/[fsd]/entities/import-wizard/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import {
  useTotalApplicationsQuery,
  useTotalMyLikedPublicApplicationsQuery,
  useTotalPublicApplicationsQuery,
  useTotalTrendingPublicApplicationsQuery,
} from '@/api/applications';
import {
  ApplicationsTabs,
  CollectionStatus,
  ContentType,
  PUBLIC_PROJECT_ID,
  PrivateApplicationTabs,
  SearchParams,
  SortFields,
  SortOrderOptions,
} from '@/common/constants';
import DateRangeSelect, { useTrendRange } from '@/components/DateRangeSelect';
import AdminIcon from '@/components/Icons/AdminIcon';
import Champion from '@/components/Icons/Champion';
import Fire from '@/components/Icons/Fire';
import HeartIcon from '@/components/Icons/HeartIcon';
import StickyTabs from '@/components/StickyTabs';
import ViewToggle from '@/components/ViewToggle';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useTags from '@/hooks/useTags';
import { useHasAdminPermissionOfThisEntity } from '@/hooks/users/usePermissions';
import RouteDefinitions, { PathSessionMap } from '@/routes';
import { useTheme } from '@emotion/react';

import Latest from './Latest';
import MyLiked from './MyLiked';
import PrivatePipelinesList from './PrivatePipelinesList';
import Trending from './Trending';

const Pipelines = memo(() => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { state: locationState } = location;
  const { tab = 'latest' } = useParams();

  const [searchParams] = useSearchParams();

  const sortBy = useMemo(() => searchParams.get(SearchParams.SortBy) || SortFields.CreatedAt, [searchParams]);
  const sortOrder = useMemo(
    () => searchParams.get(SearchParams.SortOrder) || SortOrderOptions.DESC,
    [searchParams],
  );

  const { tagList } = useSelector(state => state.tags);

  const { query } = useSelector(state => state.search);
  const { selectedTagIds } = useTags(tagList);

  const projectId = useSelectedProjectId();

  const hasAdminPermission = useHasAdminPermissionOfThisEntity('agents');

  const isCreating = useMatch({ path: RouteDefinitions.CreatePipeline });
  const { trendRange } = useTrendRange();

  const styles = pipelinesStyles();

  const params = {
    query,
    tags: selectedTagIds,
    statuses: CollectionStatus.Published,
    agents_type: 'pipeline',
  };

  const { data: latestData } = useTotalPublicApplicationsQuery(
    {
      params,
    },
    { skip: !projectId || projectId != PUBLIC_PROJECT_ID },
  );

  const { data: myLikedData } = useTotalMyLikedPublicApplicationsQuery(
    {
      params: {
        ...params,
        my_liked: true,
      },
    },
    { skip: !projectId || projectId != PUBLIC_PROJECT_ID },
  );

  const { data: trendingData } = useTotalTrendingPublicApplicationsQuery(
    {
      params: {
        ...params,
        trend_start_period: trendRange,
      },
    },
    { skip: !projectId || projectId != PUBLIC_PROJECT_ID },
  );

  const { data: applicationsData } = useTotalApplicationsQuery(
    {
      projectId,
      params: {
        tags: selectedTagIds,
        query,
        agents_type: 'pipeline',
      },
    },
    {
      skip: !projectId || (projectId == PUBLIC_PROJECT_ID && !hasAdminPermission),
    },
  );

  const onChangeTab = useCallback(
    newTab => {
      const pagePath =
        `${RouteDefinitions.Pipelines}/${projectId == PUBLIC_PROJECT_ID ? ApplicationsTabs[newTab] : PrivateApplicationTabs[newTab]}` +
        location.search;
      navigate(pagePath, {
        state: locationState
          ? {
              ...locationState,
              routeStack: [
                {
                  pagePath,
                  breadCrumb: PathSessionMap[RouteDefinitions.Pipelines],
                },
              ],
              trendRange,
            }
          : {
              routeStack: [
                {
                  pagePath,
                  breadCrumb: PathSessionMap[RouteDefinitions.Pipelines],
                },
              ],
            },
      });
    },
    [projectId, location.search, navigate, locationState, trendRange],
  );
  const tabs = useMemo(
    () =>
      projectId == PUBLIC_PROJECT_ID
        ? [
            {
              label: 'Latest',
              count: latestData?.total,
              icon: <Fire />,
              content: <Latest />,
            },
            {
              label: 'My liked',
              count: myLikedData?.total,
              icon: <HeartIcon />,
              content: <MyLiked />,
            },
            {
              label: 'Trending',
              count: trendingData?.total,
              icon: <Champion />,
              content: <Trending trendRange={trendRange} />,
            },
            {
              label: 'Admin',
              icon: <AdminIcon />,
              content: (
                <PrivatePipelinesList
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  statuses={[CollectionStatus.All]}
                  cardContentType={ContentType.PipelineAdmin}
                />
              ),
              count: applicationsData?.total,
              display: hasAdminPermission ? undefined : 'none',
            },
          ]
        : [
            {
              label: 'All',
              count: applicationsData?.total,
              content: (
                <PrivatePipelinesList
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  statuses={[CollectionStatus.All]}
                  cardContentType={ContentType.PipelineAll}
                />
              ),
            },
          ],
    [
      applicationsData?.total,
      hasAdminPermission,
      latestData?.total,
      myLikedData?.total,
      projectId,
      sortBy,
      sortOrder,
      trendRange,
      trendingData?.total,
    ],
  );

  const statusOptions = useMemo(
    () =>
      tabs
        .filter(item => item.display !== 'none')
        .map((item, index) => ({ label: item.label, value: index })),
    [tabs],
  );

  const selectedTab = useMemo(
    () =>
      projectId == PUBLIC_PROJECT_ID
        ? ApplicationsTabs.findIndex(item => item === tab)
        : PrivateApplicationTabs.findIndex(item => item === tab),
    [projectId, tab],
  );

  useEffect(() => {
    if (selectedTab === -1 && !isCreating) {
      onChangeTab(0);
    }
  }, [isCreating, onChangeTab, projectId, selectedTab]);

  return (
    <StickyTabs
      tabs={tabs}
      value={selectedTab}
      onChangeTab={onChangeTab}
      showTitleAndSwitchBySelect
      title="Pipelines"
      containerStyle={{ padding: '0 1.5rem 0 0' }}
      tabBarStyle={{ padding: '0 0.5rem 0 1.5rem' }}
      middleTabComponent={
        <>
          {tab === 'trending' && <DateRangeSelect />}
          {projectId == PUBLIC_PROJECT_ID && (
            <Box sx={styles.statusFilterWrapper}>
              <Box sx={styles.statusFilterLabelBox}>
                <Typography
                  component="div"
                  variant="bodyMedium"
                  sx={styles.statusFilterLabelText}
                >
                  Filter by:
                </Typography>
              </Box>
              <Box sx={styles.statusFilterSelectWrapper}>
                <SingleSelect
                  onValueChange={onChangeTab}
                  value={selectedTab}
                  options={statusOptions}
                  customSelectedColor={`${theme.palette.text.primary} !important`}
                  customSelectedFontSize="0.875rem"
                  sx={styles.statusSelect}
                />
              </Box>
            </Box>
          )}
          <ToolbarImportButton />
          <ViewToggle />
        </>
      }
    />
  );
});

Pipelines.displayName = 'Pipelines';

/** @type {MuiSx} */
const pipelinesStyles = () => ({
  statusFilterWrapper: {
    display: 'flex',
    marginLeft: '0.5rem',
    zIndex: 1001,
    minWidth: '7.3125rem',
    gap: '0.75rem',
    alignItems: 'center',
    height: '100%',
  },
  statusFilterLabelBox: {
    height: '1.5rem',
    width: '3.75rem',
  },
  statusFilterLabelText: {
    color: 'text.default',
  },
  statusFilterSelectWrapper: {
    flex: 1,
  },
  statusSelect: {
    margin: '0.3125rem 0 0 0 !important',
  },
});

export default Pipelines;
