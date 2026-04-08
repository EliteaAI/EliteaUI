import { useCallback, useEffect, useRef, useState } from 'react';

import { useFoldersListQuery } from '@/api/chat';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSortQueryParamsFromUrl from '@/hooks/useSortQueryParamsFromUrl';

import { getProjectPinnedConversationList, sortConversations } from './usePinConversation';

export default function useQueryFoldersList({
  toastError,
  setFolders,
  setConversations,
  onSelectConversation,
  skipSetConversation,
}) {
  const { checkPermission } = useCheckPermission();
  const onSelectConversationRef = useRef(onSelectConversation);
  useEffect(() => {
    onSelectConversationRef.current = onSelectConversation;
  }, [onSelectConversation]);

  const setConversationsRef = useRef(setConversations);
  useEffect(() => {
    setConversationsRef.current = setConversations;
  }, [setConversations]);

  const setFoldersRef = useRef(setFolders);
  useEffect(() => {
    setFoldersRef.current = setFolders;
  }, [setFolders]);

  const projectId = useSelectedProjectId();
  const { sort_by: sortBy, sort_order: sortOrder } = useSortQueryParamsFromUrl({
    defaultSortOrder: 'desc',
    defaultSortBy: 'created_at',
  });

  //@todo: need to modify this state after resolving an issue with pagination
  // const [page, setPage] = useState(0);
  const [page] = useState(0);

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
      page,
      pageSize: 1000, //@todo: temporary solution to override 20 conversations per page
      // - need to think about pagination for conversations and folders
      // - need to think about pinned conversations in pagination
      params: {
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    },
    { skip: !projectId || !checkPermission(PERMISSIONS.chat.folders.get) },
  );

  //@todo: need to modify this function after resolving an issue with pagination
  const onLoadMoreFolders = useCallback(() => {
    // if (data?.folders?.length && data?.total_folders && data?.folders?.length < data?.total_folders) {
    //   setPage((prev) => prev + 1); // Handle pagination for folders
    // }
    // }, [data?.folders?.length, data?.total_folders]);
  }, []);

  const sortAndPinConversations = useCallback(
    conversations => {
      const pinnedConversationList = getProjectPinnedConversationList(projectId);
      const pinnedConversations = (conversations || []).map(item => {
        return pinnedConversationList.includes(item.id) ? { ...item, isPinned: true } : item;
      });

      return sortConversations(pinnedConversations);
    },
    [projectId],
  );

  const updateUngroupedConversations = useCallback(
    ungroupedList => {
      const sortedUngroupedConversations = sortAndPinConversations(ungroupedList);

      setConversationsRef.current?.(prev => {
        const filteredNewConversation = prev.filter(item => item.isNew);
        return [...filteredNewConversation, ...sortedUngroupedConversations];
      });
    },
    [sortAndPinConversations],
  );

  const updateFolders = useCallback(
    folderList => {
      const folderedConversations =
        (folderList || []).map(folder => ({
          ...folder,
          conversations: sortAndPinConversations(folder?.conversations),
        })) || [];

      setFoldersRef.current?.(prevFolders => {
        const newFolders = (prevFolders || []).filter(folder => folder.isNew);
        const allFolders = [...newFolders, ...folderedConversations];
        return allFolders;
      });
    },
    [sortAndPinConversations],
  );

  useEffect(() => {
    if (isSuccess && !isLoadFolders) {
      updateUngroupedConversations(data?.ungrouped_conversations);
      updateFolders(data?.folders);
    }
  }, [data, isSuccess, isLoadFolders, updateFolders, updateUngroupedConversations]);

  const selectConversationIfNeeded = useCallback(() => {
    const folderConversations = data?.folders?.map(folder => folder.conversations) || [];
    const conversationList = [...(data?.ungrouped_conversations || []), ...folderConversations.flat()];
    const latestSelectedConversation = conversationList.find(
      conversation => conversation.id == data?.selected_conversation_id,
    );
    if (data?.selected_conversation_id && latestSelectedConversation && !skipSetConversation) {
      onSelectConversationRef?.current(latestSelectedConversation);
    }
  }, [data?.folders, data?.ungrouped_conversations, data?.selected_conversation_id, skipSetConversation]);

  useEffect(() => {
    selectConversationIfNeeded();
  }, [selectConversationIfNeeded]);

  const errorGetFolders = useCallback(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
      setConversationsRef.current?.([]);
      setFoldersRef.current?.([]);
    }
  }, [error, isError, toastError]);

  useEffect(() => {
    errorGetFolders();
  }, [setFolders, setConversations, errorGetFolders]);

  return {
    isLoadFolders,
    isLoadMoreFolders,
    onLoadMoreFolders,
    totalFolderCount: data?.total_folders || 0,
  };
}
