import { useCallback, useEffect, useRef, useState } from 'react';

import { CHAT_HISTORY_SORT } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import {
  mergeDateGroupsFirstPage,
  sortConversations,
} from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useFoldersListQuery } from '@/api';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';

export const useLoadChatHistory = props => {
  const { setFolders, setDateGroups, setPinnedConversations, searchQuery, toastError } = props;
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();

  const [isConversationsLoaded, setIsConversationsLoaded] = useState(false);

  // Same project and search: a refetch, merged into what is loaded. Anything else replaces the lists.
  const hydratedKeyRef = useRef(null);

  const prevProjectIdRef = useRef(projectId);
  useEffect(() => {
    if (prevProjectIdRef.current !== projectId) {
      prevProjectIdRef.current = projectId;
      setIsConversationsLoaded(false);
    }
  }, [projectId]);

  const {
    data,
    currentData,
    isSuccess,
    isError,
    error,
    isLoading: isLoadFolders,
    isFetching: isLoadMoreFolders,
  } = useFoldersListQuery(
    {
      projectId,
      params: {
        ...CHAT_HISTORY_SORT,
        ...(searchQuery ? { query: searchQuery } : {}),
      },
    },
    { skip: !projectId || !checkPermission(PERMISSIONS.chat.folders.get) },
  );

  const updateDateGroups = useCallback(
    (dateGroupsList, pinnedIds, folderConversationIds, isRefetch) => {
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

      if (isRefetch)
        setDateGroups(prev =>
          mergeDateGroupsFirstPage(prev, processedGroups, [...pinnedIds, ...folderConversationIds]),
        );
      else setDateGroups(processedGroups);
    },
    [setDateGroups],
  );

  const updateFolders = useCallback(
    (folderList, pinnedIds) => {
      const folderedConversations = (folderList || []).map(folder => {
        const filtered = pinnedIds?.size
          ? (folder?.conversations || []).filter(c => !pinnedIds.has(c.id))
          : folder?.conversations || [];
        return {
          ...folder,
          conversations: sortConversations(filtered),
          offset: filtered.length,
        };
      });

      if (searchQuery) {
        setFolders(folderedConversations);
        return;
      }

      setFolders(prevFolders => {
        const newFolders = (prevFolders || []).filter(folder => folder.isNew);

        const mergedFolders = folderedConversations.map(serverFolder => {
          const localFolder = (prevFolders || []).find(f => f.id === serverFolder.id && !f.isNew);
          if (!localFolder?.conversations?.length) return serverFolder;

          const serverConvIds = new Set((serverFolder.conversations || []).map(c => c.id));
          const localOnly = localFolder.conversations.filter(c => !serverConvIds.has(c.id));
          if (!localOnly.length) return serverFolder;

          return {
            ...serverFolder,
            conversations: sortConversations([...serverFolder.conversations, ...localOnly]),
          };
        });

        return [...newFolders, ...mergedFolders];
      });
    },
    [searchQuery, setFolders],
  );

  const updatePinnedConversations = useCallback(
    pinned => {
      const conversations = pinned?.conversations || [];
      if (!searchQuery) {
        setPinnedConversations(conversations.map(c => ({ ...c, isPinned: true })));
      } else {
        setPinnedConversations(prevPinnedItems => {
          const matchedPinnedItems = prevPinnedItems.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()),
          );
          const filtered = conversations.filter(c => !prevPinnedItems.find(p => p.id === c.id));
          return [...matchedPinnedItems, ...filtered.map(c => ({ ...c, isPinned: true }))];
        });
      }
    },
    [searchQuery, setPinnedConversations],
  );

  // Only the current args' response: while a new search loads, `data` is still the previous one's
  useEffect(() => {
    if (isSuccess && !isLoadFolders && currentData) {
      const key = `${projectId}|${searchQuery ?? ''}`;
      const isRefetch = hydratedKeyRef.current === key;
      hydratedKeyRef.current = key;

      const pinnedIds = new Set((currentData.pinned?.conversations || []).map(c => c.id));
      const folderConversationIds = (currentData.folders || []).flatMap(folder =>
        (folder?.conversations || []).map(c => c.id),
      );
      updateDateGroups(currentData.date_groups, pinnedIds, folderConversationIds, isRefetch);
      updateFolders(currentData.folders, pinnedIds);
      updatePinnedConversations(currentData.pinned);
      setIsConversationsLoaded(true);
    }
    // projectId/searchQuery are read for the key only: a new arg always comes with new data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData, isSuccess, isLoadFolders, updateFolders, updateDateGroups, updatePinnedConversations]);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
      setDateGroups([]);
      setFolders([]);
      setPinnedConversations([]);
    }
  }, [error, isError, setDateGroups, setFolders, setPinnedConversations, toastError]);

  const isSearching = searchQuery && isLoadMoreFolders;

  return {
    isLoadConversations: isLoadFolders || isSearching,
    isLoadMoreConversations: isLoadMoreFolders,
    isConversationsLoaded,
    serverSelectedConversationId: data?.selected_conversation_id,
  };
};
