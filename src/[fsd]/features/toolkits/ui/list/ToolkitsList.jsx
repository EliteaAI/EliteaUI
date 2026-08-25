import { memo, useCallback, useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { EmptyStatePage } from '@/[fsd]/entities/empty-state-page';
import { ENTITY_FOLDER_TYPES, FolderSection } from '@/[fsd]/entities/folder';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { useLoadToolkits } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitTypesPanel, ToolkitsEmptyListPlaceHolder } from '@/[fsd]/features/toolkits/ui/list';
import { isMcpToolkit } from '@/[fsd]/shared/lib/helpers';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { ContentType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import useMCPListStatusMonitor from '@/hooks/toolkit/useMCPListStatusMonitor';
import useTypes from '@/hooks/toolkit/useTypes';
import useCardList from '@/hooks/useCardList';
import useIsTableView from '@/hooks/useIsTableView';
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
  const isMcpVisible = useIsMcpVisible();

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

  const folderEntityType = useMemo(() => {
    if (isMCP) return ENTITY_FOLDER_TYPES.mcp;
    return ENTITY_FOLDER_TYPES.toolkit;
  }, [isMCP]);

  const rightPanelContent = useMemo(
    () => (
      <Box style={styles.rightInfoPanelContainer}>
        <FolderSection entityType={folderEntityType} />
        <ToolkitTypesPanel
          tagList={tagList}
          title="Types"
          style={styles.rightInfoPanel}
        />
      </Box>
    ),
    [tagList, styles, folderEntityType],
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
    const items = uniqueArrayByProp(
      (data || [])
        .filter(item => isMcpVisible || !isMcpToolkit(item))
        .map(item => ({
          ...item,
          name: ToolkitsHelpers.getToolkitDisplayName(item),
        })),
      'id',
    );

    return items;
  }, [data, isMcpVisible]);

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
