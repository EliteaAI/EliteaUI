import { useCallback, useEffect, useRef, useState } from 'react';

import { sortConversations } from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { useFoldersListQuery } from '@/api';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSortQueryParamsFromUrl from '@/hooks/useSortQueryParamsFromUrl';

export const useQueryFoldersList = props => {
  const {
    toastError,
    setFolders,
    setDateGroups,
    setPinnedConversations,
    onSelectConversation,
    skipSetConversation,
    searchQuery,
  } = props;
  const projectId = useSelectedProjectId();

  const onSelectConversationRef = useRef(onSelectConversation);
  const setDateGroupsRef = useRef(setDateGroups);
  const setFoldersRef = useRef(setFolders);
  const setPinnedConversationsRef = useRef(setPinnedConversations);

  const [isConversationsLoaded, setIsConversationsLoaded] = useState(false);

  const { checkPermission } = useCheckPermission();

  useEffect(() => {
    onSelectConversationRef.current = onSelectConversation;
  }, [onSelectConversation]);

  useEffect(() => {
    setDateGroupsRef.current = setDateGroups;
  }, [setDateGroups]);

  useEffect(() => {
    setFoldersRef.current = setFolders;
  }, [setFolders]);

  useEffect(() => {
    setPinnedConversationsRef.current = setPinnedConversations;
  }, [setPinnedConversations]);

  const { sort_by: sortBy, sort_order: sortOrder } = useSortQueryParamsFromUrl({
    defaultSortOrder: 'desc',
    defaultSortBy: 'updated_at',
  });

  const {
    data,
    isSuccess,
    isError,
    error,
    isLoading: isLoadFolders,
    isFetching: isLoadMoreFolders,
  } = useFoldersListQuery(
    {
      projectId,
      params: {
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(searchQuery ? { query: searchQuery } : {}),
      },
    },
    { skip: !projectId || !checkPermission(PERMISSIONS.chat.folders.get) },
  );

  const updateDateGroups = useCallback((dateGroupsList, pinnedIds) => {
    const processedGroups = (dateGroupsList || []).map(group => {
      const filtered = pinnedIds?.size
        ? (group.conversations || []).filter(c => !pinnedIds.has(c.id))
        : group.conversations || [];
      return {
        ...group,
        conversations: sortConversations(filtered),
        offset: filtered.length,
      };
    });

    setDateGroupsRef.current?.(processedGroups);
  }, []);

  const updateFolders = useCallback((folderList, pinnedIds) => {
    const folderedConversations =
      (folderList || []).map(folder => {
        const filtered = pinnedIds?.size
          ? (folder?.conversations || []).filter(c => !pinnedIds.has(c.id))
          : folder?.conversations || [];
        return {
          ...folder,
          conversations: sortConversations(filtered),
          offset: filtered.length,
        };
      }) || [];

    setFoldersRef.current?.(prevFolders => {
      const newFolders = (prevFolders || []).filter(folder => folder.isNew);
      const allFolders = [...newFolders, ...folderedConversations];
      return allFolders;
    });
  }, []);

  const updatePinnedConversations = useCallback(
    pinned => {
      const conversations = pinned?.conversations || [];
      if (!searchQuery) {
        setPinnedConversationsRef.current?.(conversations.map(c => ({ ...c, isPinned: true })));
      } else {
        setPinnedConversationsRef.current?.(prevPinnedItems => {
          const matchedPinnedItems = prevPinnedItems.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()),
          );
          const filtered = conversations.filter(c => !prevPinnedItems.find(p => p.id === c.id));
          return [...matchedPinnedItems, ...filtered.map(c => ({ ...c, isPinned: true }))];
        });
      }
    },
    [searchQuery],
  );

  useEffect(() => {
    if (isSuccess && !isLoadFolders) {
      const pinnedIds = new Set((data?.pinned?.conversations || []).map(c => c.id));
      updateDateGroups(data?.date_groups, pinnedIds);
      updateFolders(data?.folders, pinnedIds);
      updatePinnedConversations(data?.pinned);
      setIsConversationsLoaded(true);
    }
  }, [data, isSuccess, isLoadFolders, updateFolders, updateDateGroups, updatePinnedConversations]);

  const selectConversationIfNeeded = useCallback(() => {
    if (skipSetConversation || !data?.selected_conversation_id) return;

    const pinnedConversations = data?.pinned?.conversations || [];
    const dateGroupConversations = data?.date_groups?.flatMap(group => group.conversations) || [];
    const folderConversations = data?.folders?.flatMap(folder => folder.conversations) || [];
    const conversationList = [...pinnedConversations, ...dateGroupConversations, ...folderConversations];

    const selectedConversation =
      conversationList.find(conversation => conversation.id == data?.selected_conversation_id) ||
      conversationList[0];

    if (selectedConversation) onSelectConversationRef?.current(selectedConversation);
  }, [data?.folders, data?.date_groups, data?.pinned, data?.selected_conversation_id, skipSetConversation]);

  useEffect(() => {
    selectConversationIfNeeded();
  }, [selectConversationIfNeeded]);

  const errorGetFolders = useCallback(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
      setDateGroupsRef.current?.([]);
      setFoldersRef.current?.([]);
      setPinnedConversationsRef.current?.([]);
    }
  }, [error, isError, toastError]);

  useEffect(() => {
    errorGetFolders();
  }, [errorGetFolders]);

  return {
    isLoadFolders,
    isLoadMoreFolders,
    totalFolderCount: data?.total_folders || 0,
    isConversationsLoaded,
  };
};
