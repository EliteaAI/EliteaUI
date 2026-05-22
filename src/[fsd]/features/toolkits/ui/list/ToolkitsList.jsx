import { memo, useCallback, useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { AuthorInformation } from '@/[fsd]/entities/author/ui';
import { EmptyStatePage } from '@/[fsd]/entities/empty-state-page';
import { useLoadToolkits } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitTypesPanel, ToolkitsEmptyListPlaceHolder } from '@/[fsd]/features/toolkits/ui/list';
import { ContentType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import TeamMates from '@/components/TeamMates';
import useMCPListStatusMonitor from '@/hooks/toolkit/useMCPListStatusMonitor';
import useTypes from '@/hooks/toolkit/useTypes';
import useCardList from '@/hooks/useCardList';
import useIsTableView from '@/hooks/useIsTableView';
import useQueryTrendingAuthor from '@/hooks/useQueryTrendingAuthor';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';
import { actions as tagsActions } from '@/slices/tags';

const ToolkitsList = memo(props => {
  const {
    rightPanelOffset,
    cardContentType = ContentType.ToolkitAll,
    disableEmptyRedirect = false,
    emptyListPlaceHolder,
    isMCP = false,
    isApplication = false,
  } = props;
  const navigate = useNavigate();
  const styles = toolkitsListStyles();
  const { selectedTypes } = useTypes();
  const dispatch = useDispatch();
  const { query } = useSelector(state => state.search);
  const selectedProjectId = useSelectedProjectId();

  const { renderCard } = useCardList(
    selectedProjectId != PUBLIC_PROJECT_ID ? ViewMode.Owner : ViewMode.Public,
  );
  const isTableView = useIsTableView();

  const {
    onLoadMoreToolkits,
    data,
    isToolkitsError,
    isMoreToolkitsError,
    isToolkitsFirstFetching,
    isToolkitsFetching,
    toolkitsError,
    tagList,
    page,
    pageSize,
    totalCount,
    setPage,
  } = useLoadToolkits({ isMCP, isApplication, isTableView });

  useMCPListStatusMonitor({ isMCP });

  useEffect(() => {
    dispatch(
      tagsActions.setVisibleTags({
        tags: tagList,
      }),
    );
  }, [dispatch, tagList]);

  const projectId = useSelectedProjectId();
  const { isLoadingAuthor, authorId } = useQueryTrendingAuthor(projectId);
  const { personal_project_id: privateProjectId } = useSelector(state => state.user);

  const rightPanelContent = useMemo(
    () => (
      <Box style={styles.rightInfoPanelContainer}>
        <ToolkitTypesPanel
          tagList={tagList}
          title="Types"
          style={styles.rightInfoPanel}
        />
        {selectedProjectId == privateProjectId || authorId ? (
          <AuthorInformation isLoading={isLoadingAuthor} />
        ) : (
          <TeamMates entityType="toolkit" />
        )}
      </Box>
    ),
    [tagList, styles, selectedProjectId, privateProjectId, authorId, isLoadingAuthor],
  );

  // Navigate to New Toolkit page for private projects with no toolkits
  useEffect(() => {
    const isPublic = selectedProjectId == PUBLIC_PROJECT_ID;
    const loading = isToolkitsFirstFetching || isToolkitsFetching;
    const hasError = !!isToolkitsError;
    const hasQuery = !!(query && String(query).trim());

    if (
      !isPublic &&
      !loading &&
      !hasError &&
      !disableEmptyRedirect &&
      !hasQuery &&
      totalCount === 0 &&
      selectedTypes?.length === 0
    ) {
      if (isApplication) {
        navigate(RouteDefinitions.CreateApp, { replace: true });
      } else {
        navigate(!isMCP ? RouteDefinitions.CreateToolkit : RouteDefinitions.CreateMCP, { replace: true });
      }
    }
  }, [
    selectedProjectId,
    isToolkitsFirstFetching,
    isToolkitsFetching,
    isToolkitsError,
    selectedTypes?.length,
    query,
    totalCount,
    navigate,
    disableEmptyRedirect,
    isMCP,
    isApplication,
  ]);

  const uniqueDataList = useMemo(() => {
    const getToolkitItemName = item => {
      if (!item.name || item.name.trim() === '') {
        const fallbackName =
          item.toolkit_name ||
          item.settings?.elitea_title ||
          item.settings?.configuration_title ||
          item.type.charAt(0).toUpperCase() + item.type.slice(1);
        return fallbackName;
      }
      return item.name;
    };

    const items = uniqueArrayByProp(
      (data || []).map(item => ({
        ...item,
        name: getToolkitItemName(item),
      })),
      'id',
    );

    return items;
  }, [data]);

  const loadMore = useCallback(() => {
    const existsMore = totalCount && uniqueDataList.length < totalCount && (page + 1) * pageSize < totalCount;
    if (!existsMore || isToolkitsFetching || isToolkitsFirstFetching) return;
    onLoadMoreToolkits();
  }, [
    totalCount,
    uniqueDataList.length,
    page,
    pageSize,
    isToolkitsFetching,
    isToolkitsFirstFetching,
    onLoadMoreToolkits,
  ]);

  const { toastError } = useToast();
  useEffect(() => {
    if (isMoreToolkitsError) {
      toastError(buildErrorMessage(toolkitsError));
    }
  }, [toolkitsError, isMoreToolkitsError, toastError]);

  const getEmptyStateConfig = useMemo(() => {
    if (isApplication) {
      return {
        title: 'No applications yet',
        description:
          'Create your first app to build AI-powered solutions for specific tasks. Or take a quick tour to get started.',
        onCreateClick: () => navigate(RouteDefinitions.AppsCatalog),
      };
    }
    if (isMCP) {
      return {
        title: 'No MCPs yet',
        description:
          'Create your first MCP to integrate tools and data into your AI workflows. Or take a quick tour to get started.',
        onCreateClick: () => navigate(RouteDefinitions.CreateMCP),
      };
    }

    return {
      title: 'No toolkits yet',
      description: 'Create your first toolkit to add new functionality. Or take a quick tour to get started.',
      onCreateClick: () => navigate(RouteDefinitions.CreateToolkit),
    };
  }, [isApplication, isMCP, navigate]);

  return (
    <CardList
      key={cardContentType}
      cardList={uniqueDataList}
      total={totalCount}
      isLoading={isToolkitsFirstFetching}
      isError={isToolkitsError}
      rightPanelOffset={rightPanelOffset}
      rightPanelContent={rightPanelContent}
      renderCard={renderCard}
      isLoadingMore={isToolkitsFetching}
      loadMoreFunc={loadMore}
      cardType={cardContentType}
      customEmptyState={<EmptyStatePage {...getEmptyStateConfig} />}
      emptyListPlaceHolder={
        emptyListPlaceHolder || (
          <ToolkitsEmptyListPlaceHolder
            query={query}
            isMCP={isMCP}
          />
        )
      }
      setPage={setPage}
      page={page}
      pageSize={pageSize}
    />
  );
});

/** @type {MuiSx} */
const toolkitsListStyles = () => ({
  rightInfoPanel: { flex: 1 },
  rightInfoPanelContainer: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
  },
});

ToolkitsList.displayName = 'ToolkitsList';

export default ToolkitsList;
