import { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { EmptyStatePage } from '@/[fsd]/entities/empty-state-page';
import {
  ENTITY_FOLDER_TYPES,
  FolderViewHeader,
  useEntityFolders,
  useFolderApplications,
  useFolderView,
} from '@/[fsd]/entities/folder';
import { ContentType, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import Categories from '@/components/Categories';
import RightInfoPanel from '@/components/RightInfoPanel';
import useCardList from '@/hooks/useCardList';
import { useLoadApplications } from '@/hooks/useLoadApplications';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';
import { rightInfoPanelStyle } from '@/styles/RightInfoPanelStyle';

const AdminEmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return (
      <Box>
        No pipelines yet. <br />
        Create yours now!
      </Box>
    );
  } else {
    return (
      <Box>
        Nothing found. <br />
        Create yours now!
      </Box>
    );
  }
};

const EmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return <Box>{`You have no pipelines.`}</Box>;
  } else {
    return (
      <Box>
        Nothing found. <br />
        Create yours now!
      </Box>
    );
  }
};

const PrivatePipelinesList = memo(props => {
  const { rightPanelOffset, sortBy, sortOrder, statuses, cardContentType = ContentType.PipelineAll } = props;
  const { query } = useSelector(state => state.search);
  const { renderCard } = useCardList(ViewMode.Owner);
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();

  // Folder view state
  const { folders } = useEntityFolders(ENTITY_FOLDER_TYPES.pipeline, { includeCounts: true });
  const { selectedFolderId, selectedFolder, isFolderViewActive, openFolder, closeFolder } =
    useFolderView(folders);

  // Fetch folder items (entity IDs) when folder is selected
  const {
    idsQueryParam: folderEntityIds,
    isLoading: isLoadingFolderItems,
    isEmpty: isFolderEmpty,
  } = useFolderApplications({
    folderId: selectedFolderId,
    projectId,
  });

  const shouldSkipQuery = isFolderViewActive && isLoadingFolderItems;

  const {
    onLoadMoreApplications,
    data,
    isApplicationsError,
    isMoreApplicationsError,
    isApplicationsFirstFetching,
    isApplicationsFetching,
    applicationsError,
    tagList,
    page,
    pageSize,
    setPage,
  } = useLoadApplications(
    ViewMode.Owner,
    sortBy,
    sortOrder,
    statuses,
    shouldSkipQuery,
    true,
    false,
    folderEntityIds,
  );

  const { total } = data || {};
  const uniqueDataList = useMemo(() => uniqueArrayByProp(data?.rows || [], 'id'), [data?.rows]);
  const folderTagList = useMemo(() => {
    if (!isFolderViewActive || !uniqueDataList.length) return [];
    const tagMap = new Map();
    uniqueDataList.forEach(item => {
      item.tags?.forEach(tag => {
        if (!tagMap.has(tag.id)) tagMap.set(tag.id, tag);
      });
    });
    return Array.from(tagMap.values());
  }, [isFolderViewActive, uniqueDataList]);
  const activeTagList = isFolderViewActive ? folderTagList : tagList;
  const loadMore = useCallback(() => {
    const existsMore = total && uniqueDataList.length < total && (page + 1) * pageSize < total;
    if (!existsMore || isApplicationsFetching || isApplicationsFirstFetching) return;
    onLoadMoreApplications();
  }, [
    total,
    uniqueDataList.length,
    page,
    pageSize,
    isApplicationsFetching,
    isApplicationsFirstFetching,
    onLoadMoreApplications,
  ]);

  // Reset pagination when folder selection changes
  useEffect(() => {
    setPage(0);
  }, [selectedFolderId, setPage]);

  const { toastError } = useToast();
  useEffect(() => {
    if (isMoreApplicationsError) {
      toastError(buildErrorMessage(applicationsError));
    }
  }, [applicationsError, isMoreApplicationsError, toastError]);

  const EmptyStateConfig = useMemo(
    () => ({
      title: 'No pipelines yet',
      description:
        'Create your first pipeline to start automating tasks and workflows. Or take a quick tour to see how it works.',
      onCreateClick: () => navigate(RouteDefinitions.CreatePipeline),
    }),
    [navigate],
  );

  return (
    <>
      <CardList
        key={cardContentType}
        cardList={uniqueDataList}
        total={total}
        isLoading={isApplicationsFirstFetching || (isFolderViewActive && isLoadingFolderItems)}
        isError={isApplicationsError}
        rightPanelOffset={rightPanelOffset}
        resetPageOnSort={() => setPage(0)}
        headerContent={
          isFolderViewActive && selectedFolder ? (
            <FolderViewHeader
              folder={selectedFolder}
              entitiesCount={total || 0}
              onClose={closeFolder}
            />
          ) : null
        }
        rightPanelContent={
          cardContentType !== ContentType.PipelineAdmin ? (
            <RightInfoPanel
              showFolders
              folderEntityType={ENTITY_FOLDER_TYPES.pipeline}
              tagList={activeTagList}
              specifiedStatus={statuses[0]}
              onFolderSelect={openFolder}
              selectedFolderId={selectedFolderId}
            />
          ) : (
            <div style={rightInfoPanelStyle}>
              <Categories
                tagList={activeTagList}
                style={{ flex: 1 }}
                specifiedStatus={statuses[0]}
              />
            </div>
          )
        }
        renderCard={renderCard}
        isLoadingMore={isApplicationsFetching}
        loadMoreFunc={loadMore}
        cardType={cardContentType}
        customEmptyState={
          isFolderViewActive && isFolderEmpty ? (
            <Typography>No items in this folder yet</Typography>
          ) : (
            <EmptyStatePage {...EmptyStateConfig} />
          )
        }
        emptyListPlaceHolder={
          isFolderViewActive ? null : cardContentType !== ContentType.PipelineAdmin ? (
            <EmptyListPlaceHolder query={query} />
          ) : (
            <AdminEmptyListPlaceHolder />
          )
        }
      />
    </>
  );
});

PrivatePipelinesList.displayName = 'PrivatePipelinesList';

export default PrivatePipelinesList;
