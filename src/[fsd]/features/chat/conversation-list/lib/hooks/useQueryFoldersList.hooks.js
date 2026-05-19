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

  const updateDateGroups = useCallback(dateGroupsList => {
    const processedGroups = (dateGroupsList || []).map(group => ({
      ...group,
      conversations: sortConversations(group.conversations || []),
      offset: group.conversations?.length || 0,
    }));

    setDateGroupsRef.current?.(processedGroups);
  }, []);

  const updateFolders = useCallback(folderList => {
    const folderedConversations =
      (folderList || []).map(folder => ({
        ...folder,
        conversations: sortConversations(folder?.conversations || []),
        offset: folder.conversations?.length || 0,
      })) || [];

    setFoldersRef.current?.(prevFolders => {
      const newFolders = (prevFolders || []).filter(folder => folder.isNew);
      const allFolders = [...newFolders, ...folderedConversations];
      return allFolders;
    });
  }, []);

  const updatePinnedConversations = useCallback(pinned => {
    const conversations = pinned?.conversations || [];
    setPinnedConversationsRef.current?.(conversations.map(c => ({ ...c, isPinned: true })));
  }, []);

  useEffect(() => {
    if (isSuccess && !isLoadFolders) {
      updateDateGroups(data?.date_groups);
      updateFolders(data?.folders);
      updatePinnedConversations(data?.pinned);
      setIsConversationsLoaded(true);
    }
  }, [data, isSuccess, isLoadFolders, updateFolders, updateDateGroups, updatePinnedConversations]);

  const selectConversationIfNeeded = useCallback(() => {
    const dateGroupConversations = data?.date_groups?.flatMap(group => group.conversations) || [];
    const folderConversations = data?.folders?.flatMap(folder => folder.conversations) || [];
    const pinnedConversations = data?.pinned?.conversations || [];
    const conversationList = [...pinnedConversations, ...dateGroupConversations, ...folderConversations];
    const latestSelectedConversation = conversationList.find(
      conversation => conversation.id == data?.selected_conversation_id,
    );

    if (data?.selected_conversation_id && latestSelectedConversation && !skipSetConversation)
      onSelectConversationRef?.current(latestSelectedConversation);
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
