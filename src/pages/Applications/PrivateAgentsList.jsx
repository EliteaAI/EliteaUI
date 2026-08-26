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
import { CollectionStatus, ContentType, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import Categories from '@/components/Categories';
import useCardList from '@/hooks/useCardList';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';
import { rightInfoPanelStyle } from '@/styles/RightInfoPanelStyle';

import RightInfoPanel from '../../components/RightInfoPanel';
import { useLoadApplications } from '../../hooks/useLoadApplications';

const AdminEmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return (
      <Box>
        No agents yet. <br />
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

const EmptyListPlaceHolder = ({ query, status }) => {
  if (!query) {
    if (status === CollectionStatus.UserApproval) {
      return <Box>{`You have no approval agents.`}</Box>;
    } else if (status === CollectionStatus.Draft) {
      return <Box>{`You have no draft agents.`}</Box>;
    } else if (status === CollectionStatus.OnModeration) {
      return <Box>{`You have no agents on moderation.`}</Box>;
    } else if (status === CollectionStatus.Rejected) {
      return <Box>{`You have no rejected agents.`}</Box>;
    } else if (status === CollectionStatus.Published) {
      return <Box>{`You have no published agents.`}</Box>;
    } else {
      return <Box>{`You have no agents.`}</Box>;
    }
  } else {
    return (
      <Box data-testid="agents-list-empty-state-message">
        Nothing found. <br />
        Create yours now!
      </Box>
    );
  }
};

const PrivateAgentsList = memo(props => {
  const {
    rightPanelOffset,
    sortBy,
    sortOrder,
    statuses,
    cardContentType = ContentType.ApplicationAll,
  } = props;
  const { query } = useSelector(state => state.search);
  const { renderCard } = useCardList(ViewMode.Owner);
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();

  // Folder view state
  const { folders } = useEntityFolders(ENTITY_FOLDER_TYPES.agent, { includeCounts: true });
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
    false,
    true,
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
      title: 'No agents yet',
      description:
        'Create your first agent to get started, or take a quick tour to see how it works. Or take a quick tour to see how it works. ',
      onCreateClick: () => navigate(RouteDefinitions.CreateApplication),
    }),
    [navigate],
  );

  return (
    <>
      <CardList
        hideStatusColumn
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
          cardContentType !== ContentType.ApplicationAdmin ? (
            <RightInfoPanel
              showFolders
              folderEntityType={ENTITY_FOLDER_TYPES.agent}
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
          isFolderViewActive ? null : cardContentType !== ContentType.ApplicationAdmin ? (
            <EmptyListPlaceHolder
              query={query}
              status={statuses[0]}
            />
          ) : (
            <AdminEmptyListPlaceHolder />
          )
        }
      />
    </>
  );
});

PrivateAgentsList.displayName = 'PrivateAgentsList';

export default PrivateAgentsList;
