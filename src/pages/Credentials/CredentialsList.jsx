import { memo, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import {
  ENTITY_FOLDER_TYPES,
  FolderSection,
  FolderViewHeader,
  useEntityFolders,
  useFolderApplications,
  useFolderView,
} from '@/[fsd]/entities/folder';
import { ContentType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import useCredentialTypes from '@/hooks/credentials/useCredentialTypes';
import { useLoadAllCredentials } from '@/hooks/credentials/useLoadAllCredentials';
import useCardList from '@/hooks/useCardList';
import useIsTableView from '@/hooks/useIsTableView';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import CredentialsTypesPanel from './CredentialsTypesPanel';

const DEFAULT_CREDENTIALS_PATHNAME = RouteDefinitions.CredentialsWithTab.replace(':tab', 'all');

const EmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return <Box>{`You have no credentials.`}</Box>;
  } else {
    return (
      <Box data-testid="credentials-search-empty-state">
        Nothing found. <br />
        Create yours now!
      </Box>
    );
  }
};

const CredentialsList = memo(props => {
  const { rightPanelOffset } = props;

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selectedProjectId = useSelectedProjectId();
  const isPublicProject = selectedProjectId == PUBLIC_PROJECT_ID;
  const isTableView = useIsTableView();
  const { query } = useSelector(state => state.search);
  const { selectedTypes: urlSelectedTypes, handleClickType } = useCredentialTypes();
  const { renderCard } = useCardList(!isPublicProject ? ViewMode.Owner : ViewMode.Public, handleClickType);
  const { toastError } = useToast();
  const styles = credentialsListStyles();

  const { folders } = useEntityFolders(ENTITY_FOLDER_TYPES.configuration, { includeCounts: true });
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

  const {
    onLoadMore,
    data,
    isCredentialsError,
    isMoreCredentialsError,
    isCredentialsFirstFetching,
    isCredentialsFetching,
    credentialsError,
    totalCount,
    tagList,
    onRefetch,
    page,
    pageSize,
    setPage,
  } = useLoadAllCredentials({
    isTableView,
    selectedTypeNames: urlSelectedTypes,
    forceSkip: shouldSkipQuery,
    folderEntityIds,
  });

  const total = totalCount;

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
      <Box sx={styles.rightInfoPanelStyle}>
        {!isPublicProject && (
          <FolderSection
            entityType={ENTITY_FOLDER_TYPES.configuration}
            onFolderSelect={openFolder}
            selectedFolderId={selectedFolderId}
          />
        )}
        <CredentialsTypesPanel
          tagList={isFolderViewActive ? folderTagList : tagList}
          title="Types"
          style={{ flex: 1 }}
        />
      </Box>
    ),
    [tagList, folderTagList, styles, isPublicProject, openFolder, selectedFolderId, isFolderViewActive],
  );

  useEffect(() => {
    onRefetch();
    if (pathname === DEFAULT_CREDENTIALS_PATHNAME) {
      onRefetch();
    }
  }, [pathname, onRefetch]);

  useEffect(() => {
    if (isMoreCredentialsError) {
      toastError(buildErrorMessage(credentialsError));
    }
  }, [credentialsError, isMoreCredentialsError, toastError]);

  useEffect(() => {
    const loading = isCredentialsFirstFetching || isCredentialsFetching;
    const hasError = !!isCredentialsError;
    const hasQuery = !!(query && String(query).trim());
    const hasTypeFilter = urlSelectedTypes.length > 0;

    if (
      !isPublicProject &&
      !loading &&
      !hasError &&
      !hasQuery &&
      !hasTypeFilter &&
      !isFolderViewActive &&
      total === 0
    ) {
      navigate(RouteDefinitions.CreateCredentialFromMain, { replace: true });
    }
  }, [
    selectedProjectId,
    isCredentialsFirstFetching,
    isCredentialsFetching,
    isCredentialsError,
    query,
    urlSelectedTypes,
    total,
    navigate,
    isPublicProject,
    isFolderViewActive,
  ]);

  const uniqueDataList = useMemo(() => {
    const getCredentialItemName = item => {
      if (item.label) {
        return item.label;
      }
      if (!item.name || item.name.trim() === '') {
        const fallbackName =
          item.elitea_title ||
          item.credential_name ||
          item.title ||
          item.type.charAt(0).toUpperCase() + item.type.slice(1);
        return fallbackName;
      }
      return item.name;
    };

    return uniqueArrayByProp(
      (data || []).map(item => ({
        ...item,
        name: getCredentialItemName(item),
      })),
      'id',
    );
  }, [data]);

  return (
    <Box sx={styles.wrapper}>
      <CardList
        key={`${ContentType.CredentialAll}-${selectedFolderId || 'all'}`}
        cardList={uniqueDataList}
        total={total}
        isLoading={isCredentialsFirstFetching || (isFolderViewActive && isLoadingFolderItems)}
        isError={isCredentialsError}
        rightPanelOffset={rightPanelOffset}
        headerContent={
          isFolderViewActive && selectedFolder ? (
            <FolderViewHeader
              folder={selectedFolder}
              entitiesCount={total || 0}
              onClose={closeFolder}
            />
          ) : null
        }
        rightPanelContent={rightPanelContent}
        renderCard={renderCard}
        isLoadingMore={isCredentialsFetching}
        loadMoreFunc={onLoadMore}
        cardType={ContentType.CredentialAll}
        customEmptyState={
          isFolderViewActive && isFolderEmpty ? (
            <Typography>No items in this folder yet</Typography>
          ) : undefined
        }
        emptyListPlaceHolder={isFolderViewActive ? null : <EmptyListPlaceHolder query={query} />}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
      />
    </Box>
  );
});

CredentialsList.displayName = 'CredentialsList';

export default CredentialsList;

/** @type {MuiSx} */
const credentialsListStyles = () => ({
  rightInfoPanelStyle: {
    height: `calc(100dvh - 4.375rem)`,
    display: 'flex',
    flexDirection: 'column',
  },
  wrapper: {
    width: '100%',
    '& > .MuiGrid-container': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(18.75rem, 1fr))',
    },
    '& > .MuiGrid-container > .MuiGrid-root': {
      width: '100%',
      maxWidth: '100%',
    },
  },
});
