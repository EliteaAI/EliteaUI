import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Button, IconButton, Skeleton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import {
  ConversationItem,
  DroppableGroupedArea,
  Folders,
  GroupedConversations,
  PinnedConversations,
} from '@/[fsd]/features/chat/conversation-list/ui';
import { CHAT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import { useLazyDateGroupConversationsQuery, useLazyFolderConversationsQuery } from '@/api';
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
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSortQueryParamsFromUrl from '@/hooks/useSortQueryParamsFromUrl';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { useTheme } from '@emotion/react';

const Conversations = memo(props => {
  const {
    conversations,
    pinnedConversations,
    dateGroups,
    setDateGroups,
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
    setFolders,
    onDeleteFolder,
    onEditFolder,
    onPinFolder,
    onMoveToFolderConversation,
    onMoveToNewFolderConversation,
    moveTargetConversationToNewFolder,
    cancelMovingTargetConversationToNewFolder,
    onClickCreateNewFolder,
    enableDragAndDrop = true,
    toastSuccess,
    toastError,
    onReorderFolders,
    isFolderOperationInProgress = false,
    onSearchQueryChange,
  } = props;

  const theme = useTheme();
  const listRef = useRef(null);

  const { id: userId } = useSelector(state => state.user);
  const projectId = useSelectedProjectId();

  const { checkPermission } = useCheckPermission();
  const { isSmallWindow } = useIsSmallWindow();
  const preventDoubleClick = usePreventDoubleClick();

  const { isEditingCanvas } = useSelector(state => state.settings.navBlocker);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const [loadingGroups, setLoadingGroups] = useState(new Set());
  const [loadingFolders, setLoadingFolders] = useState(new Set());

  const [triggerDateGroupFetch] = useLazyDateGroupConversationsQuery();
  const [triggerFolderFetch] = useLazyFolderConversationsQuery();
  const { sort_by: sortBy, sort_order: sortOrder } = useSortQueryParamsFromUrl({
    defaultSortOrder: 'desc',
    defaultSortBy: 'updated_at',
  });

  const handleSearchChange = useCallback(query => {
    setSearchQuery(query);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setIsSearchActive(false);
  }, []);

  const handleSearchActivate = useCallback(active => {
    setIsSearchActive(active);
  }, []);

  const debouncedSearchQuery = useDebounceValue(searchQuery, 500);

  useEffect(() => {
    onSearchQueryChange?.(debouncedSearchQuery.trim() || undefined);
  }, [debouncedSearchQuery, onSearchQueryChange]);

  useEffect(() => {
    if (isSearchActive && conversations.find(conv => conv.isNew)) {
      setIsSearchActive(false);
      setSearchQuery('');
    }
  }, [isSearchActive, conversations]);

  const onLoadMoreInGroup = useCallback(
    async groupName => {
      if (loadingGroups.has(groupName)) return;

      const group = dateGroups.find(g => g.name === groupName);

      if (!group || group.exhausted || group.conversations.length >= (group.total || 0)) return;

      setLoadingGroups(prev => new Set([...prev, groupName]));

      try {
        const result = await triggerDateGroupFetch({
          projectId,
          dateGroup: groupName,
          limit: 10,
          offset: group.offset || group.conversations.length,
          sort_by: sortBy,
          sort_order: sortOrder,
        }).unwrap();

        setDateGroups(prev =>
          prev.map(g => {
            if (g.name !== groupName) return g;

            const existingIds = new Set(g.conversations.map(c => c.id));
            const pinnedIds = new Set((pinnedConversations || []).map(c => c.id));
            const rawConversations = result.conversations || [];
            const newConversations = rawConversations.filter(c => !existingIds.has(c.id) && !pinnedIds.has(c.id));
            const newOffset = (g.offset || g.conversations.length) + rawConversations.length;

            return {
              ...g,
              conversations: [...g.conversations, ...newConversations],
              offset: newOffset,
              total: result.total ?? g.total,
              exhausted: rawConversations.length === 0 || newOffset >= (result.total ?? g.total),
            };
          }),
        );
      } catch {
        // Error handled by RTK Query
      } finally {
        setLoadingGroups(prev => {
          const next = new Set(prev);
          next.delete(groupName);
          return next;
        });
      }
    },
    [dateGroups, loadingGroups, pinnedConversations, projectId, setDateGroups, triggerDateGroupFetch, sortBy, sortOrder],
  );

  const onLoadMoreInFolder = useCallback(
    async folderId => {
      if (loadingFolders.has(folderId)) return;

      const folder = folders.find(f => f.id === folderId);

      if (!folder || folder.exhausted || folder.conversations.length >= (folder.total || 0)) return;

      setLoadingFolders(prev => new Set([...prev, folderId]));

      try {
        const result = await triggerFolderFetch({
          projectId,
          folderId,
          limit: 10,
          offset: folder.offset || folder.conversations.length,
          sort_by: sortBy,
          sort_order: sortOrder,
        }).unwrap();

        setFolders(prev =>
          prev.map(f => {
            if (f.id !== folderId) return f;
            const existingIds = new Set(f.conversations.map(c => c.id));
            const pinnedIds = new Set((pinnedConversations || []).map(c => c.id));
            const rawConversations = result.conversations || [];
            const newConversations = rawConversations.filter(c => !existingIds.has(c.id) && !pinnedIds.has(c.id));
            const newOffset = (f.offset || f.conversations.length) + rawConversations.length;

            return {
              ...f,
              conversations: [...f.conversations, ...newConversations],
              offset: newOffset,
              total: result.total ?? f.total,
              exhausted: rawConversations.length === 0 || newOffset >= (result.total ?? f.total),
            };
          }),
        );
      } catch {
        // Error handled by RTK Query
      } finally {
        setLoadingFolders(prev => {
          const next = new Set(prev);
          next.delete(folderId);
          return next;
        });
      }
    },
    [folders, loadingFolders, pinnedConversations, projectId, setFolders, triggerFolderFetch, sortBy, sortOrder],
  );

  // Initialize drag and drop functionality
  const { sensors, handleDragStart, handleDragEnd, handleDragOver, getDropAreaState } = useDragAndDrop({
    onMoveToFolderConversation,
    onReorderFolders: onReorderFolders ? newOrder => onReorderFolders(newOrder) : undefined,
    folders,
    originalFolders: folders,
    conversations,
    selectedConversations: [],
    toastSuccess,
    toastError,
  });

  const pinnedFolders = useMemo(() => folders.filter(folder => folder.meta?.is_pinned), [folders]);

  const unpinnedFolders = useMemo(() => folders.filter(folder => !folder.meta?.is_pinned), [folders]);

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
      if (conversation.isPlayback) return [];

      if (!conversation.isPlayback) {
        const hasPlaybacks =
          conversations.some(conv => conv.isPlayback && conv.id === conversation.id) ||
          folders.some(folder =>
            (folder.conversations || []).some(conv => conv.isPlayback && conv.id === conversation.id),
          );

        if (hasPlaybacks) return [];
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
        isDragDisabled={isEditingCanvas || conversation.isPlayback || conversation.isPinned}
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
        onLoadMoreInFolder={onLoadMoreInFolder}
        loadingFolders={loadingFolders}
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
      onLoadMoreInFolder,
      loadingFolders,
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
        data-tour={CHAT_TOUR_TARGET_IDS.conversations}
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
            {(!collapsed || isSmallWindow) && <Typography variant="subtitle">Chats</Typography>}
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
                      variant="elitea"
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
              variant="elitea"
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
                  variant="elitea"
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
              variant="elitea"
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

            <Box data-tour={CHAT_TOUR_TARGET_IDS.folders}>{renderFoldersSection({ isPinned: false })}</Box>

            {/* Render Grouped Conversations */}
            <DroppableGroupedArea
              isDropDisabled={!enableDragAndDrop || isEditingCanvas}
              {...getDropAreaState('ungrouped-conversations')}
            >
              <GroupedConversations
                dateGroups={dateGroups}
                renderConversationItem={renderConversationItem}
                onLoadMoreInGroup={onLoadMoreInGroup}
                loadingGroups={loadingGroups}
                totalConversationsAmount={totalConversationsAmount}
                enableDragAndDrop={enableDragAndDrop}
                getDropAreaState={getDropAreaState}
                selectedConversationId={selectedConversationId}
                isSearchMode={!!debouncedSearchQuery.trim()}
                searchQuery={debouncedSearchQuery}
              />
            </DroppableGroupedArea>

            {/* No search results message */}
            {isSearchActive &&
              debouncedSearchQuery.trim() &&
              conversations.length === 0 &&
              folders.every(f => !f.conversations?.length) && (
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
});

Conversations.displayName = 'Conversations';

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
