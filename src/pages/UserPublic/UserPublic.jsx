import { memo, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box, useTheme } from '@mui/material';

import { MCPList } from '@/[fsd]/features/mcp/ui';
import { useLoadToolkits } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitsList } from '@/[fsd]/features/toolkits/ui';
import { useTotalApplicationsQuery, useTotalPublicApplicationsQuery } from '@/api/applications';
import FlowIcon from '@/assets/flow-icon.svg?react';
import McpIcon from '@/assets/mcp-icon.svg?react';
import ToolIcon from '@/assets/tool-icon.svg?react';
import {
  CollectionStatus,
  MyLibraryStatusOptions,
  PUBLIC_PROJECT_ID,
  SearchParams,
  UserPublicTabs,
  ViewMode,
} from '@/common/constants';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import MultipleSelect from '@/components/MultipleSelect';
import StickyTabs from '@/components/StickyTabs';
import ViewToggle from '@/components/ViewToggle';
import { useAuthorIdFromUrl } from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSortQueryParamsFromUrl from '@/hooks/useSortQueryParamsFromUrl';
import useTags from '@/hooks/useTags';
import useViewMode from '@/hooks/useViewMode';
import { publicAdminPermissions } from '@/hooks/users/usePermissions';
import RouteDefinitions, { PathSessionMap } from '@/routes';
import { getQueryStatuses } from '@/utils/getQueryStatus';

import AllStuffList from './AllStuffList';
import ApplicationsList from './ApplicationsList';

const UserPublic = memo(props => {
  const { publicView = false } = props;
  const theme = useTheme();
  const styles = userPublicStyles();
  const { query } = useSelector(state => state.search);
  const { tab = UserPublicTabs[0] } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = useSelectedProjectId();
  const authorId = useAuthorIdFromUrl();
  const location = useLocation();
  const { state } = location;
  const { tagList } = useSelector(store => store.tags);
  const { selectedTagIds } = useTags(tagList);
  const { permissions = [] } = useSelector(s => s.user);

  const viewMode = useViewMode();
  const { sort_by: sortBy, sort_order: sortOrder } = useSortQueryParamsFromUrl({
    defaultSortOrder: 'desc',
    defaultSortBy: 'created_at',
  });

  const statuses = useMemo(() => {
    const statusesString = publicView ? CollectionStatus.Published : searchParams.get(SearchParams.Statuses);
    if (statusesString) {
      return statusesString.split(',');
    }
    return [CollectionStatus.All];
  }, [searchParams, publicView]);

  const displayedTabs = useMemo(() => {
    if (!permissions.length) {
      return UserPublicTabs.reduce((acc, i) => ({ ...acc, [i]: false }), {});
    } else {
      const permissionsSet = new Set(permissions);
      return UserPublicTabs.reduce((acc, i) => {
        const hasPermission = publicAdminPermissions[i]
          ? publicAdminPermissions[i].some(p => permissionsSet.has(p))
          : true;
        return { ...acc, [i]: hasPermission || projectId == PUBLIC_PROJECT_ID };
      }, {});
    }
  }, [permissions, projectId]);

  const { data: publicApplicationData } = useTotalPublicApplicationsQuery(
    {
      params: {
        tags: selectedTagIds,
        query,
        author_id: authorId,
        statuses: CollectionStatus.Published,
        agents_type: 'classic',
      },
    },
    { skip: !projectId || viewMode !== ViewMode.Public },
  );

  const { data: applicationsData } = useTotalApplicationsQuery(
    {
      projectId,
      params: {
        tags: selectedTagIds,
        query,
        author_id: authorId,
        statuses: getQueryStatuses(statuses),
        agents_type: 'classic',
      },
    },
    {
      skip: !projectId || projectId == PUBLIC_PROJECT_ID || viewMode === ViewMode.Public,
    },
  );

  const { data: publicPipelineData } = useTotalPublicApplicationsQuery(
    {
      params: {
        tags: selectedTagIds,
        query,
        author_id: authorId,
        statuses: CollectionStatus.Published,
        agents_type: 'pipeline',
      },
    },
    { skip: !projectId || viewMode !== ViewMode.Public },
  );

  const { data: pipelinesData } = useTotalApplicationsQuery(
    {
      projectId,
      params: {
        tags: selectedTagIds,
        query,
        author_id: authorId,
        statuses: getQueryStatuses(statuses),
        agents_type: 'pipeline',
      },
    },
    {
      skip: !projectId || projectId == PUBLIC_PROJECT_ID || viewMode === ViewMode.Public,
    },
  );

  const { totalCount: toolkitsListTotal } = useLoadToolkits({
    specifiedProjectId: projectId,
    tags: selectedTagIds,
    query,
    author_id: authorId,
    statuses: getQueryStatuses(statuses),
    forceSkip: !projectId || projectId == PUBLIC_PROJECT_ID || viewMode === ViewMode.Public,
  });

  const { totalCount: mcpListTotal } = useLoadToolkits({
    specifiedProjectId: projectId,
    tags: selectedTagIds,
    query,
    author_id: authorId,
    statuses: getQueryStatuses(statuses),
    forceSkip: !projectId || projectId == PUBLIC_PROJECT_ID || viewMode === ViewMode.Public,
    isMCP: true,
  });

  const { applicationTotal, pipelineTotal, toolkitTotal, allTotal, mcpTotal } = useMemo(() => {
    const applicationTotalCount =
      (viewMode === ViewMode.Public ? publicApplicationData?.total : applicationsData?.total) || 0;
    const pipelineTotalCount =
      (viewMode === ViewMode.Public ? publicPipelineData?.total : pipelinesData?.total) || 0;
    const toolkitTotalCount = toolkitsListTotal || 0;
    const mcpTotalCount = mcpListTotal || 0;
    const allTotalCount =
      (applicationTotalCount || 0) +
      (pipelineTotalCount || 0) +
      (toolkitTotalCount || 0) +
      (mcpTotalCount || 0);
    return {
      applicationTotal: applicationTotalCount,
      pipelineTotal: pipelineTotalCount,
      toolkitTotal: toolkitTotalCount,
      allTotal: allTotalCount,
      mcpTotal: mcpTotalCount,
    };
  }, [
    applicationsData?.total,
    mcpListTotal,
    pipelinesData?.total,
    publicApplicationData?.total,
    publicPipelineData?.total,
    toolkitsListTotal,
    viewMode,
  ]);

  const tabs = useMemo(() => {
    const allTabs = [
      {
        label: UserPublicTabs[0],
        count: allTotal,
        content: (
          <AllStuffList
            viewMode={viewMode}
            sortBy={sortBy}
            sortOrder={sortOrder}
            statuses={statuses}
            displayedTabs={displayedTabs}
          />
        ),
      },
      {
        label: UserPublicTabs[1],
        icon: <ApplicationsIcon />,
        count: applicationTotal,
        content: (
          <ApplicationsList
            viewMode={viewMode}
            sortBy={sortBy}
            sortOrder={sortOrder}
            statuses={statuses}
          />
        ),
      },
      {
        label: UserPublicTabs[2],
        icon: <FlowIcon />,
        count: pipelineTotal,
        content: (
          <ApplicationsList
            viewMode={viewMode}
            sortBy={sortBy}
            sortOrder={sortOrder}
            statuses={statuses}
            forPipeline
          />
        ),
      },
      {
        label: UserPublicTabs[3],
        icon: <ToolIcon />,
        count: toolkitTotal,
        content: <ToolkitsList.AuthorToolkitsList statuses={statuses} />,
      },
      {
        label: UserPublicTabs[4],
        icon: <McpIcon />,
        count: mcpTotal,
        content: <MCPList.AuthorMCPList statuses={statuses} />,
      },
    ];
    return allTabs.filter(i => displayedTabs[i.label]);
  }, [
    displayedTabs,
    allTotal,
    applicationTotal,
    sortBy,
    sortOrder,
    statuses,
    viewMode,
    pipelineTotal,
    toolkitTotal,
    mcpTotal,
  ]);

  const onChangeStatuses = useCallback(
    newStatuses => {
      const newStatusesString = newStatuses.length ? newStatuses.join(',') : 'all';
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set(SearchParams.Statuses, newStatusesString);
      setSearchParams(newSearchParams, {
        replace: true,
        state: {
          routeStack: [
            {
              breadCrumb: PathSessionMap[RouteDefinitions.UserPublic],
              viewMode,
              pagePath: location.pathname + '?' + newSearchParams.toString(),
            },
          ],
        },
      });
    },
    [location.pathname, searchParams, setSearchParams, viewMode],
  );

  const onChangeTab = useCallback(
    newTab => {
      const rootPath = RouteDefinitions.UserPublic;
      const pagePath = `${rootPath}/${tabs[newTab].label}` + location.search;
      const { routeStack = [] } = state || {};
      if (viewMode === ViewMode.Public && routeStack.length) {
        routeStack[routeStack.length - 1] = {
          ...routeStack[routeStack.length - 1],
          pagePath,
        };
      }
      navigate(pagePath, {
        state: {
          routeStack,
        },
      });
    },
    [location.search, navigate, state, tabs, viewMode],
  );

  const currentTabValue = useMemo(() => {
    const foundIndex = tabs.findIndex(item => item.label === tab);
    return foundIndex !== -1 ? foundIndex : 0;
  }, [tab, tabs]);

  return (
    <StickyTabs
      showBackButton={true}
      tabs={tabs}
      value={currentTabValue}
      onChangeTab={onChangeTab}
      middleTabComponent={
        <>
          {viewMode === ViewMode.Owner && (
            <Box sx={styles.selectContainer}>
              <MultipleSelect
                onValueChange={onChangeStatuses}
                value={statuses}
                options={MyLibraryStatusOptions}
                customSelectedColor={`${theme.palette.text.primary} !important`}
                customSelectedFontSize={'0.875rem'}
                multiple={false}
              />
            </Box>
          )}
          <ViewToggle />
        </>
      }
    />
  );
});

UserPublic.displayName = 'UserPublic';

/** @type {MuiSx} */
const userPublicStyles = () => ({
  selectContainer: {
    display: 'flex',
    marginLeft: '0.5rem',
    zIndex: 1001,
    alignItems: 'flex-end',
  },
});

export default UserPublic;
