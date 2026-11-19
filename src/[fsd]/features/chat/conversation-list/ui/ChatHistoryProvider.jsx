import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EMPTY_CHAT_PAGE_STATE } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import {
  ChatHistoryActionsContext,
  ChatHistoryDataContext,
} from '@/[fsd]/features/chat/conversation-list/lib/context';
import { redistributeConversationsIntoGroups } from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { useDateGroupExpansion, useLoadChatHistory } from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import { useSelectedProjectId, useToastHandlers } from '@/[fsd]/shared/lib/hooks';
import { dummyFolder } from '@/common/constants';

// The chat history lives above the routes: the menu shows it on every page and the chat page edits it
const ChatHistoryProvider = memo(props => {
  const { children } = props;

  const projectId = useSelectedProjectId();
  const { toastError } = useToastHandlers();

  const [dateGroups, setDateGroups] = useState([]);
  const [pinnedConversations, setPinnedConversations] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(dummyFolder);
  const [searchQuery, setSearchQuery] = useState();
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);
  const [chatPageState, setChatPageState] = useState(EMPTY_CHAT_PAGE_STATE);

  const chatPageActionsRef = useRef(null);

  const setConversations = useCallback(updater => {
    setDateGroups(prevGroups => {
      const prevFlat = prevGroups.flatMap(group => group.conversations);
      const newFlat = typeof updater === 'function' ? updater(prevFlat) : updater;
      return redistributeConversationsIntoGroups(prevGroups, newFlat);
    });
  }, []);

  const togglePinnedGroup = useCallback(() => setIsPinnedExpanded(prev => !prev), []);

  // A project switch never shows the previous project's chats, not even while the new ones load
  const prevProjectIdRef = useRef(projectId);
  useEffect(() => {
    if (prevProjectIdRef.current === projectId) return;
    prevProjectIdRef.current = projectId;
    setDateGroups([]);
    setPinnedConversations([]);
    setFolders([]);
    setActiveFolder(dummyFolder);
  }, [projectId]);

  const {
    isLoadConversations,
    isLoadMoreConversations,
    isConversationsLoaded,
    serverSelectedConversationId,
  } = useLoadChatHistory({ setFolders, setDateGroups, setPinnedConversations, searchQuery, toastError });

  const { isGroupExpanded, toggleGroup, initializeExpansion, setSearchModeExpansion, exitSearchMode } =
    useDateGroupExpansion();

  // The date groups' open/closed state outlives the menu's list (the collapsed menu unmounts it)
  const dateGroupExpansion = useMemo(
    () => ({ isGroupExpanded, toggleGroup, initializeExpansion, setSearchModeExpansion, exitSearchMode }),
    [exitSearchMode, initializeExpansion, isGroupExpanded, setSearchModeExpansion, toggleGroup],
  );

  const data = useMemo(
    () => ({
      dateGroups,
      pinnedConversations,
      folders,
      activeFolder,
      searchQuery,
      isLoadConversations,
      isLoadMoreConversations,
      isConversationsLoaded,
      serverSelectedConversationId,
      chatPageState,
      isPinnedExpanded,
      dateGroupExpansion,
    }),
    [
      activeFolder,
      chatPageState,
      dateGroupExpansion,
      dateGroups,
      folders,
      isConversationsLoaded,
      isLoadConversations,
      isLoadMoreConversations,
      isPinnedExpanded,
      pinnedConversations,
      searchQuery,
      serverSelectedConversationId,
    ],
  );

  const actions = useMemo(
    () => ({
      setDateGroups,
      setConversations,
      setPinnedConversations,
      setFolders,
      setActiveFolder,
      setSearchQuery,
      setIsPinnedExpanded,
      togglePinnedGroup,
      setChatPageState,
      chatPageActionsRef,
    }),
    [setConversations, togglePinnedGroup],
  );

  return (
    <ChatHistoryActionsContext.Provider value={actions}>
      <ChatHistoryDataContext.Provider value={data}>{children}</ChatHistoryDataContext.Provider>
    </ChatHistoryActionsContext.Provider>
  );
});

ChatHistoryProvider.displayName = 'ChatHistoryProvider';

export default ChatHistoryProvider;
