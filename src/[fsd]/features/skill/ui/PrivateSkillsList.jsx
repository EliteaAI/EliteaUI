import { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Typography } from '@mui/material';

import { EmptyStatePage } from '@/[fsd]/entities/empty-state-page';
import {
  ENTITY_FOLDER_TYPES,
  FolderViewHeader,
  useEntityFolders,
  useFolderApplications,
  useFolderView,
} from '@/[fsd]/entities/folder';
import { useLoadSkills } from '@/[fsd]/features/skill/lib/hooks';
import skillsDarkImage from '@/assets/images/Skills_Dark_1.png';
import skillsLightImage from '@/assets/images/Skills_Light_1.png';
import { ContentType, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import RightInfoPanel from '@/components/RightInfoPanel';
import useCardList from '@/hooks/useCardList';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import PrivateSkillsListEmptyState from './PrivateSkillsListEmptyState';

const PrivateSkillsList = memo(props => {
  const {
    rightPanelOffset,
    sortBy = 'created_at',
    sortOrder = 'desc',
    cardContentType = ContentType.SkillAll,
  } = props;

  const { query } = useSelector(state => state.search);
  const { renderCard } = useCardList(ViewMode.Owner);
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();

  const { folders } = useEntityFolders(ENTITY_FOLDER_TYPES.skill, { includeCounts: true });
  const { selectedFolderId, selectedFolder, isFolderViewActive, openFolder, closeFolder, onFolderDelete } =
    useFolderView(folders);

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
    onLoadMoreSkills,
    data,
    isSkillsError,
    isMoreSkillsError,
    isSkillsFirstFetching,
    isSkillsFetching,
    skillsError,
    tagList,
    page,
    pageSize,
    setPage,
  } = useLoadSkills({ sortBy, sortOrder, forceSkip: shouldSkipQuery, folderEntityIds });

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
    if (!existsMore || isSkillsFetching || isSkillsFirstFetching) return;
    onLoadMoreSkills();
  }, [
    total,
    uniqueDataList.length,
    page,
    pageSize,
    isSkillsFetching,
    isSkillsFirstFetching,
    onLoadMoreSkills,
  ]);

  // Reset pagination when folder selection changes
  useEffect(() => {
    setPage(0);
  }, [selectedFolderId, setPage]);

  const { toastError } = useToast();
  useEffect(() => {
    if (isMoreSkillsError) {
      toastError(buildErrorMessage(skillsError));
    }
  }, [skillsError, isMoreSkillsError, toastError]);

  const EmptyStateConfig = useMemo(
    () => ({
      title: 'No skills yet',
      description:
        'Create your first skill to get started. Skills are reusable, markdown-based instructions you can attach to your agents.',
      imageDark: skillsDarkImage,
      imageLight: skillsLightImage,
      onCreateClick: () => navigate(RouteDefinitions.CreateSkill),
    }),
    [navigate],
  );

  return (
    <CardList
      hideStatusColumn
      key={cardContentType}
      cardList={uniqueDataList}
      total={total}
      isLoading={isSkillsFirstFetching || (isFolderViewActive && isLoadingFolderItems)}
      isError={isSkillsError}
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
        <RightInfoPanel
          showFolders
          folderEntityType={ENTITY_FOLDER_TYPES.skill}
          tagList={activeTagList}
          onFolderSelect={openFolder}
          selectedFolderId={selectedFolderId}
          onFolderDelete={onFolderDelete}
        />
      }
      renderCard={renderCard}
      isLoadingMore={isSkillsFetching}
      loadMoreFunc={loadMore}
      cardType={cardContentType}
      customEmptyState={
        isFolderViewActive && isFolderEmpty ? (
          <Typography>No items in this folder yet</Typography>
        ) : (
          <EmptyStatePage {...EmptyStateConfig} />
        )
      }
      emptyListPlaceHolder={isFolderViewActive ? null : <PrivateSkillsListEmptyState query={query} />}
    />
  );
});

PrivateSkillsList.displayName = 'PrivateSkillsList';

export default PrivateSkillsList;
