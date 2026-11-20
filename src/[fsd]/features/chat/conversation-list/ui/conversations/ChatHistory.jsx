import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Skeleton, Typography, useTheme } from '@mui/material';

import { CHAT_HISTORY_SORT } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import {
  useChatHistoryActions,
  useChatHistoryData,
  useChatHistoryItemActions,
} from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import {
  ConversationItem,
  DroppableGroupedArea,
  Folders,
  GroupedConversations,
  PinnedConversations,
  PinnedGroup,
} from '@/[fsd]/features/chat/conversation-list/ui';
import { CHAT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import {
  useDebounceValue,
  usePreventDoubleClick,
  useSelectedProjectId,
  useToastHandlers,
} from '@/[fsd]/shared/lib/hooks';
import { useLazyDateGroupConversationsQuery, useLazyFolderConversationsQuery } from '@/api';
import { PERMISSIONS } from '@/common/constants';
import { genConversationId } from '@/common/utils';
import FromFolder from '@/components/Icons/FromFolder';
import NewFolder from '@/components/Icons/NewFolder';
import useDragAndDrop from '@/hooks/chat/useDragAndDrop';
import useCheckPermission from '@/hooks/useCheckPermission';
import { DndContext, closestCenter } from '@dnd-kit/core';

import { ShareChatModal } from '../share';
import ChatHistoryHeader from './ChatHistoryHeader';
import ExportConversationModal from './ExportConversationModal';
import ImportConversationModal from './ImportConversationModal';

const PAGE_SIZE = 10;

// The project's chats and folders in the menu, on every page
const ChatHistory = memo(props => {
  const { onOpenConversation } = props;

  const theme = useTheme();
  const { toastError, toastSuccess } = useToastHandlers();

  const { id: userId } = useSelector(state => state.user);
  const { isEditingCanvas } = useSelector(state => state.settings.navBlocker);
  const projectId = useSelectedProjectId();

  const { checkPermission } = useCheckPermission();
  const preventDoubleClick = usePreventDoubleClick();

  const {
    dateGroups,
    pinnedConversations,
    folders,
    isLoadConversations,
    isLoadMoreConversations,
    chatPageState,
    isPinnedExpanded,
    dateGroupExpansion,
  } = useChatHistoryData();
  const {
    setDateGroups,
    setFolders,
    setSearchQuery: setHistorySearchQuery,
    setIsPinnedExpanded,
    togglePinnedGroup,
    folderExpansionRef,
    historyScrollTopRef,
  } = useChatHistoryActions();

  const {
    onSelectConversation,
    onEditConversation,
    onDeleteConversation,
    onPinConversation,
    onDuplicateConversation,
    onPlaybackConversation,
    onCreateConversation,
    onCancelCreateConversation,
    onChangeActiveConversationName,
    onCreateConversationInFolder,
    onImportedConversation,
    onRestrictAccessSuccess,
    onCreateFolder,
    onCancelCreateFolder,
    onEditFolder,
    onPinFolder,
    onDeleteFolder,
    onReorderFolders,
    isFolderUpdate,
    onMoveToFolderConversation,
    onMoveToNewFolderConversation,
    moveTargetConversationToNewFolder,
    cancelMovingTargetConversationToNewFolder,
    onChangeActiveFolderName,
    onClickCreateNewFolder,
  } = useChatHistoryItemActions({ onOpenConversation, toastError, toastSuccess });

  const { isMounted: isChatPageMounted, selectedConversationId, duplicatingConversationId } = chatPageState;

  // The collapsed menu unmounts the list: it comes back where the user left it (once the rows are there)
  const listRef = useRef(null);
  const isScrollRestoredRef = useRef(false);
  const handleListScroll = useCallback(
    event => {
      historyScrollTopRef.current = event.currentTarget.scrollTop;
    },
    [historyScrollTopRef],
  );
  useLayoutEffect(() => {
    if (isScrollRestoredRef.current || isLoadConversations || !listRef.current) return;
    isScrollRestoredRef.current = true;
    listRef.current.scrollTop = historyScrollTopRef.current;
  }, [historyScrollTopRef, isLoadConversations]);

  const conversations = useMemo(() => dateGroups.flatMap(group => group.conversations), [dateGroups]);

  const ungroupedConversationsCount = useMemo(
    () => dateGroups.reduce((sum, group) => sum + (group.total || 0), 0),
    [dateGroups],
  );

  const totalConversationsAmount = useMemo(
    () =>
      ungroupedConversationsCount +
      folders.reduce((sum, folder) => sum + (folder.total || folder.conversations?.length || 0), 0),
    [folders, ungroupedConversationsCount],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const [loadingGroups, setLoadingGroups] = useState(new Set());
  const [loadingFolders, setLoadingFolders] = useState(new Set());

  const [shareChatConversation, setShareChatConversation] = useState(null);
  const [exportConversation, setExportConversation] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleCloseExportModal = useCallback(() => setExportConversation(null), []);
  const handleOpenImportModal = useCallback(() => setIsImportModalOpen(true), []);
  const handleCloseImportModal = useCallback(() => setIsImportModalOpen(false), []);
  const handleCloseShareChat = useCallback(() => setShareChatConversation(null), []);

  const handleSearchActivate = useCallback(() => setIsSearchActive(true), []);
  const handleSearchChange = useCallback(query => setSearchQuery(query), []);
  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
    setIsSearchActive(false);
  }, []);

  const debouncedSearchQuery = useDebounceValue(searchQuery, 500);
  const isSearchMode = !!debouncedSearchQuery.trim();

  useEffect(() => {
    setHistorySearchQuery(debouncedSearchQuery.trim() || undefined);
  }, [debouncedSearchQuery, setHistorySearchQuery]);

  // The search results replace the lists; the loaded pages come back when the search is cleared
  const savedStateBeforeSearchRef = useRef(null);
  const dateGroupsRef = useRef(dateGroups);
  const foldersRef = useRef(folders);
  dateGroupsRef.current = dateGroups;
  foldersRef.current = folders;

  useEffect(() => {
    if (isSearchMode && !savedStateBeforeSearchRef.current) {
      savedStateBeforeSearchRef.current = {
        dateGroups: dateGroupsRef.current,
        folders: foldersRef.current,
      };
    } else if (!isSearchMode && savedStateBeforeSearchRef.current) {
      setDateGroups(savedStateBeforeSearchRef.current.dateGroups);
      setFolders(savedStateBeforeSearchRef.current.folders);
      savedStateBeforeSearchRef.current = null;
    }
  }, [isSearchMode, setDateGroups, setFolders]);

  // Search opens Pinned (as it opens the date groups with results) and gives the user's choice back after
  const pinnedExpandedBeforeSearchRef = useRef(null);
  useEffect(() => {
    if (isSearchMode && pinnedExpandedBeforeSearchRef.current === null) {
      pinnedExpandedBeforeSearchRef.current = isPinnedExpanded;
      setIsPinnedExpanded(true);
    } else if (!isSearchMode && pinnedExpandedBeforeSearchRef.current !== null) {
      setIsPinnedExpanded(pinnedExpandedBeforeSearchRef.current);
      pinnedExpandedBeforeSearchRef.current = null;
    }
  }, [isPinnedExpanded, isSearchMode, setIsPinnedExpanded]);

  // The collapsed menu unmounts the list mid-search: end the search there, so the list is not left filtered
  // and the groups get the user's open/folded state back
  const { exitSearchMode } = dateGroupExpansion;
  useEffect(() => {
    const pinnedBeforeSearch = pinnedExpandedBeforeSearchRef;
    return () => {
      setHistorySearchQuery(undefined);
      if (pinnedBeforeSearch.current !== null) setIsPinnedExpanded(pinnedBeforeSearch.current);
      exitSearchMode();
    };
  }, [exitSearchMode, setHistorySearchQuery, setIsPinnedExpanded]);

  useEffect(() => {
    if (isSearchActive && conversations.find(conversation => conversation.isNew)) handleSearchClear();
  }, [conversations, handleSearchClear, isSearchActive]);

  // A page that lands after a project switch belongs to the old project
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  const [triggerDateGroupFetch] = useLazyDateGroupConversationsQuery();
  const [triggerFolderFetch] = useLazyFolderConversationsQuery();

  const onLoadMoreInGroup = useCallback(
    async groupName => {
      if (loadingGroups.has(groupName) || searchQuery) return;

      const group = dateGroups.find(g => g.name === groupName);
      if (!group || group.exhausted || group.conversations.length >= (group.total || 0)) return;

      setLoadingGroups(prev => new Set([...prev, groupName]));

      try {
        const result = await triggerDateGroupFetch({
          projectId,
          dateGroup: groupName,
          limit: PAGE_SIZE,
          offset: group.offset || group.conversations.length,
          ...CHAT_HISTORY_SORT,
        }).unwrap();
        if (projectIdRef.current !== projectId) return;

        setDateGroups(prev =>
          prev.map(g => {
            if (g.name !== groupName) return g;

            const existingIds = new Set(g.conversations.map(c => c.id));
            const pinnedIds = new Set((pinnedConversations || []).map(c => c.id));
            const rawConversations = result.conversations || [];
            const newConversations = rawConversations.filter(
              c => !existingIds.has(c.id) && !pinnedIds.has(c.id),
            );
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
    [
      dateGroups,
      loadingGroups,
      pinnedConversations,
      projectId,
      searchQuery,
      setDateGroups,
      triggerDateGroupFetch,
    ],
  );

  const onLoadMoreInFolder = useCallback(
    async folderId => {
      if (loadingFolders.has(folderId) || searchQuery) return;

      const folder = folders.find(f => f.id === folderId);
      if (!folder || folder.exhausted || folder.conversations.length >= (folder.total || 0)) return;

      setLoadingFolders(prev => new Set([...prev, folderId]));

      try {
        const result = await triggerFolderFetch({
          projectId,
          folderId,
          limit: PAGE_SIZE,
          offset: folder.offset || folder.conversations.length,
          ...CHAT_HISTORY_SORT,
        }).unwrap();
        if (projectIdRef.current !== projectId) return;

        setFolders(prev =>
          prev.map(f => {
            if (f.id !== folderId) return f;
            const existingIds = new Set(f.conversations.map(c => c.id));
            const pinnedIds = new Set((pinnedConversations || []).map(c => c.id));
            const rawConversations = result.conversations || [];
            const newConversations = rawConversations.filter(
              c => !existingIds.has(c.id) && !pinnedIds.has(c.id),
            );
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
    [folders, loadingFolders, pinnedConversations, projectId, searchQuery, setFolders, triggerFolderFetch],
  );

  const { sensors, handleDragStart, handleDragEnd, handleDragOver, getDropAreaState } = useDragAndDrop({
    onMoveToFolderConversation,
    onReorderFolders,
    folders,
    originalFolders: folders,
    conversations,
    selectedConversations: [],
    toastSuccess,
    toastError,
  });

  const pinnedFolders = useMemo(() => folders.filter(folder => folder.meta?.is_pinned), [folders]);
  const unpinnedFolders = useMemo(() => folders.filter(folder => !folder.meta?.is_pinned), [folders]);
  const hasPinnedItems = pinnedFolders.length > 0 || pinnedConversations.length > 0;

  const getMoveConversationToFoldersMenuItems = useCallback(
    conversation => {
      if (conversation.isPlayback) return [];

      const hasPlaybacks =
        conversations.some(conv => conv.isPlayback && conv.id === conversation.id) ||
        folders.some(folder =>
          (folder.conversations || []).some(conv => conv.isPlayback && conv.id === conversation.id),
        );

      if (hasPlaybacks) return [];

      const canCreateFolder = checkPermission(PERMISSIONS.chat.folders.create);
      const canUpdateFolder = checkPermission(PERMISSIONS.chat.folders.update);
      const styles = chatHistoryMenuStyles();

      const newFolderMenuItem = [
        {
          disabled: !canCreateFolder,
          key: 'chat-move-to-create-folder',
          label: (
            <Box sx={styles.menuItemRow}>
              <NewFolder
                sx={styles.menuItemIcon}
                fill={canCreateFolder ? theme.palette.icon.default : theme.palette.icon.disabled}
              />
              <Box>Create folder</Box>
            </Box>
          ),
          onClick: async () => {
            await preventDoubleClick(() => onMoveToNewFolderConversation(conversation));
          },
        },
        {
          addSeparator: true,
          disabled: !conversation.folder_id || !canUpdateFolder,
          key: 'chat-move-to-back-to-list',
          label: (
            <Box sx={styles.menuItemRow}>
              <FromFolder
                sx={styles.menuItemIcon}
                fill={canUpdateFolder ? theme.palette.icon.default : theme.palette.icon.disabled}
              />
              <Box>Back to the list</Box>
            </Box>
          ),
          onClick: async () => {
            await preventDoubleClick(() => onMoveToFolderConversation(conversation, null));
          },
        },
      ];

      const folderItems = folders.map(targetFolder => ({
        key: `chat-move-to-folder-${targetFolder.id}`,
        label: targetFolder.name,
        disabled:
          targetFolder?.owner_id !== userId || !canUpdateFolder || conversation.folder_id === targetFolder.id,
        onClick: async () => {
          await preventDoubleClick(() =>
            onMoveToFolderConversation(
              conversation,
              conversation.folder_id !== targetFolder.id ? targetFolder : null,
            ),
          );
        },
      }));

      return [...newFolderMenuItem, ...folderItems];
    },
    [
      checkPermission,
      conversations,
      folders,
      onMoveToFolderConversation,
      onMoveToNewFolderConversation,
      preventDoubleClick,
      theme,
      userId,
    ],
  );

  const renderConversationItem = useCallback(
    conversation => (
      <ConversationItem
        isActive={selectedConversationId === genConversationId(conversation)}
        key={genConversationId(conversation)}
        conversation={conversation}
        onSelectConversation={onSelectConversation}
        onEdit={onEditConversation}
        onPlayback={onPlaybackConversation}
        onDelete={onDeleteConversation}
        onDuplicate={onDuplicateConversation}
        isDuplicating={duplicatingConversationId === conversation.id}
        onExport={setExportConversation}
        onPin={onPinConversation}
        onCreateConversation={onCreateConversation}
        onCancelCreate={onCancelCreateConversation}
        onChangeActiveConversationName={onChangeActiveConversationName}
        getMoveToFoldersMenuItems={getMoveConversationToFoldersMenuItems}
        isEditingCanvas={isEditingCanvas}
        enableDragAndDrop
        isDragDisabled={isEditingCanvas || conversation.isPlayback || conversation.isPinned}
        onShare={setShareChatConversation}
        showChatPageActions={isChatPageMounted}
      />
    ),
    [
      duplicatingConversationId,
      getMoveConversationToFoldersMenuItems,
      isChatPageMounted,
      isEditingCanvas,
      onCancelCreateConversation,
      onChangeActiveConversationName,
      onCreateConversation,
      onDeleteConversation,
      onDuplicateConversation,
      onEditConversation,
      onPinConversation,
      onPlaybackConversation,
      onSelectConversation,
      selectedConversationId,
    ],
  );

  const isFolderOperationInProgress = isFolderUpdate || isLoadConversations || isLoadMoreConversations;

  const renderFoldersSection = useCallback(
    ({ isPinned }) => (
      <Folders
        isLoadConversations={isLoadConversations}
        isLoadMoreConversations={isLoadMoreConversations}
        ungroupedConversationsCount={ungroupedConversationsCount}
        collapsed={false}
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
        enableDragAndDrop
        getDropAreaState={getDropAreaState}
        isSearchMode={isSearchMode}
        searchQuery={debouncedSearchQuery}
        isFolderOperationInProgress={isFolderOperationInProgress}
        isPinned={isPinned}
        onLoadMoreInFolder={onLoadMoreInFolder}
        loadingFolders={loadingFolders}
        onCreateConversationInFolder={isChatPageMounted ? onCreateConversationInFolder : undefined}
        folderExpansion={folderExpansionRef.current}
      />
    ),
    [
      cancelMovingTargetConversationToNewFolder,
      debouncedSearchQuery,
      folderExpansionRef,
      getDropAreaState,
      isChatPageMounted,
      isFolderOperationInProgress,
      isLoadConversations,
      isLoadMoreConversations,
      isSearchMode,
      loadingFolders,
      moveTargetConversationToNewFolder,
      onCancelCreateFolder,
      onChangeActiveFolderName,
      onCreateConversationInFolder,
      onCreateFolder,
      onDeleteFolder,
      onEditFolder,
      onLoadMoreInFolder,
      onPinFolder,
      pinnedFolders,
      renderConversationItem,
      selectedConversationId,
      unpinnedFolders,
      ungroupedConversationsCount,
    ],
  );

  const styles = chatHistoryStyles();

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
        sx={styles.root}
      >
        <ChatHistoryHeader
          isSearchActive={isSearchActive}
          searchQuery={searchQuery}
          onSearchActivate={handleSearchActivate}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
          onCreateFolder={onClickCreateNewFolder}
          onImport={handleOpenImportModal}
        />

        <Box
          ref={listRef}
          sx={styles.list}
          onScroll={handleListScroll}
          data-testid="sidebar-chats-list"
        >
          {isLoadConversations ? (
            Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                animation="wave"
                variant="rectangular"
                sx={styles.loadingSkeleton}
              />
            ))
          ) : (
            <>
              {hasPinnedItems && (
                <PinnedGroup
                  isExpanded={isPinnedExpanded}
                  onToggle={togglePinnedGroup}
                >
                  {renderFoldersSection({ isPinned: true })}
                  <PinnedConversations
                    pinnedConversations={pinnedConversations}
                    renderConversationItem={renderConversationItem}
                  />
                </PinnedGroup>
              )}

              <Box data-tour={CHAT_TOUR_TARGET_IDS.folders}>{renderFoldersSection({ isPinned: false })}</Box>

              <DroppableGroupedArea
                isDropDisabled={isEditingCanvas}
                {...getDropAreaState('ungrouped-conversations')}
              >
                <GroupedConversations
                  dateGroups={dateGroups}
                  renderConversationItem={renderConversationItem}
                  onLoadMoreInGroup={onLoadMoreInGroup}
                  loadingGroups={loadingGroups}
                  totalConversationsAmount={totalConversationsAmount}
                  enableDragAndDrop
                  getDropAreaState={getDropAreaState}
                  selectedConversationId={selectedConversationId}
                  isSearchMode={isSearchMode}
                  searchQuery={debouncedSearchQuery}
                />
              </DroppableGroupedArea>

              {isSearchActive &&
                isSearchMode &&
                !hasPinnedItems &&
                conversations.length === 0 &&
                folders.every(folder => !folder.conversations?.length) && (
                  <Box sx={styles.emptyState}>
                    <Typography
                      variant="bodyMedium"
                      color="text.button.disabled"
                    >
                      No chats found
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      color="text.button.disabled"
                    >
                      Try adjusting your search terms
                    </Typography>
                  </Box>
                )}
            </>
          )}
        </Box>
      </Box>
      {shareChatConversation && (
        <ShareChatModal
          conversation={shareChatConversation}
          onClose={handleCloseShareChat}
          onAccessSaved={onRestrictAccessSuccess}
        />
      )}
      {exportConversation && (
        <ExportConversationModal
          conversation={exportConversation}
          onClose={handleCloseExportModal}
        />
      )}
      {isImportModalOpen && (
        <ImportConversationModal
          onClose={handleCloseImportModal}
          onImported={onImportedConversation}
        />
      )}
    </DndContext>
  );
});

ChatHistory.displayName = 'ChatHistory';

/** @type {MuiSx} */
const chatHistoryStyles = () => ({
  root: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  list: {
    flex: 1,
    minHeight: 0,
    marginTop: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: '0.5rem',
    '& > *': {
      flexShrink: 0,
    },
  },
  loadingSkeleton: {
    marginTop: '0.5rem',
    height: '2.25rem',
    width: '100%',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2rem 1rem',
    textAlign: 'center',
  },
});

// Used inside the memoized move-to menu, so it must not depend on per-render styles
/** @type {MuiSx} */
const chatHistoryMenuStyles = () => ({
  menuItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  menuItemIcon: {
    width: '1rem',
    height: '1rem',
  },
});

export default ChatHistory;
