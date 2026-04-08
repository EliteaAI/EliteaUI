import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Skeleton } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { genConversationId } from '@/common/utils';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import FolderItem from './FolderItem';

const Folders = memo(props => {
  const {
    folders,
    ungroupedConversationsCount,
    collapsed,
    onDeleteFolder,
    onLoadMore,
    isLoadConversations,
    isLoadMoreConversations,
    onChangeActiveFolderName,
    onCreateFolder,
    onCancelCreateFolder,
    onEditFolder,
    onPinFolder,
    renderConversationItem,
    moveTargetConversationToNewFolder,
    cancelMovingTargetConversationToNewFolder,
    selectedConversationId,
    enableDragAndDrop = false,
    getDropAreaState,
    isSearchMode = false,
    isFolderOperationInProgress = false,
    isPinned = false,
  } = props;
  const { isSmallWindow } = useIsSmallWindow();
  const [forceRerenderKey, setForceRerenderKey] = useState(0);
  const [wasInSearchMode, setWasInSearchMode] = useState(false);
  const [hoveredFolderId, setHoveredFolderId] = useState(null);
  const styles = foldersStyles(collapsed, isSmallWindow);

  const handleFolderHover = useCallback((folderId, isHovered) => {
    setHoveredFolderId(isHovered ? folderId : null);
  }, []);
  // Force re-render when transitioning out of search mode to reset folder expansion
  useEffect(() => {
    if (wasInSearchMode && !isSearchMode) {
      setForceRerenderKey(prev => prev + 1);
    }
    setWasInSearchMode(isSearchMode);
  }, [isSearchMode, wasInSearchMode]);

  const folderIds = useMemo(() => {
    if (!enableDragAndDrop || isSearchMode || isPinned) {
      return [];
    }
    return folders.map(folder => `folder-${folder.id}`);
  }, [folders, enableDragAndDrop, isSearchMode, isPinned]);

  const renderFolderItems = () =>
    folders.map((folder, index) => {
      const nextFolder = folders[index + 1];
      const isNextFolderHovered = nextFolder?.id === hoveredFolderId;
      const containsActiveConversation = folder.conversations.find(
        conversation => genConversationId(conversation) === selectedConversationId,
      );

      const shouldExpandByDefault =
        containsActiveConversation ||
        (ungroupedConversationsCount === 0 && folder.conversations && folder.conversations.length > 0) ||
        (isSearchMode && folder.hasSearchMatches);

      return (
        <FolderItem
          key={`${folder.id}-${forceRerenderKey}`}
          folder={folder}
          collapsed={collapsed && !isSmallWindow}
          onEditFolder={onEditFolder}
          onPinFolder={onPinFolder}
          onDeleteFolder={onDeleteFolder}
          onChangeActiveFolderName={onChangeActiveFolderName}
          onCancelCreateFolder={onCancelCreateFolder}
          onCreateFolder={onCreateFolder}
          renderConversationItem={renderConversationItem}
          moveTargetConversationToNewFolder={moveTargetConversationToNewFolder}
          cancelMovingTargetConversationToNewFolder={cancelMovingTargetConversationToNewFolder}
          containsActiveConversation={shouldExpandByDefault}
          enableDragAndDrop={enableDragAndDrop}
          getDropAreaState={getDropAreaState}
          onFolderHover={handleFolderHover}
          isNextFolderHovered={isNextFolderHovered}
          isDragDisabled={isSearchMode || isFolderOperationInProgress || isPinned}
        />
      );
    });

  return (
    <>
      {isLoadConversations ? (
        Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            animation="wave"
            variant="rectangular"
            sx={styles.skeletonLoader}
          />
        ))
      ) : (
        <Box sx={styles.foldersContainer}>
          {enableDragAndDrop && !isSearchMode && folderIds.length > 0 ? (
            <SortableContext
              items={folderIds}
              strategy={verticalListSortingStrategy}
            >
              {renderFolderItems()}
            </SortableContext>
          ) : (
            <> {renderFolderItems()}</>
          )}

          {isLoadMoreConversations &&
            Array.from({ length: 4 }).map((_, index) => (
              <Box
                sx={styles.loadMoreSkeletonContainer}
                key={index}
              >
                <Skeleton
                  animation="wave"
                  variant="rectangular"
                  sx={styles.loadMoreSkeleton}
                />
              </Box>
            ))}
          {folders.length > 0 && (
            <ListInfiniteMoreLoader
              listCurrentSize={folders?.length}
              totalAvailableCount={ungroupedConversationsCount}
              onLoadMore={onLoadMore}
              resetPageDependencies={undefined}
            />
          )}
        </Box>
      )}
    </>
  );
});

const foldersStyles = (collapsed, isSmallWindow) => {
  const spacing = {
    small: '0.5rem',
    skeletonHeight: '4.625rem',
  };

  return {
    skeletonLoader: {
      width: '100%',
      height: spacing.skeletonHeight,
      marginTop: spacing.small,
    },
    foldersContainer: {
      display: collapsed && !isSmallWindow ? 'none' : 'flex',
      flexDirection: 'column',
    },
    loadMoreSkeletonContainer: {
      marginBottom: spacing.small,
      minHeight: spacing.skeletonHeight,
      width: '100%',
    },
    loadMoreSkeleton: {
      width: '100%',
      height: spacing.skeletonHeight,
    },
  };
};

export default Folders;

Folders.displayName = 'Folders';
