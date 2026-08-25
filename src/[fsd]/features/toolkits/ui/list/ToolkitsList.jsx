import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { EmptyStatePage } from '@/[fsd]/entities/empty-state-page';
import {
  ENTITY_FOLDER_TYPES,
  FolderSection,
  FolderViewHeader,
  useEntityFolders,
  useFolderApplications,
  useFolderView,
} from '@/[fsd]/entities/folder';
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
  const { selectedTypes } = useTypes();
  const dispatch = useDispatch();
  const { query } = useSelector(state => state.search);
  const selectedProjectId = useSelectedProjectId();
  const isMcpVisible = useIsMcpVisible();
  const isPublicProject = selectedProjectId == PUBLIC_PROJECT_ID;

  const { renderCard } = useCardList(!isPublicProject ? ViewMode.Owner : ViewMode.Public);
  const isTableView = useIsTableView();

  const folderEntityType = useMemo(() => {
    if (isMCP) return ENTITY_FOLDER_TYPES.mcp;
    return ENTITY_FOLDER_TYPES.toolkit;
  }, [isMCP]);

  const { folders } = useEntityFolders(folderEntityType, { includeCounts: true });
  const { selectedFolderId, selectedFolder, isFolderViewActive, openFolder, closeFolder } =
    useFolderView(folders);

  const {
    idsQueryParam: folderEntityIds,
    isLoading: isLoadingFolderItems,
    isEmpty: isFolderEmpty,
  } = useFolderApplications({
    folderId: selectedFolderId,
    projectId: selectedProjectId,
  });

  const shouldSkipQuery = isFolderViewActive && isLoadingFolderItems;

  const [isFoldersExpanded, setIsFoldersExpanded] = useState(false);
  const handleExpandChange = useCallback(expanded => {
    setIsFoldersExpanded(expanded);
  }, []);

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
  } = useLoadToolkits({
    isMCP,
    isApplication,
    isTableView,
    forceSkip: shouldSkipQuery,
    folderEntityIds,
  });

  useMCPListStatusMonitor({ isMCP });

  useEffect(() => {
    dispatch(
      tagsActions.setVisibleTags({
        tags: tagList,
      }),
    );
  }, [dispatch, tagList]);

  const folderTagList = useMemo(() => {
    if (!isFolderViewActive || !data?.length) return [];

    const tagMap = new Map();
    data.forEach(item => {
      item.tags?.forEach(tag => {
        if (!tagMap.has(tag.id)) tagMap.set(tag.id, tag);
      });
    });

    return Array.from(tagMap.values());
  }, [isFolderViewActive, data]);

  const rightPanelContent = useMemo(
    () => (
      <Box sx={toolkitsRightPanelStyles(isFoldersExpanded).container}>
        {!isPublicProject && (
          <FolderSection
            entityType={folderEntityType}
            onFolderSelect={openFolder}
            selectedFolderId={selectedFolderId}
            onExpandChange={handleExpandChange}
          />
        )}
        <ToolkitTypesPanel
          tagList={isFolderViewActive ? folderTagList : tagList}
          title="Types"
          style={isFoldersExpanded ? { overflowY: 'visible' } : { flex: 1, minHeight: 0 }}
        />
      </Box>
    ),
    [
      tagList,
      folderTagList,
      folderEntityType,
      isPublicProject,
      openFolder,
      selectedFolderId,
      isFolderViewActive,
      isFoldersExpanded,
      handleExpandChange,
    ],
  );

  useEffect(() => {
    const loading = isToolkitsFirstFetching || isToolkitsFetching;
    const hasError = !!isToolkitsError;
    const hasQuery = !!(query && String(query).trim());

    if (
      !isPublicProject &&
      !loading &&
      !hasError &&
      !disableEmptyRedirect &&
      !hasQuery &&
      !isFolderViewActive &&
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
    isPublicProject,
    isFolderViewActive,
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
      key={`${cardContentType}-${selectedFolderId || 'all'}`}
      cardList={uniqueDataList}
      total={totalCount}
      isLoading={isToolkitsFirstFetching || (isFolderViewActive && isLoadingFolderItems)}
      isError={isToolkitsError}
      rightPanelOffset={rightPanelOffset}
      headerContent={
        isFolderViewActive && selectedFolder ? (
          <FolderViewHeader
            folder={selectedFolder}
            entitiesCount={totalCount || 0}
            onClose={closeFolder}
          />
        ) : null
      }
      rightPanelContent={rightPanelContent}
      renderCard={renderCard}
      isLoadingMore={isToolkitsFetching}
      loadMoreFunc={loadMore}
      cardType={cardContentType}
      customEmptyState={
        isFolderViewActive && isFolderEmpty ? (
          <Typography>No items in this folder yet</Typography>
        ) : (
          <EmptyStatePage {...getEmptyStateConfig} />
        )
      }
      emptyListPlaceHolder={
        isFolderViewActive
          ? null
          : emptyListPlaceHolder || (
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
const toolkitsRightPanelStyles = isFoldersExpanded => ({
  container: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    ...(isFoldersExpanded && {
      overflowY: 'auto',
      overflowX: 'hidden',
      '::-webkit-scrollbar': {
        display: 'none',
      },
    }),
  },
});

ToolkitsList.displayName = 'ToolkitsList';

export default ToolkitsList;
