import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Button, IconButton, Skeleton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import { PERMISSIONS } from '@/common/constants';
import { genConversationId } from '@/common/utils';
import ConversationSearchButton from '@/components/ConversationSearchButton';
import CloseIcon from '@/components/Icons/CloseIcon';
import DoubleLeftIcon from '@/components/Icons/DoubleLeftIcon';
import DoubleRightIcon from '@/components/Icons/DoubleRightIcon';
import FromFolder from '@/components/Icons/FromFolder';
import NewFolder from '@/components/Icons/NewFolder';
import useDragAndDrop from '@/hooks/chat/useDragAndDrop';
import useCheckPermission from '@/hooks/useCheckPermission';
import useDebounceValue from '@/hooks/useDebounceValue';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import usePreventDoubleClick from '@/hooks/usePreventDoubleClick';
import { PinnedConversations } from '@/pages/NewChat/PinnedConversations';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { useTheme } from '@emotion/react';

import ConversationItem from './ConversationItem';
import DroppableUngroupedArea from './DroppableUngroupedArea';
import Folders from './Folders';
import { UngroupedConversations } from './UngroupedConversations';

const Conversations = ({
  conversations,
  ungroupedConversationsCount,
  totalConversationsAmount,
  onSelectConversation,
  selectedConversationId,
  collapsed,
  onCollapsed,
  onEditConversation,
  onPlaybackConversation,
  onDeleteConversation,
  onLoadMore,
  isLoadConversations,
  isLoadMoreConversations,
  onPinConversation,
  onCreateConversation,
  onCancelCreateConversation,
  onChangeActiveConversationName,
  onChangeActiveFolderName,
  onCreateFolder,
  onCancelCreateFolder,
  folders,
  onDeleteFolder,
  onEditFolder,
  onPinFolder,
  onMoveToFolderConversation,
  onMoveToNewFolderConversation,
  moveTargetConversationToNewFolder,
  cancelMovingTargetConversationToNewFolder,
  onClickCreateNewFolder,
  enableDragAndDrop = true, // Enable drag and drop by default
  toastSuccess,
  toastError,
  onReorderFolders,
  isFolderOperationInProgress = false,
}) => {
  const { id: userId } = useSelector(state => state.user);
  const { checkPermission } = useCheckPermission();
  const { isSmallWindow } = useIsSmallWindow();
  const theme = useTheme();
  const preventDoubleClick = usePreventDoubleClick();
  const listRef = useRef(null);
  const { isEditingCanvas } = useSelector(state => state.settings.navBlocker);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [wasSearchModeActive, setWasSearchModeActive] = useState(false);

  const handleSearchChange = useCallback(query => {
    setSearchQuery(query);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setIsSearchActive(false);
    // Mark that we're exiting search mode
    setWasSearchModeActive(false);
  }, []);

  const handleSearchActivate = useCallback(active => {
    setIsSearchActive(active);
  }, []);

  // Debounced search query for better performance
  const debouncedSearchQuery = useDebounceValue(searchQuery, 500);

  // Track search mode transitions
  useEffect(() => {
    const isCurrentlySearching = !!debouncedSearchQuery.trim();
    if (isCurrentlySearching && !wasSearchModeActive) {
      setWasSearchModeActive(true);
    } else if (!isCurrentlySearching && wasSearchModeActive) {
      setWasSearchModeActive(false);
    }
  }, [debouncedSearchQuery, wasSearchModeActive]);

  useEffect(() => {
    if (isSearchActive && conversations.find(conv => conv.isNew)) {
      setIsSearchActive(false);
      setSearchQuery('');
    }
  }, [isSearchActive, conversations]);

  // Search filtering logic
  const { filteredConversations, filteredFolders, hasSearchResults } = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return {
        filteredConversations: conversations,
        filteredFolders: folders,
        hasSearchResults: true,
      };
    }

    const query = debouncedSearchQuery.toLowerCase().trim();

    // Filter conversations based on name
    const filterConversations = convs => {
      return convs.filter(
        conv => conv.name?.toLowerCase().includes(query) || conv.id?.toString().includes(query),
      );
    };

    // Filter conversations
    const filteredConvs = filterConversations(conversations);

    // Filter folders and their conversations
    const filteredFols = folders
      .map(folder => {
        const filteredFolderConversations = filterConversations(folder.conversations || []);

        // Only include folder if it has matching conversations (ignore folder name)
        if (filteredFolderConversations.length > 0) {
          return {
            ...folder,
            conversations: filteredFolderConversations,
            // Mark folder as having search matches to force expansion
            hasSearchMatches: true,
          };
        }
        return null;
      })
      .filter(Boolean);

    const hasResults = filteredConvs.length > 0 || filteredFols.length > 0;

    return {
      filteredConversations: filteredConvs,
      filteredFolders: filteredFols,
      hasSearchResults: hasResults,
    };
  }, [conversations, folders, debouncedSearchQuery]);

  // Initialize drag and drop functionality
  const {
    sensors,
    // activeId,
    // draggedItems,
    // draggedFromFolder,
    // isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    getDropAreaState,
  } = useDragAndDrop({
    onMoveToFolderConversation,
    onReorderFolders: onReorderFolders
      ? newOrder => {
          onReorderFolders(newOrder);
        }
      : undefined,
    folders: filteredFolders,
    originalFolders: folders,
    conversations: filteredConversations,
    selectedConversations: [], // TODO: Implement multi-select functionality
    toastSuccess,
    toastError,
  });

  const pinnedConversations = useMemo(
    () => filteredConversations.filter(conversation => conversation.isPinned),
    [filteredConversations],
  );

  const pinnedFolders = useMemo(
    () => filteredFolders.filter(folder => folder.meta?.is_pinned),
    [filteredFolders],
  );

  const unpinnedFolders = useMemo(
    () => filteredFolders.filter(folder => !folder.meta?.is_pinned),
    [filteredFolders],
  );

  const ungroupedConversations = useMemo(
    () => filteredConversations.filter(conversation => !conversation.isPinned),
    [filteredConversations],
  );

  const onClickSelectConversation = useCallback(
    conversation => {
      onSelectConversation(conversation);
    },
    [onSelectConversation],
  );

  const clickCreateNewFolder = useCallback(
    shouldCollapse => () => {
      onClickCreateNewFolder();

      if (shouldCollapse) {
        onCollapsed();
      }
    },
    [onClickCreateNewFolder, onCollapsed],
  );

  const clickOnMoveToNewFolder = useCallback(
    async conversation => {
      await onMoveToNewFolderConversation(conversation);
    },
    [onMoveToNewFolderConversation],
  );

  const clickOnMoveToFolder = useCallback(
    async (conversation, targetFolder) => {
      await onMoveToFolderConversation(conversation, targetFolder);
    },
    [onMoveToFolderConversation],
  );

  const getMoveConversationToFoldersMenuItems = useCallback(
    conversation => {
      // Don't allow moving playback conversations
      if (conversation.isPlayback) {
        return [];
      }

      // Don't allow moving original conversations if they have playback conversations
      if (!conversation.isPlayback) {
        // Check for playback conversations
        const hasPlaybacks =
          conversations.some(conv => conv.isPlayback && conv.id === conversation.id) ||
          folders.some(folder =>
            (folder.conversations || []).some(conv => conv.isPlayback && conv.id === conversation.id),
          );

        if (hasPlaybacks) {
          return [];
        }
      }

      const newFolderMenuItem = [
        {
          disabled: !checkPermission(PERMISSIONS.chat.folders.create),
          key: 'create_folder',
          label: (
            <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <NewFolder
                sx={{
                  width: '16px',
                  height: '16px',
                }}
                fill={
                  checkPermission(PERMISSIONS.chat.folders.create)
                    ? theme.palette.icon.fill.default
                    : theme.palette.icon.fill.disabled
                }
              />
              <Box>Create folder</Box>
            </Box>
          ),
          onClick: async () => {
            await preventDoubleClick(() => clickOnMoveToNewFolder(conversation));
          },
        },
        {
          addSeparator: true,
          disabled: !conversation.folder_id || !checkPermission(PERMISSIONS.chat.folders.update),
          key: 'back_to_the_list',
          label: (
            <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FromFolder
                sx={{
                  width: '16px',
                  height: '16px',
                }}
                fill={
                  checkPermission(PERMISSIONS.chat.folders.update)
                    ? theme.palette.icon.fill.default
                    : theme.palette.icon.fill.disabled
                }
              />
              <Box>Back to the list</Box>
            </Box>
          ),
          onClick: async () => {
            await preventDoubleClick(() => clickOnMoveToFolder(conversation, null));
          },
        },
      ];

      const folderItems = folders.map(targetFolder => {
        return {
          label: targetFolder.name,
          disabled:
            targetFolder?.owner_id !== userId ||
            !checkPermission(PERMISSIONS.chat.folders.update) ||
            conversation.folder_id === targetFolder.id,
          onClick: async () => {
            if (conversation.folder_id !== targetFolder.id) {
              await preventDoubleClick(() => clickOnMoveToFolder(conversation, targetFolder));
            } else {
              await preventDoubleClick(() => clickOnMoveToFolder(conversation, null));
            }
          },
        };
      });

      return [...newFolderMenuItem, ...folderItems];
    },
    [
      userId,
      checkPermission,
      clickOnMoveToFolder,
      clickOnMoveToNewFolder,
      conversations,
      folders,
      theme,
      preventDoubleClick,
    ],
  );

  const renderConversationItem = useCallback(
    (conversation, onItemHover, isNextItemHovered) => (
      <ConversationItem
        isActive={selectedConversationId === genConversationId(conversation)}
        key={genConversationId(conversation)}
        conversation={conversation}
        onSelectConversation={onClickSelectConversation}
        collapsed={collapsed && !isSmallWindow}
        onEdit={onEditConversation}
        onPlayback={onPlaybackConversation}
        onDelete={onDeleteConversation}
        onPin={onPinConversation}
        onCreateConversation={onCreateConversation}
        onCancelCreate={onCancelCreateConversation}
        onChangeActiveConversationName={onChangeActiveConversationName}
        moveToFoldersMenuItems={getMoveConversationToFoldersMenuItems(conversation)}
        isEditingCanvas={isEditingCanvas}
        enableDragAndDrop={enableDragAndDrop}
        isDragDisabled={isEditingCanvas || conversation.isPlayback}
        onItemHover={onItemHover}
        isNextItemHovered={isNextItemHovered}
      />
    ),
    [
      collapsed,
      getMoveConversationToFoldersMenuItems,
      isSmallWindow,
      onCancelCreateConversation,
      onChangeActiveConversationName,
      onCreateConversation,
      onDeleteConversation,
      onEditConversation,
      onPinConversation,
      onPlaybackConversation,
      selectedConversationId,
      isEditingCanvas,
      onClickSelectConversation,
      enableDragAndDrop,
    ],
  );

  const renderFoldersSection = useCallback(
    ({ isPinned }) => (
      <Folders
        isLoadConversations={isLoadConversations}
        isLoadMoreConversations={isLoadMoreConversations}
        ungroupedConversationsCount={ungroupedConversationsCount}
        collapsed={collapsed}
        onLoadMore={onLoadMore}
        folders={isPinned ? pinnedFolders : unpinnedFolders}
        onDeleteFolder={onDeleteFolder}
        onCreateFolder={onCreateFolder}
        onCancelCreateFolder={onCancelCreateFolder}
        onChangeActiveFolderName={onChangeActiveFolderName}
        onEditFolder={onEditFolder}
        onPinFolder={onPinFolder}
        renderConversationItem={renderConversationItem}
        moveTargetConversationToNewFolder={moveTargetConversationToNewFolder}
        cancelMovingTargetConversationToNewFolder={cancelMovingTargetConversationToNewFolder}
        selectedConversationId={selectedConversationId}
        enableDragAndDrop={enableDragAndDrop}
        getDropAreaState={getDropAreaState}
        isSearchMode={!!debouncedSearchQuery.trim()}
        isFolderOperationInProgress={isFolderOperationInProgress}
        isPinned={isPinned}
      />
    ),
    [
      isLoadConversations,
      isLoadMoreConversations,
      ungroupedConversationsCount,
      collapsed,
      onLoadMore,
      pinnedFolders,
      unpinnedFolders,
      onDeleteFolder,
      onCreateFolder,
      onCancelCreateFolder,
      onChangeActiveFolderName,
      onEditFolder,
      onPinFolder,
      renderConversationItem,
      moveTargetConversationToNewFolder,
      cancelMovingTargetConversationToNewFolder,
      selectedConversationId,
      enableDragAndDrop,
      getDropAreaState,
      debouncedSearchQuery,
      isFolderOperationInProgress,
    ],
  );

  const styles = conversationsStyles();

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      collisionDetection={closestCenter}
      autoScroll={false}
    >
      <Box
        sx={{ height: '100%', position: 'relative', width: collapsed && !isSmallWindow ? '36px' : '100%' }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: collapsed && !isSmallWindow ? 'center' : 'space-between',
            height: '32px',
            alignItems: 'center',
          }}
        >
          <Box
            display={'flex'}
            flexDirection={'row'}
            alignItems={'center'}
            gap={'8px'}
          >
            {(!collapsed || isSmallWindow) && <Typography variant="subtitle">Conversations</Typography>}
            {(!collapsed || isSmallWindow) && (
              <>
                <Tooltip
                  title="Create folder"
                  placement="top"
                >
                  <span>
                    <Button
                      disabled={!checkPermission(PERMISSIONS.chat.folders.create)}
                      onClick={clickCreateNewFolder(false)}
                      variant="alita"
                      color="secondary"
                      sx={{
                        minWidth: '28px !important',
                        width: '28px !important',
                        height: '28px',
                        boxSizing: 'border-box',
                        padding: '6px !important',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <NewFolder
                        sx={{
                          width: '16px',
                          height: '16px',
                        }}
                        fill={
                          checkPermission(PERMISSIONS.chat.folders.create)
                            ? theme.palette.icon.fill.secondary
                            : theme.palette.icon.fill.disabled
                        }
                      />
                    </Button>
                  </span>
                </Tooltip>
                <ConversationSearchButton
                  collapsed={collapsed}
                  onExpand={onCollapsed}
                  onSearchActivate={handleSearchActivate}
                />
              </>
            )}
          </Box>
          {!isSmallWindow && (
            <IconButton
              sx={{ marginLeft: '0px' }}
              variant="alita"
              color="tertiary"
              onClick={onCollapsed}
            >
              {!collapsed ? (
                <DoubleLeftIcon
                  fill={theme.palette.icon.fill.default}
                  width={16}
                />
              ) : (
                <DoubleRightIcon
                  fill={theme.palette.icon.fill.default}
                  width={16}
                />
              )}
            </IconButton>
          )}
        </Box>
        {collapsed && !isSmallWindow && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Tooltip
              title="Create folder"
              placement="top"
            >
              <Box component="span">
                <Button
                  disabled={!checkPermission(PERMISSIONS.chat.folders.create)}
                  onClick={clickCreateNewFolder(true)}
                  variant="alita"
                  color="secondary"
                  sx={{
                    minWidth: '28px !important',
                    width: '28px !important',
                    height: '28px',
                    boxSizing: 'border-box',
                    padding: '6px !important',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <NewFolder
                    sx={{
                      width: '16px',
                      height: '16px',
                    }}
                    fill={
                      checkPermission(PERMISSIONS.chat.folders.create)
                        ? theme.palette.icon.fill.secondary
                        : theme.palette.icon.fill.disabled
                    }
                  />
                </Button>
              </Box>
            </Tooltip>
            <ConversationSearchButton
              collapsed={collapsed}
              onExpand={onCollapsed}
              onSearchActivate={handleSearchActivate}
            />
          </Box>
        )}

        {/* Search Bar - Appears when search is active */}
        {isSearchActive && !collapsed && (
          <Box sx={styles.searchBarContainer}>
            <SimpleSearchBar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchClear={handleSearchClear}
              placeholder="Search conversations..."
            />
            <IconButton
              onClick={handleSearchClear}
              variant="alita"
              color="tertiary"
            >
              <CloseIcon sx={styles.closeIcon} />
            </IconButton>
          </Box>
        )}

        {isLoadConversations ? (
          Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={index}
              animation="wave"
              variant="rectangular"
              width="100%"
              height="74px"
              sx={{ marginTop: '8px' }}
            />
          ))
        ) : (
          <Box
            ref={listRef}
            sx={{
              marginTop: '8px',
              display: collapsed && !isSmallWindow ? 'none' : 'flex',
              flexDirection: 'column',
              overflowY: 'scroll',
              height: `calc(100% - 40px)`,
              paddingBottom: '32px',
            }}
          >
            {renderFoldersSection({ isPinned: true })}

            <PinnedConversations
              pinnedConversations={pinnedConversations}
              renderConversationItem={renderConversationItem}
            />

            {renderFoldersSection({ isPinned: false })}

            {/* Render Ungrouped Conversations */}
            <DroppableUngroupedArea
              isDropDisabled={!enableDragAndDrop || isEditingCanvas}
              {...getDropAreaState('ungrouped-conversations')}
            >
              <UngroupedConversations
                ungroupedConversations={ungroupedConversations}
                renderConversationItem={renderConversationItem}
                onLoadMore={onLoadMore}
                isLoadMoreConversations={isLoadMoreConversations}
                ungroupedConversationsCount={ungroupedConversationsCount}
                totalConversationsAmount={totalConversationsAmount}
                enableDragAndDrop={enableDragAndDrop}
                getDropAreaState={getDropAreaState}
                selectedConversationId={selectedConversationId}
                isSearchMode={!!debouncedSearchQuery.trim()}
                searchQuery={debouncedSearchQuery}
              />
            </DroppableUngroupedArea>

            {/* No search results message */}
            {isSearchActive && debouncedSearchQuery.trim() && !hasSearchResults && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 16px',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="bodyMedium"
                  color="text.button.disabled"
                  sx={{ marginBottom: '8px' }}
                >
                  No conversations found
                </Typography>
                <Typography
                  variant="bodySmall"
                  color="text.button.disabled"
                >
                  Try adjusting your search terms
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </DndContext>
  );
};

/** @type {MuiSx} */
const conversationsStyles = () => ({
  searchBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0rem',
    paddingBottom: '0.25rem',
  },
  closeIcon: {
    fontSize: '1.25rem',
  },
});

export default Conversations;
