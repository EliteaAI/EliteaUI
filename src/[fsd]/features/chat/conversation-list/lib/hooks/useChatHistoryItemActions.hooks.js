import { useCallback, useMemo, useRef } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { applyPrivacyToLists } from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import {
  useChatHistoryActions,
  useChatHistoryData,
} from '@/[fsd]/features/chat/conversation-list/lib/hooks/useChatHistory.hooks';
import { useCreateFolder } from '@/[fsd]/features/chat/conversation-list/lib/hooks/useCreateFolder.hooks';
import { useDeleteFolder } from '@/[fsd]/features/chat/conversation-list/lib/hooks/useDeleteFolder.hooks';
import { useMoveToFolderConversation } from '@/[fsd]/features/chat/conversation-list/lib/hooks/useMoveToFolderConversation.hooks';
import { useOpenImportedConversation } from '@/[fsd]/features/chat/conversation-list/lib/hooks/useOpenImportedConversation.hooks';
import { usePinConversation } from '@/[fsd]/features/chat/conversation-list/lib/hooks/usePinConversation.hooks';
import { useEditConversation } from '@/[fsd]/features/chat/lib/hooks';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { DefaultFolderName, dummyConversation, dummyFolder } from '@/common/constants';
import useDeleteConversation from '@/hooks/chat/useDeleteConversation';
import useEditFolder from '@/hooks/chat/useEditFolder';
import useReorderFolders from '@/hooks/chat/useReorderFolders';

const noop = () => {};

// What the chat page registers (useRegisterChatPage); anything it does not register uses the fallback
const CHAT_PAGE_ACTION_NAMES = [
  'onSelectConversation',
  'onEditConversation',
  'onDeleteConversation',
  'onPinConversation',
  'onDuplicateConversation',
  'onPlaybackConversation',
  'onCreateConversation',
  'onCancelCreateConversation',
  'onChangeActiveConversationName',
  'onCreateConversationInFolder',
  'onImportedConversation',
  'onRestrictAccessSuccess',
  'onCreateFolder',
  'onCancelCreateFolder',
];

export const useChatHistoryItemActions = props => {
  const { onOpenConversation, toastError, toastSuccess } = props;
  const projectId = useSelectedProjectId();

  const { dateGroups, folders, activeFolder } = useChatHistoryData();
  const {
    setDateGroups,
    setConversations,
    setPinnedConversations,
    setFolders,
    setActiveFolder,
    chatPageActionsRef,
  } = useChatHistoryActions();

  const conversations = useMemo(() => dateGroups.flatMap(group => group.conversations), [dateGroups]);

  // Away from the chat page no chat is open: the same hooks run against an empty active chat, so a delete
  // never redirects and a rename or pin does not touch a chat on screen
  const { onEditConversation } = useEditConversation({
    activeConversation: dummyConversation,
    setActiveConversation: noop,
    setConversations,
    setPinnedConversations,
    setFolders,
    toastError,
  });

  const { onDeleteConversation } = useDeleteConversation({
    activeConversation: dummyConversation,
    setActiveConversation: noop,
    setConversations,
    setFolders,
    setPinnedConversations,
    toastError,
    toastSuccess,
    emitLeaveRoom: noop,
    stopListenCanvasEditorsChangeEvent: noop,
    stopListenCanvasContentChangeEvent: noop,
    conversations,
    folders,
    onSelectConversation: noop,
  });

  const { onPinConversation } = usePinConversation({
    activeConversation: dummyConversation,
    setActiveConversation: noop,
    setPinnedConversations,
    setDateGroups,
    setFolders,
    projectId,
    toastError,
  });

  const { onImportedConversation } = useOpenImportedConversation({
    setConversations,
    onSelectConversation: onOpenConversation,
  });

  const { onCreateFolder } = useCreateFolder({
    folders,
    setActiveFolder,
    setFolders,
    toastError,
    setActiveParticipant: noop,
  });

  // The chat page's cancel also clears the URL's search params, which would break other pages
  const onCancelCreateFolder = useCallback(
    folder => {
      setActiveFolder(dummyFolder);
      if (folder?.id) setFolders(prev => prev.filter(item => item.id !== folder.id));
      else setFolders(prev => prev.filter(item => !item.isNew));
    },
    [setActiveFolder, setFolders],
  );

  const onRestrictAccessSuccess = useCallback(
    (conversationId, participantChanges = {}) => {
      const { updateConversations, updateFolders } = applyPrivacyToLists({
        conversationId,
        isPrivate: participantChanges.isPrivate ?? true,
      });
      setConversations(updateConversations);
      setPinnedConversations(updateConversations);
      setFolders(updateFolders);
    },
    [setConversations, setFolders, setPinnedConversations],
  );

  const fallbackRef = useRef({});
  fallbackRef.current = {
    onSelectConversation: onOpenConversation,
    onEditConversation,
    onDeleteConversation,
    onPinConversation,
    onImportedConversation,
    onRestrictAccessSuccess,
    onCreateFolder,
    onCancelCreateFolder,
    onCreateConversation: noop,
    onCancelCreateConversation: noop,
    onChangeActiveConversationName: noop,
  };

  const conversationActions = useMemo(
    () =>
      Object.fromEntries(
        CHAT_PAGE_ACTION_NAMES.map(name => [
          name,
          (...args) => {
            const handler = chatPageActionsRef.current?.[name] ?? fallbackRef.current[name];
            return handler?.(...args);
          },
        ]),
      ),
    [chatPageActionsRef],
  );

  // Folders and moves do not depend on the open chat: the menu owns them on every page
  const { onEditFolder, onPinFolder } = useEditFolder({
    activeFolder,
    setActiveFolder,
    setFolders,
    toastError,
  });

  const { onDeleteFolder } = useDeleteFolder({ setFolders, toastError, toastSuccess });

  const { onReorderFolders, isFolderUpdate } = useReorderFolders({
    folders,
    setFolders,
    toastError,
    toastSuccess,
  });

  const {
    onMoveToFolderConversation,
    onMoveToNewFolderConversation,
    moveTargetConversationToNewFolder,
    cancelMovingTargetConversationToNewFolder,
  } = useMoveToFolderConversation({
    setFolders,
    setActiveFolder,
    setConversations,
    toastError,
    toastSuccess,
    conversations,
    folders,
  });

  const onChangeActiveFolderName = useCallback(
    newName => {
      setActiveFolder(prev => ({ ...prev, name: newName }));
    },
    [setActiveFolder],
  );

  const onClickCreateNewFolder = useCallback(() => {
    if (activeFolder?.isNew) return;
    const newFolder = {
      id: uuidv4(),
      name: DefaultFolderName,
      conversations: [],
      isNew: true,
    };
    setActiveFolder({ ...newFolder });
    setFolders(prev => [newFolder, ...prev]);
  }, [activeFolder?.isNew, setActiveFolder, setFolders]);

  return {
    ...conversationActions,
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
  };
};
