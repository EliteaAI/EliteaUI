import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import Split from 'react-split';
import { v4 as uuidv4 } from 'uuid';

import { Box, CircularProgress, Grid, useTheme } from '@mui/material';

import { useEditingArtifactsNavBlocker } from '@/[fsd]/features/artifacts/lib/hooks/useEditingArtifactsNavBlocker.hooks';
import { redistributeConversationsIntoGroups } from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import {
  useCreateFolder,
  useDeleteFolder,
  useDuplicateConversation,
  useMoveToFolderConversation,
  usePinConversation,
  useQueryFoldersList,
} from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import { Conversations } from '@/[fsd]/features/chat/conversation-list/ui';
import {
  useConversationNavigation,
  useEditConversation,
  useInternalToolsConfig,
} from '@/[fsd]/features/chat/lib/hooks';
import { useChatEditors } from '@/[fsd]/features/chat/lib/hooks/useChatEditors.hooks';
import {
  canParticipantBeActiveInChat,
  getChatParticipantUniqueId,
} from '@/[fsd]/features/chat/participants/lib/helpers';
import {
  useActiveParticipantDetails,
  useAddNewParticipants,
} from '@/[fsd]/features/chat/participants/lib/hooks';
import { ParticipantsWrapper } from '@/[fsd]/features/chat/participants/ui';
import { ChatBox } from '@/[fsd]/features/chat/ui';
import { AddNewUserModal } from '@/[fsd]/features/chat/ui/chat-modal';
import { ChatEditorPanel } from '@/[fsd]/features/chat/ui/editors';
import { FIRST_ELITEA_TOUR_ID, useProposePendingTour } from '@/[fsd]/features/interactive-tours';
import { ChunkHelpers } from '@/[fsd]/shared/lib/helpers';
import { eliteaApi } from '@/api/eliteaApi';
import {
  ChatParticipantType,
  DefaultConversationName,
  DefaultFolderName,
  SIDE_BAR_WIDTH,
  SearchParams,
  dummyConversation,
  dummyFolder,
  sioEvents,
} from '@/common/constants';
import { genConversationId, getRawParticipantUniqueId } from '@/common/utils';
import AlertDialog from '@/components/AlertDialog';
import {
  useChatConversationNameUpdateSocket,
  useChatMessageDeleteAllSocket,
  useChatMessageDeleteSocket,
  useChatMessageSyncSocket,
  useChatParticipantDeleteSocket,
  useChatParticipantUpdateSocket,
} from '@/components/Chat/hooks';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import useAttachments from '@/hooks/chat/useAttachments';
import useChangeParticipantSettings from '@/hooks/chat/useChangeParticipantSettings';
import useChatCanvasContentChange from '@/hooks/chat/useChatCanvasContentChange';
import useChatCanvasEditorsChange from '@/hooks/chat/useChatCanvasEditorsChange';
import useChatInteractionUUID from '@/hooks/chat/useChatInteractionUUID';
import useCloseEditorAlert from '@/hooks/chat/useCloseEditorAlert';
import useCreateConversation from '@/hooks/chat/useCreateConversation';
import useDeleteAllMessageFromConversation from '@/hooks/chat/useDeleteAllMessageFromConversation';
import useDeleteConversation from '@/hooks/chat/useDeleteConversation';
import useDeleteMessageFromConversation from '@/hooks/chat/useDeleteMessageFromConversation';
import useDeleteParticipant from '@/hooks/chat/useDeleteParticipant';
import useEditCanvas from '@/hooks/chat/useEditCanvas';
import useEditFolder from '@/hooks/chat/useEditFolder.js';
import useEditingCanvasNavBlocker from '@/hooks/chat/useEditingCanvasNavBlocker';
import useLocalActiveParticipant from '@/hooks/chat/useLocalActiveParticipant';
import usePlaybackConversation from '@/hooks/chat/usePlaybackConversation';
import useRemoteParticipantUpdate from '@/hooks/chat/useRemoteParticipantUpdate';
import useReorderFolders from '@/hooks/chat/useReorderFolders.js';
import useSelectConversation from '@/hooks/chat/useSelectConversation';
import useStreamingNavBlocker from '@/hooks/chat/useStreamingNavBlocker';
import useSynChatMessage from '@/hooks/chat/useSyncChatMessage';
import useUploadAttachments from '@/hooks/chat/useUploadAttachments';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import { useIsCreatingConversation } from '@/hooks/useIsFromSpecificPageHooks';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import useNavBlocker from '@/hooks/useNavBlocker';
import { useManualSocket } from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';
import NewConversationView from '@/pages/NewChat/NewConversationView';
import { actions as chatActions } from '@/slices/chat';
import { actions } from '@/slices/settings';

const PlaybackChatBox = ChunkHelpers.lazyWithRetry(
  () => import('@/[fsd]/features/chat/ui/playback/PlaybackChatBox'),
);

const TAG_TYPE_FOLDERS = 'TAG_TYPE_FOLDERS';

const NewChat = props => {
  const { projectId, preProjectId, setPreProjectId } = props;

  useProposePendingTour(FIRST_ELITEA_TOUR_ID);

  const dispatch = useDispatch();

  const boxRef = useRef();
  const newConversationViewRef = useRef();
  const pipelineEditorRef = useRef();

  const { toastError, toastInfo, toastSuccess } = useToast({ topPosition: '.625rem' });

  const theme = useTheme();

  const [searchParams] = useSearchParams();

  const { isAnyEditorOpen } = useNavBlocker();

  const [activeConversation, setActiveConversation] = useState(dummyConversation);
  const [dateGroups, setDateGroups] = useState([]);
  const [pinnedConversations, setPinnedConversations] = useState([]);

  const conversations = useMemo(() => dateGroups.flatMap(g => g.conversations), [dateGroups]);

  const setConversations = useCallback(updater => {
    setDateGroups(prevGroups => {
      const prevFlat = prevGroups.flatMap(g => g.conversations);
      const newFlat = typeof updater === 'function' ? updater(prevFlat) : updater;
      return redistributeConversationsIntoGroups(prevGroups, newFlat);
    });
  }, []);

  const [collapsedConversations, setCollapsedConversations] = useState(false);

  const [activeFolder, setActiveFolder] = useState(dummyFolder);
  const [folders, setFolders] = useState([]);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState();
  const [conversationNotFound, setConversationNotFound] = useState(false);
  const isPlayback = useMemo(() => activeConversation?.isPlayback, [activeConversation]);
  const isNewConversation = useMemo(
    () =>
      activeConversation?.isNew ||
      (!sidebarSearchQuery &&
        !conversations?.length &&
        folders?.every(folder => !folder.conversations?.length)) ||
      !activeConversation?.name,
    [activeConversation?.isNew, activeConversation?.name, conversations?.length, folders, sidebarSearchQuery],
  );
  const showNewConversationView = useMemo(
    () => !isPlayback && isNewConversation,
    [isNewConversation, isPlayback],
  );
  const showChatBox = useMemo(() => !isPlayback && !isNewConversation, [isNewConversation, isPlayback]);

  const [activeParticipant, setActiveParticipant] = useState();
  const [collapsedParticipants, setCollapsedParticipants] = useState(true);

  const [isStreaming, setIsStreaming] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newConversationQuestion, setNewConversationQuestion] = useState('');

  const { windowWidth } = useGetWindowWidth();
  const { isSmallWindow } = useIsSmallWindow();

  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);

  const leftPanelWidth = useMemo(
    () => (sideBarCollapsed ? 300 : windowWidth > 1700 ? 300 : 380 - SIDE_BAR_WIDTH / 2),
    [sideBarCollapsed, windowWidth],
  );

  const rightPanelWidth = 276;

  const { clearLocalActiveParticipant, getLocalActiveParticipant, setLocalActiveParticipant } =
    useLocalActiveParticipant();

  const ungroupedConversationsCount = useMemo(() => {
    return dateGroups.reduce((sum, g) => sum + (g.total || 0), 0);
  }, [dateGroups]);

  const totalConversationsAmount = useMemo(() => {
    const folderConversationsCount = (Array.isArray(folders) ? folders : []).reduce((acc, folder) => {
      return acc + (folder.total || folder.conversations?.length || 0);
    }, 0);
    return ungroupedConversationsCount + folderConversationsCount;
  }, [ungroupedConversationsCount, folders]);

  const isCreatingConversation = useIsCreatingConversation();

  const { onChangeParticipantSettings } = useChangeParticipantSettings({
    setActiveConversation,
    setConversations,
    activeConversation,
    activeParticipant,
    setActiveParticipant,
    toastError,
  });

  const { activeParticipantDetails, refetchParticipantDetails } = useActiveParticipantDetails({
    activeParticipant,
  });

  const activeVersionName = useMemo(
    () =>
      activeParticipantDetails?.versions?.find(v => v.id === activeParticipant?.entity_settings?.version_id)
        ?.name,
    [activeParticipantDetails?.versions, activeParticipant?.entity_settings?.version_id],
  );

  const { addNewParticipants, addParticipantsToNewConversation } = useAddNewParticipants({
    toastError,
    activeConversation,
    setActiveConversation,
    setConversations,
    newConversationViewRef,
  });

  const playbackChatBoxRef = useRef();

  const { conversationIdFromUrl, clearUrlConversation, changeUrlByConversation } =
    useConversationNavigation();

  const hasAttemptedUrlConversationRef = useRef(false);

  useEffect(() => {
    hasAttemptedUrlConversationRef.current = false;
  }, [conversationIdFromUrl]);

  const interaction_uuid = useChatInteractionUUID(activeConversation?.id);
  const { listenCanvasEditorsChangeEvent, stopListenCanvasEditorsChangeEvent } = useChatCanvasEditorsChange({
    activeConversation,
    setActiveConversation,
    setConversations,
    setFolders,
  });
  const { listenCanvasContentChangeEvent, stopListenCanvasContentChangeEvent } = useChatCanvasContentChange({
    activeConversation,
    setActiveConversation,
    setConversations,
    setFolders,
  });
  const { onDeleteMessage, onRemoteDeleteMessage } = useDeleteMessageFromConversation({
    activeConversation,
    setActiveConversation,
    setConversations,
    setFolders,
    toastError,
    toastSuccess,
  });
  const { onDeleteAllMessages, onRemoteDeleteAllMessages } = useDeleteAllMessageFromConversation({
    activeConversation,
    setActiveConversation,
    setConversations,
    setFolders,
    toastError,
    toastInfo,
    toastSuccess,
  });

  const { emit: emitEnterRoom } = useManualSocket(sioEvents.chat_enter_room);
  const { emit: emitLeaveRoom } = useManualSocket(sioEvents.chat_leave_rooms);

  useChatMessageDeleteSocket({ onRemoteDeleteMessage });
  useChatMessageDeleteAllSocket({ onRemoteDeleteAllMessages });

  const { onDeleteParticipant, onRemoteDeleteParticipant } = useDeleteParticipant({
    setActiveConversation,
    setConversations,
    activeConversation,
    activeParticipant,
    setActiveParticipant,
    toastError,
    newConversationViewRef,
  });

  useChatParticipantDeleteSocket({ onRemoteDeleteParticipant });

  const { onRemoteUpdateParticipant } = useRemoteParticipantUpdate({
    setActiveConversation,
    setConversations,
    activeConversation,
    activeParticipant,
    setActiveParticipant,
  });

  useChatParticipantUpdateSocket({ onRemoteUpdateParticipant });

  const onRemoteUpdateConversationName = useCallback(
    data => {
      if (activeConversation?.uuid === data.conversation_uuid) {
        changeUrlByConversation(data.conversation_id, data.name);
        setActiveConversation(prev => ({ ...prev, name: data.name, isNamingPending: false }));
      }
      setConversations(prev =>
        prev.map(conversation =>
          conversation.uuid === data.conversation_uuid
            ? { ...conversation, name: data.name, isNamingPending: false }
            : conversation,
        ),
      );
      setFolders(prev =>
        prev.map(folder => ({
          ...folder,
          conversations: folder.conversations?.map(conversation =>
            conversation.uuid === data.conversation_uuid
              ? { ...conversation, name: data.name, isNamingPending: false }
              : conversation,
          ),
        })),
      );
      dispatch(eliteaApi.util.invalidateTags([TAG_TYPE_FOLDERS]));
    },
    [activeConversation?.uuid, changeUrlByConversation, dispatch, setConversations],
  );

  useChatConversationNameUpdateSocket({ onRemoteUpdateConversationName });

  const { onPinConversation } = usePinConversation({
    activeConversation,
    setActiveConversation,
    setPinnedConversations,
    setDateGroups,
    setFolders,
    projectId,
    toastError,
  });

  const onClearActiveParticipant = useCallback(
    restorePrevActiveParticipant => {
      setActiveParticipant(undefined);
      if (restorePrevActiveParticipant) {
        const localActiveParticipant = getLocalActiveParticipant(activeConversation.id);
        const foundParticipant = activeConversation.participants.find(
          item => getChatParticipantUniqueId(item) == localActiveParticipant.participantId,
        );
        if (foundParticipant) {
          setActiveParticipant(foundParticipant);
          return;
        }
        setActiveParticipant(undefined);
        clearLocalActiveParticipant(activeConversation?.id);
        return;
      }
      clearLocalActiveParticipant(activeConversation?.id);
    },
    [
      activeConversation.id,
      activeConversation.participants,
      clearLocalActiveParticipant,
      getLocalActiveParticipant,
    ],
  );

  const setChatHistory = useCallback(chat_history => {
    if (typeof chat_history === 'function') {
      setActiveConversation(prev => ({ ...prev, chat_history: chat_history(prev?.chat_history || []) }));
    } else {
      setActiveConversation(prev => ({ ...prev, chat_history }));
    }
  }, []);

  const { onCreateConversation, onCancelCreateConversation } = useCreateConversation({
    activeConversation,
    conversations,
    setActiveConversation,
    setConversations,
    setFolders,
    emitEnterRoom,
    emitLeaveRoom,
    toastError,
    setActiveParticipant,
    listenCanvasEditorsChangeEvent,
    stopListenCanvasEditorsChangeEvent,
    listenCanvasContentChangeEvent,
    stopListenCanvasContentChangeEvent,
  });

  const { onCreateFolder, onCancelCreateFolder } = useCreateFolder({
    folders,
    setActiveFolder,
    setFolders,
    toastError,
    setActiveParticipant,
  });

  const { onDuplicateConversation, duplicatingConversationId } = useDuplicateConversation({
    setActiveConversation,
    setConversations,
    emitEnterRoom,
    emitLeaveRoom,
    activeConversation,
    listenCanvasEditorsChangeEvent,
    stopListenCanvasEditorsChangeEvent,
    listenCanvasContentChangeEvent,
    stopListenCanvasContentChangeEvent,
  });

  const doAddNewUsers = useCallback(
    participants => {
      setShowAddUserModal(false);
      addNewParticipants(participants);
    },
    [addNewParticipants],
  );

  const onAddNewUsers = useCallback(() => {
    setShowAddUserModal(true);
  }, []);

  const { onSelectConversation, isLoadingConversation, isSelectingConversation } = useSelectConversation({
    activeConversation,
    emitEnterRoom,
    toastError,
    emitLeaveRoom,
    getLocalActiveParticipant,
    setActiveParticipant,
    setConversations,
    playbackChatBoxRef,
    setActiveConversation,
    listenCanvasEditorsChangeEvent,
    stopListenCanvasEditorsChangeEvent,
    listenCanvasContentChangeEvent,
    stopListenCanvasContentChangeEvent,
    enableMessagesPagination: true,
  });

  const handleNotFoundAcknowledge = useCallback(() => {
    setConversationNotFound(false);
    clearUrlConversation();
    const pinnedList = pinnedConversations || [];
    const dateGroupList = dateGroups?.flatMap(g => g.conversations) || [];
    const folderList = folders?.flatMap(f => f.conversations) || [];
    const firstAvailable = [...pinnedList, ...dateGroupList, ...folderList][0];
    if (firstAvailable) onSelectConversation(firstAvailable);
  }, [clearUrlConversation, pinnedConversations, dateGroups, folders, onSelectConversation]);

  const {
    isLoadFolders: isLoadConversations,
    isLoadMoreFolders: isLoadMoreConversations,
    isConversationsLoaded,
  } = useQueryFoldersList({
    toastError,
    setFolders,
    setDateGroups,
    setPinnedConversations,
    onSelectConversation,
    searchQuery: sidebarSearchQuery,
    skipSetConversation:
      isCreatingConversation ||
      activeConversation?.isNew ||
      activeConversation?.id ||
      Boolean(conversationIdFromUrl) ||
      Boolean(searchParams.get(SearchParams.SharedChat)),
  });

  const {
    onCloseCanvasEditor,
    selectedCodeBlockInfo,
    setSelectedCodeBlockInfo,
    sizes,
    onDragEnd,
    gutterStyle,
    onShowCanvasEditor,
    canvasEditorRef,
  } = useEditCanvas({
    setCollapsedParticipants,
    setCollapsedConversations,
    setChatHistory,
  });

  const {
    setArtifactEditingBlockNav,
    previewingArtifact,
    setPreviewingArtifact,
    isEditingArtifact,
    artifactGutterStyles,
  } = useEditingArtifactsNavBlocker();

  const onShowArtifactEditor = useCallback(
    artifactData => {
      setPreviewingArtifact(artifactData);
      setArtifactEditingBlockNav(true);
    },
    [setArtifactEditingBlockNav, setPreviewingArtifact],
  );

  const onCloseArtifactEditor = useCallback(() => {
    setPreviewingArtifact(null);
    setArtifactEditingBlockNav(false);
  }, [setPreviewingArtifact, setArtifactEditingBlockNav]);

  // All editing concerns extracted into a single hook
  const editors = useChatEditors({
    projectId,
    activeParticipant,
    setActiveParticipant,
    activeParticipantDetails,
    activeConversation,
    onChangeParticipantSettings,
    addNewParticipants,
    onShowCanvasEditor,
    canvasEditorRef,
    onShowArtifactEditor,
    onCloseArtifactEditor,
    refetchParticipantDetails,
    activeVersionName,
    getChatParticipantUniqueId,
    setLocalActiveParticipant,
  });

  const {
    onEditAgent,
    onEditToolkit,
    onEditPipeline,
    onEditSkill,
    onEditProjectContext,
    onEditCanvas,
    onEditArtifact,
    onCreateAgent,
    onCreatePipeline,
    onCreateToolkit,
    handleCloseAgentEditor,
    handleClosePipelineEditor,
    onCloseToolkitEditor,
    onCloseSkillEditor,
    onCloseProjectContextEditor,
    isEditingAgent,
    isEditingToolkit,
    isEditingPipeline,
    isEditingSkill,
    isEditingProjectContext,
    isCreateMode,
    isPipelineCreateMode,
    editingAgent,
    editingToolkit,
    editingPipeline,
    editingSkill,
    pipelineSizes,
    pipelineOnDragEnd,
    pipelineGutterStyle,
    onAgentCreated,
    onPipelineCreated,
    onToolkitCreated,
    handleAgentSaved,
    handleEditorDirtyStateChange,
    handleShowVersionChangeAlert,
    handleAttachmentToolChange,
    handleEditorConversationStartersChange,
    handleConversationLlmOverride,
    openEditingAlert,
    onCloseEditorAlert,
    onConfirmCloseEditor,
    showVersionChangeAlert,
    handleVersionChangeConfirm,
    handleVersionChangeCancel,
    editorIsDirty,
    displayedConversationStarters,
    generatedEditorTabs,
    activeGeneratedTabIndex,
    setActiveGeneratedTabIndex,
    isEditingGeneratedEntities,
    onGeneratedEntityDeleted,
    onGeneratedEntityCreated,
    handleCloseGeneratedTab,
    isEditorOpen,
    isAnyEditorPanelOpen,
  } = editors;

  const { onRemoteChatMessageSync } = useSynChatMessage({
    activeConversation,
    setActiveConversation,
    setConversations,
    setFolders,
    setSelectedCodeBlockInfo,
  });

  useChatMessageSyncSocket({ onRemoteChatMessageSync });

  const onSelectParticipant = useCallback(
    (participant, shouldMentionUser = true) => {
      if (isEditingAgent) return;

      if (participant?.entity_name === ChatParticipantType.Users) {
        const mentionTarget =
          activeConversation?.isNew || !activeConversation?.id
            ? newConversationViewRef.current
            : boxRef.current;
        shouldMentionUser && mentionTarget?.mentionUser?.(`@${participant.meta.user_name} `);
        return;
      } else if (participant === 'All users') {
        const mentionTarget =
          activeConversation?.isNew || !activeConversation?.id
            ? newConversationViewRef.current
            : boxRef.current;
        shouldMentionUser && mentionTarget?.selectEveryoneMention?.();
        return;
      }

      if (!activeConversation?.isNew && activeConversation?.id) {
        setActiveParticipant(participant);
        if (participant) {
          if (participant?.entity_name !== ChatParticipantType.Users) {
            const uniqueId = getChatParticipantUniqueId(participant);
            setLocalActiveParticipant(activeConversation?.id, uniqueId);
          }
        } else {
          clearLocalActiveParticipant(activeConversation?.id);
        }
      } else {
        newConversationViewRef.current?.onSelectParticipant(participant);
      }
    },
    [
      activeConversation?.isNew,
      activeConversation?.id,
      isEditingAgent,
      setLocalActiveParticipant,
      clearLocalActiveParticipant,
    ],
  );

  const onSelectThisParticipant = useCallback(
    selectedParticipant => {
      const foundParticipant = activeConversation?.participants?.find(
        participant =>
          getChatParticipantUniqueId(participant) ===
          (selectedParticipant.entity_name
            ? getChatParticipantUniqueId(selectedParticipant)
            : getRawParticipantUniqueId(selectedParticipant)),
      );

      if (!foundParticipant && activeConversation && !activeConversation?.isNew) {
        addNewParticipants([selectedParticipant], addedParticipants => {
          if (canParticipantBeActiveInChat(addedParticipants[0])) {
            onSelectParticipant(addedParticipants[0], false);
          }
        });
      } else {
        if (canParticipantBeActiveInChat(foundParticipant || selectedParticipant)) {
          onSelectParticipant(foundParticipant, false);
        }
      }
    },
    [activeConversation, addNewParticipants, onSelectParticipant],
  );

  const onCloseCanvas = useCallback(() => {
    canvasEditorRef.current?.save?.();
  }, [canvasEditorRef]);

  const detectedEditorType = useMemo(() => {
    if (selectedCodeBlockInfo) return 'canvas';
    if (isEditingAgent) return 'agent';
    if (isEditingPipeline) return 'pipeline';
    if (isEditingToolkit) return editingToolkit?.meta?.mcp ? 'mcp' : 'toolkit';
    if (isEditingArtifact) return 'artifact';
    return 'canvas';
  }, [
    editingToolkit?.meta?.mcp,
    isEditingAgent,
    isEditingArtifact,
    isEditingPipeline,
    isEditingToolkit,
    selectedCodeBlockInfo,
  ]);

  const isEditorOpenWithCanvas = useMemo(
    () => !!(selectedCodeBlockInfo || isEditorOpen || isEditingArtifact),
    [selectedCodeBlockInfo, isEditorOpen, isEditingArtifact],
  );

  const onCloseEditor = useCallback(() => {
    if (selectedCodeBlockInfo) onCloseCanvasEditor();
    else if (isEditingAgent) handleCloseAgentEditor();
    else if (isEditingPipeline) handleClosePipelineEditor();
    else if (isEditingToolkit) onCloseToolkitEditor();
    else if (isEditingArtifact) onCloseArtifactEditor();
    else if (isEditingSkill) onCloseSkillEditor();
    else if (isEditingProjectContext) onCloseProjectContextEditor();
    else onCloseCanvasEditor();
  }, [
    handleCloseAgentEditor,
    handleClosePipelineEditor,
    isEditingAgent,
    isEditingArtifact,
    isEditingPipeline,
    isEditingToolkit,
    isEditingSkill,
    isEditingProjectContext,
    onCloseArtifactEditor,
    onCloseCanvasEditor,
    onCloseToolkitEditor,
    onCloseSkillEditor,
    onCloseProjectContextEditor,
    selectedCodeBlockInfo,
  ]);

  const {
    openAlert: openEditorAlert,
    alertContent,
    onHandleSelectConversation,
    onCancelOperation,
    onConfirmOperation,
  } = useCloseEditorAlert({
    editorType: detectedEditorType,
    isEditorOpen: isEditorOpenWithCanvas,
    onCloseEditor,
    onSelectParticipant,
    onSelectConversation,
    onSelectThisParticipant,
    isStreaming,
    setIsStreaming,
    boxRef,
  });

  const onStopRun = useCallback(isNode => {
    if (isNode) boxRef.current?.stopAll?.(true);
    else pipelineEditorRef.current?.onStopRun?.(true);
  }, []);
  const onRcvAgentEvent = useCallback(event => {
    pipelineEditorRef.current?.onRcvAgentEvent?.(event);
  }, []);
  const deleteAllRunNodes = useCallback(() => {
    pipelineEditorRef.current?.deleteAllRunNodes?.();
  }, []);

  const isAnyPanelOpen = isAnyEditorOpen || isAnyEditorPanelOpen;
  useEffect(() => {
    if (isAnyPanelOpen) setCollapsedParticipants(isAnyPanelOpen);
    setCollapsedConversations(isAnyPanelOpen);
  }, [isAnyPanelOpen]);

  const [newConversationSelectedManager, setNewConversationSelectedManager] = useState(null);

  const {
    attachments,
    selectedManager,
    isSettingManager,
    disableAttachments,
    onAttachFiles,
    onDeleteAttachment,
    onSelectAttachmentManager,
    onClearAttachments,
  } = useAttachments({
    activeConversation,
    setActiveConversation,
    activeParticipant,
    activeParticipantDetails,
  });

  const { onInternalToolsConfigChange, isUpdatingInternalToolsConfig } = useInternalToolsConfig({
    activeConversation,
    setActiveConversation,
  });

  const stableCallbacks = useMemo(
    () => ({
      onChangeParticipantSettings,
      onClearActiveParticipant,
      onSelectThisParticipant,
      setChatHistory,
      setIsStreaming,
      onDeleteMessage,
      onDeleteAllMessages,
      onCreateFolder,
      onStopRun,
      onRcvAgentEvent,
      deleteAllRunNodes,
      onAttachFiles,
      onDeleteAttachment,
      onSelectAttachmentManager,
      onClearAttachments,
      setActiveConversation,
      onInternalToolsConfigChange,
      onAddNewUsers,
      onCreateAgent,
      onCreatePipeline,
      onCreateToolkit,
      onDeleteParticipant,
    }),
    [
      onChangeParticipantSettings,
      onClearActiveParticipant,
      onSelectThisParticipant,
      setChatHistory,
      setIsStreaming,
      onDeleteMessage,
      onDeleteAllMessages,
      onCreateFolder,
      onStopRun,
      onRcvAgentEvent,
      deleteAllRunNodes,
      onAttachFiles,
      onDeleteAttachment,
      onSelectAttachmentManager,
      onClearAttachments,
      onInternalToolsConfigChange,
      onAddNewUsers,
      onCreateAgent,
      onCreatePipeline,
      onCreateToolkit,
      onDeleteParticipant,
    ],
  );

  const {
    uploadAttachments,
    isUploading: isUploadingAttachments,
    uploadingAttachments,
    uploadProgress,
  } = useUploadAttachments();

  const baseSettings = useMemo(
    () => ({
      activeParticipant,
      activeConversation,
      isLoadingConversation,
      conversationStarters: displayedConversationStarters,
      interaction_uuid,
      attachments:
        isUploadingAttachments && !attachments?.length && uploadingAttachments.length
          ? uploadingAttachments
          : attachments,
      isSettingManager,
      selectedManager,
      disableAttachments,
      isUpdatingInternalToolsConfig,
      existingToolkitIds: activeConversation?.participants
        ?.filter(p => p.entity_name === ChatParticipantType.Toolkits)
        .map(p => p.entity_meta?.id),
      activeParticipantDetails,
      onRefreshParticipantDetails: refetchParticipantDetails,
      onOpenArtifactPreview: onEditArtifact,
      ...stableCallbacks,
    }),
    [
      activeParticipant,
      activeConversation,
      isLoadingConversation,
      displayedConversationStarters,
      interaction_uuid,
      isUploadingAttachments,
      attachments,
      uploadingAttachments,
      isSettingManager,
      selectedManager,
      disableAttachments,
      isUpdatingInternalToolsConfig,
      activeParticipantDetails,
      refetchParticipantDetails,
      stableCallbacks,
      onEditArtifact,
    ],
  );

  useEffect(() => {
    if (!conversationIdFromUrl) {
      setConversationNotFound(false);
      return;
    }
    if (isSelectingConversation || activeConversation?.id) return;

    if (isConversationsLoaded) {
      const folderConversations = folders?.map(folder => folder.conversations) || [];
      const conversationList = [...conversations, ...folderConversations.flat()];
      const conversationFromUrl = conversationList.find(
        conversation => conversation.id == conversationIdFromUrl,
      );
      if (conversationFromUrl) {
        setConversationNotFound(false);
        onSelectConversation(conversationFromUrl);
        return;
      }
      if (hasAttemptedUrlConversationRef.current) {
        setConversationNotFound(true);
        return;
      }
    }

    if (!hasAttemptedUrlConversationRef.current) {
      const numericId = parseInt(conversationIdFromUrl, 10);
      if (!isNaN(numericId)) {
        hasAttemptedUrlConversationRef.current = true;
        onSelectConversation({ id: numericId });
      } else {
        setConversationNotFound(true);
      }
    }
  }, [
    activeConversation?.id,
    conversationIdFromUrl,
    conversations,
    folders,
    isConversationsLoaded,
    isSelectingConversation,
    onSelectConversation,
  ]);

  const shouldShowConversationLoader = useMemo(() => {
    if (isSelectingConversation) return true;
    if (sidebarSearchQuery) return false;
    if (isLoadMoreConversations) return true;
    if (!conversations?.length && !isConversationsLoaded) return true;
    if (conversations?.length && isConversationsLoaded && !activeConversation?.name) return true;
    return false;
  }, [
    isLoadMoreConversations,
    isSelectingConversation,
    conversations?.length,
    isConversationsLoaded,
    activeConversation?.name,
    sidebarSearchQuery,
  ]);

  const messageIdFromUrl = searchParams.get(SearchParams.MessageId);

  useEffect(() => {
    if (messageIdFromUrl && activeConversation?.id) {
      dispatch(chatActions.setMessageIdToView({ messageIdToView: messageIdFromUrl }));
    }
  }, [activeConversation?.id, dispatch, messageIdFromUrl]);

  const onParticipantsCollapsed = useCallback(() => {
    setCollapsedParticipants(prev => !prev);
  }, []);

  const onConversationCollapsed = useCallback(() => {
    setCollapsedConversations(prev => !prev);
  }, []);

  const { onEditConversation } = useEditConversation({
    activeConversation,
    setActiveConversation,
    setConversations,
    setFolders,
    toastError,
  });

  const { onEditFolder, onPinFolder } = useEditFolder({
    activeFolder,
    setActiveFolder,
    setFolders,
    toastError,
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

  const { onReorderFolders, isFolderUpdate } = useReorderFolders({
    folders,
    setFolders,
    toastError,
    toastSuccess,
  });

  const { onDeleteConversation } = useDeleteConversation({
    activeConversation,
    setActiveConversation,
    setConversations,
    setFolders,
    toastError,
    toastSuccess,
    emitLeaveRoom,
    stopListenCanvasEditorsChangeEvent,
    stopListenCanvasContentChangeEvent,
    conversations,
    folders,
    onSelectConversation,
  });

  const { onDeleteFolder } = useDeleteFolder({
    setFolders,
    toastError,
    toastSuccess,
  });

  const { onPlaybackConversation } = usePlaybackConversation({
    setActiveConversation,
    setConversations,
    setFolders,
    toastError,
    playbackChatBoxRef,
    activeConversation,
  });

  const onChangeActiveConversationName = useCallback(newName => {
    setActiveConversation(prev => ({ ...prev, name: newName }));
  }, []);

  const onChangeActiveFolderName = useCallback(newName => {
    setActiveFolder(prev => ({ ...prev, name: newName }));
  }, []);

  const onClickCreateNewFolder = useCallback(() => {
    if (!isStreaming && !activeFolder?.isNew) {
      const newFolder = {
        id: uuidv4(),
        name: DefaultFolderName,
        conversations: [],
        isNew: true,
      };
      setActiveFolder({ ...newFolder });
      setFolders(prev => [newFolder, ...prev]);
    }
  }, [isStreaming, activeFolder?.isNew]);

  const startNewConversation = useCallback(
    (folderId = null) => {
      if (activeConversation?.id && activeConversation?.uuid) {
        stopListenCanvasEditorsChangeEvent();
        stopListenCanvasContentChangeEvent();
        emitLeaveRoom({
          conversation_id: activeConversation.id,
          conversation_uuid: activeConversation.uuid,
          project_id: projectId,
        });
      }
      dispatch(chatActions.setIsCreatingNewConversation(true));
      clearUrlConversation();
      const newConversation = {
        id: uuidv4(),
        name: DefaultConversationName,
        is_private: true,
        participants: [],
        chat_history: [],
        isNew: true,
        ...(folderId && { folder_id: folderId }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isNamingPending: false,
      };
      setActiveConversation(newConversation);
      setActiveParticipant();
      handleCloseAgentEditor();
      onCloseToolkitEditor();
      handleClosePipelineEditor();
      setSelectedCodeBlockInfo();
      onCloseArtifactEditor();
      onCloseSkillEditor();
      onCloseProjectContextEditor();
    },
    [
      activeConversation?.id,
      activeConversation?.uuid,
      dispatch,
      clearUrlConversation,
      projectId,
      setActiveConversation,
      setActiveParticipant,
      handleCloseAgentEditor,
      onCloseToolkitEditor,
      handleClosePipelineEditor,
      setSelectedCodeBlockInfo,
      onCloseArtifactEditor,
      onCloseSkillEditor,
      onCloseProjectContextEditor,
      emitLeaveRoom,
      stopListenCanvasEditorsChangeEvent,
      stopListenCanvasContentChangeEvent,
    ],
  );

  const onCreateConversationInFolder = useCallback(
    folder => {
      if (isStreaming || folder?.isNew) return;
      startNewConversation(folder.id);
    },
    [isStreaming, startNewConversation],
  );

  useEffect(() => {
    if (isCreatingConversation && !activeConversation?.isNew) {
      if (isStreaming) boxRef.current?.stopAll?.();
      const parentFolder = activeConversation?.folder_id
        ? folders.find(f => f.id === activeConversation.folder_id)
        : null;
      startNewConversation(parentFolder?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreatingConversation, activeConversation?.isNew]);

  useEffect(() => {
    if (preProjectId !== projectId) {
      clearUrlConversation();
      setActiveConversation(dummyConversation);
      setPreProjectId(projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preProjectId, projectId]);

  useStreamingNavBlocker(isStreaming);
  useEditingCanvasNavBlocker(!!selectedCodeBlockInfo);

  useEffect(() => {
    return () => {
      dispatch(chatActions.setIsCreatingNewConversation(false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLeaveCurrentRoom = useCallback(() => {
    if (activeConversation.uuid) {
      emitLeaveRoom({
        conversation_id: activeConversation.id,
        conversation_uuid: activeConversation.uuid,
        project_id: projectId,
      });
    }
  }, [activeConversation.id, activeConversation.uuid, emitLeaveRoom, projectId]);

  const doLeaveCurrentRoomRef = useRef(doLeaveCurrentRoom);

  useEffect(() => {
    doLeaveCurrentRoomRef.current = doLeaveCurrentRoom;
  }, [doLeaveCurrentRoom]);

  useEffect(() => {
    const boxRefValue = boxRef.current;
    return () => {
      boxRefValue?.stopAll?.();
      doLeaveCurrentRoomRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (isAnyPanelOpen) {
      dispatch(actions.setSideBarCollapsed(true));
    }
  }, [dispatch, isAnyPanelOpen]);

  const showResizeGutter = !!(selectedCodeBlockInfo || isEditingPipeline || isEditingArtifact);

  const styles = chatStyles({
    theme,
    isSmallWindow,
    collapsedConversations,
    collapsedParticipants,
    leftPanelWidth,
    rightPanelWidth,
    showResizeGutter,
    isAnyEditorOpen: isAnyPanelOpen,
  });

  const onEditParticipant = useCallback(
    participant => {
      if (!participant) return;
      const { entity_name } = participant;
      if (entity_name === ChatParticipantType.Toolkits) {
        onEditToolkit(participant);
      } else if (
        entity_name === ChatParticipantType.Pipelines ||
        (entity_name === ChatParticipantType.Applications &&
          (participant.entity_settings?.agent_type === 'pipeline' || participant.agent_type === 'pipeline'))
      ) {
        onEditPipeline(participant);
      } else if (entity_name === ChatParticipantType.Applications) {
        onEditAgent(participant);
      }
    },
    [onEditToolkit, onEditAgent, onEditPipeline],
  );

  const renderRightPanel = useCallback(
    smallWindow => {
      const participantsCommonProps = {
        collapsed: collapsedParticipants,
        rightPanelWidth,
        activeConversation,
        editingToolkit,
        onParticipantsCollapsed,
        activeParticipant,
        onDeleteParticipant,
        onSelectParticipant,
        onChangeParticipantSettings,
        onEditParticipant,
        setActiveConversation,
        selectedManager,
        newConversationSelectedManager,
      };
      return smallWindow ? <ParticipantsWrapper {...participantsCommonProps} /> : null;
    },
    [
      activeConversation,
      collapsedParticipants,
      editingToolkit,
      rightPanelWidth,
      selectedManager,
      newConversationSelectedManager,
      onParticipantsCollapsed,
      activeParticipant,
      onDeleteParticipant,
      onSelectParticipant,
      onChangeParticipantSettings,
      onEditParticipant,
    ],
  );

  return (
    <>
      <Grid
        container
        sx={styles.container}
      >
        <Grid
          size={{ xs: 12, lg: collapsedConversations ? 0.5 : 3 }}
          sx={styles.wrapper}
        >
          <Conversations
            isLoadConversations={isLoadConversations}
            isLoadMoreConversations={isLoadMoreConversations}
            selectedConversationId={genConversationId(activeConversation)}
            conversations={conversations}
            pinnedConversations={pinnedConversations}
            dateGroups={dateGroups}
            setDateGroups={setDateGroups}
            ungroupedConversationsCount={ungroupedConversationsCount}
            totalConversationsAmount={totalConversationsAmount}
            onSelectConversation={onHandleSelectConversation}
            onEditConversation={onEditConversation}
            onDeleteConversation={onDeleteConversation}
            onDuplicateConversation={onDuplicateConversation}
            duplicatingConversationId={duplicatingConversationId}
            onPlaybackConversation={onPlaybackConversation}
            collapsed={collapsedConversations}
            onCollapsed={onConversationCollapsed}
            onLoadMore={() => {}}
            onPinConversation={onPinConversation}
            onCreateConversation={onCreateConversation}
            onCancelCreateConversation={onCancelCreateConversation}
            onChangeActiveConversationName={onChangeActiveConversationName}
            folders={folders}
            setFolders={setFolders}
            onCreateFolder={onCreateFolder}
            onCancelCreateFolder={onCancelCreateFolder}
            onDeleteFolder={onDeleteFolder}
            onChangeActiveFolderName={onChangeActiveFolderName}
            onEditFolder={onEditFolder}
            onPinFolder={onPinFolder}
            onMoveToFolderConversation={onMoveToFolderConversation}
            onMoveToNewFolderConversation={onMoveToNewFolderConversation}
            moveTargetConversationToNewFolder={moveTargetConversationToNewFolder}
            cancelMovingTargetConversationToNewFolder={cancelMovingTargetConversationToNewFolder}
            onClickCreateNewFolder={onClickCreateNewFolder}
            onCreateConversationInFolder={onCreateConversationInFolder}
            onCloseCanvas={onCloseCanvas}
            toastSuccess={toastSuccess}
            toastError={toastError}
            onSearchQueryChange={setSidebarSearchQuery}
            onReorderFolders={onReorderFolders}
            isFolderOperationInProgress={isFolderUpdate || isLoadConversations || isLoadMoreConversations}
          />
        </Grid>

        {renderRightPanel(isSmallWindow)}

        <Grid
          size={{ xs: 12 }}
          sx={styles.conversationWrapper}
        >
          <Split
            direction={isSmallWindow ? 'vertical' : 'horizontal'}
            style={styles.splitWrapper}
            sizes={(() => {
              if (isEditingPipeline) return pipelineSizes;
              if (selectedCodeBlockInfo?.codeBlock) return sizes;
              if (isAnyPanelOpen) return [50, 50];
              return sizes;
            })()}
            minSize={28}
            expandToMin={false}
            gutterSize={showResizeGutter ? 10 : 0}
            gutterAlign="center"
            snapOffset={30}
            dragInterval={1}
            onDragEnd={isEditingPipeline ? pipelineOnDragEnd : onDragEnd}
            gutterStyle={
              isEditingArtifact ? artifactGutterStyles : isEditingPipeline ? pipelineGutterStyle : gutterStyle
            }
          >
            <Box sx={styles.splitChatWrapper}>
              <NewConversationView
                key={showNewConversationView}
                hidden={!showNewConversationView}
                addNewParticipants={addParticipantsToNewConversation}
                addToolkitAsAgentAttachament={addNewParticipants}
                setNewConversationSelectedManager={setNewConversationSelectedManager}
                onCreateConversation={onCreateConversation}
                activeConversation={activeConversation}
                setActiveConversation={setActiveConversation}
                activeParticipant={activeParticipant}
                activeParticipantDetails={activeParticipantDetails}
                setActiveParticipant={setActiveParticipant}
                setChatHistory={setChatHistory}
                interaction_uuid={interaction_uuid}
                onShowAgentEditor={onEditAgent}
                onShowPipelineEditor={onEditPipeline}
                onCloseAgentEditor={handleCloseAgentEditor}
                onCreateAgent={onCreateAgent}
                onCreatePipeline={onCreatePipeline}
                onCreateToolkit={onCreateToolkit}
                onAddNewUsers={onAddNewUsers}
                ref={newConversationViewRef}
                uploadAttachments={uploadAttachments}
                isUploadingAttachments={isUploadingAttachments}
                uploadProgress={uploadProgress}
                setNewConversationQuestion={setNewConversationQuestion}
              />
              <ChatBox
                fromTheChat
                hidden={!showChatBox}
                key={'chatBox' + showChatBox}
                ref={boxRef}
                onEditCanvas={onEditCanvas}
                selectedCodeBlockInfo={selectedCodeBlockInfo}
                onShowAgentEditor={onEditAgent}
                onShowPipelineEditor={onEditPipeline}
                onShowSkillEditor={onEditSkill}
                onShowProjectContextEditor={onEditProjectContext}
                onShowToolkitEditor={onEditToolkit}
                onCloseAgentEditor={handleCloseAgentEditor}
                onClosePipelineEditor={handleClosePipelineEditor}
                isEditorDirty={editorIsDirty}
                onShowVersionChangeAlert={handleShowVersionChangeAlert}
                inputPlaceholder="Type your message..."
                uploadAttachments={uploadAttachments}
                isUploadingAttachments={isUploadingAttachments}
                uploadProgress={uploadProgress}
                newConversationQuestion={newConversationQuestion}
                onEntityCreated={onGeneratedEntityCreated}
                onEntityDeleted={onGeneratedEntityDeleted}
                {...baseSettings}
              />
              {isPlayback && (
                <Suspense
                  fallback={
                    <Box sx={styles.loadingContainer}>
                      <CircularProgress />
                    </Box>
                  }
                >
                  <PlaybackChatBox
                    hidden={!isPlayback}
                    ref={playbackChatBoxRef}
                    conversation={activeConversation}
                    toastError={toastError}
                    key={'playback' + isPlayback}
                  />
                </Suspense>
              )}
              {shouldShowConversationLoader && (
                <Box sx={styles.loadingContainer}>
                  <Box sx={styles.loadingInnerContainer}>
                    <CircularProgress />
                  </Box>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                ...styles.splitChatWrapper,
                display: isAnyPanelOpen ? 'block' : 'none',
                position: 'relative',
                paddingLeft: isAnyPanelOpen && !showResizeGutter ? '10px' : undefined,
              }}
            >
              <ChatEditorPanel
                // Agent
                isEditingAgent={isEditingAgent}
                editingAgent={editingAgent}
                isCreateMode={isCreateMode}
                onCloseAgentEditor={handleCloseAgentEditor}
                onAgentCreated={onAgentCreated}
                handleAgentSaved={handleAgentSaved}
                handleAttachmentToolChange={handleAttachmentToolChange}
                handleEditorDirtyStateChange={handleEditorDirtyStateChange}
                handleEditorConversationStartersChange={handleEditorConversationStartersChange}
                handleConversationLlmOverride={handleConversationLlmOverride}
                activeVersionName={activeVersionName}
                activeParticipant={activeParticipant}
                // Toolkit
                isEditingToolkit={isEditingToolkit}
                editingToolkit={editingToolkit}
                onCloseToolkitEditor={onCloseToolkitEditor}
                onToolkitCreated={onToolkitCreated}
                onChangeParticipantSettings={onChangeParticipantSettings}
                // Pipeline
                isEditingPipeline={isEditingPipeline}
                editingPipeline={editingPipeline}
                isPipelineCreateMode={isPipelineCreateMode}
                pipelineEditorRef={pipelineEditorRef}
                handleClosePipelineEditor={handleClosePipelineEditor}
                onPipelineCreated={onPipelineCreated}
                onStopRun={onStopRun}
                // Canvas
                selectedCodeBlockInfo={selectedCodeBlockInfo}
                canvasEditorRef={canvasEditorRef}
                onCloseCanvasEditor={onCloseCanvasEditor}
                interaction_uuid={interaction_uuid}
                conversation_uuid={activeConversation.uuid}
                // Artifact
                previewingArtifact={previewingArtifact}
                projectId={projectId}
                onCloseArtifactEditor={onCloseArtifactEditor}
                // Skill
                isEditingSkill={isEditingSkill}
                editingSkill={editingSkill}
                onCloseSkillEditor={onCloseSkillEditor}
                // Project context
                isEditingProjectContext={isEditingProjectContext}
                onCloseProjectContextEditor={onCloseProjectContextEditor}
                // Generated entities
                isEditingGeneratedEntities={isEditingGeneratedEntities}
                generatedEditorTabs={generatedEditorTabs}
                activeGeneratedTabIndex={activeGeneratedTabIndex}
                onTabChange={setActiveGeneratedTabIndex}
                onCloseTab={handleCloseGeneratedTab}
                // Alerts
                openEditingAlert={openEditingAlert}
                onCloseEditorAlert={onCloseEditorAlert}
                onConfirmCloseEditor={onConfirmCloseEditor}
                showVersionChangeAlert={showVersionChangeAlert}
                handleVersionChangeConfirm={handleVersionChangeConfirm}
                handleVersionChangeCancel={handleVersionChangeCancel}
                openEditorAlert={openEditorAlert}
                alertContent={alertContent}
                onCancelOperation={onCancelOperation}
                onConfirmOperation={onConfirmOperation}
              />
            </Box>
          </Split>
        </Grid>

        {renderRightPanel(!isSmallWindow)}
      </Grid>

      <AddNewUserModal
        open={showAddUserModal}
        onAdd={doAddNewUsers}
        onCancel={() => setShowAddUserModal(false)}
        participants={activeConversation?.participants || []}
      />
      <AlertDialog
        open={conversationNotFound}
        title={
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: '.25rem',
            }}
          >
            <AttentionIcon
              width={16}
              height={16}
              fill={theme.palette.status.onModeration}
            />
            Conversation not found
          </Box>
        }
        alertContent="The conversation you are looking for does not exist in your project or you don't have access to it. For sharing links, please use the Share option in the conversation menu."
        confirmButtonText="Got it"
        cancelButtonText=""
        onClose={handleNotFoundAcknowledge}
        onConfirm={handleNotFoundAcknowledge}
      />
    </>
  );
};

const chatStyles = ({
  theme,
  isSmallWindow,
  collapsedConversations,
  collapsedParticipants,
  leftPanelWidth,
  rightPanelWidth,
  showResizeGutter,
  isAnyEditorOpen,
}) => {
  const COLLAPSED_LEFT = 60;
  const COLLAPSED_RIGHT = 80;

  const getChatWidthLG = () => {
    const left = collapsedConversations ? COLLAPSED_LEFT : leftPanelWidth;
    const right = collapsedParticipants ? COLLAPSED_RIGHT : rightPanelWidth;
    return `calc(100% - ${left + right}px) !important`;
  };

  const getChatWidthSM = () => {
    const right = collapsedParticipants ? COLLAPSED_RIGHT : rightPanelWidth;
    if (collapsedConversations) {
      return `calc(100% - ${COLLAPSED_LEFT + right}px) !important`;
    }
    return `calc(75% - ${right}px) !important`;
  };

  return {
    container: {
      padding: isSmallWindow ? '1rem 1.5rem' : '1rem 0rem 1rem 1.5rem',
      boxSizing: 'border-box',
      height: '100vh',
      marginLeft: 0,
      background: theme.palette.background.tabPanel,
      width: '100%',
    },
    wrapper: {
      height: isSmallWindow ? 'auto' : '100%',
      marginBottom: isSmallWindow ? '16px' : undefined,
      boxSizing: 'border-box',
      paddingRight: {
        lg: '24px',
      },
      [theme.breakpoints.up('prompt_list_lg')]: {
        maxWidth: collapsedConversations ? '60px !important' : `${leftPanelWidth}px !important`,
        minWidth: collapsedConversations ? '60px !important' : `${leftPanelWidth}px !important`,
      },
      [theme.breakpoints.down('prompt_list_lg')]: {
        maxWidth: collapsedConversations ? '60px !important' : '25% !important',
        minWidth: collapsedConversations ? '60px !important' : '25% !important',
      },
      [theme.breakpoints.down('lg')]: {
        maxWidth: '100% !important',
        minWidth: '100% !important',
      },
    },
    conversationWrapper: {
      height: '100%',
      minHeight: '100%',
      boxSizing: 'border-box',
      marginTop: {
        xs: '32px',
        lg: '0px',
      },
      paddingBottom: {
        xs: '10px',
        lg: '0px',
      },
      gap: '12px',
      [theme.breakpoints.up('prompt_list_lg')]: {
        maxWidth: getChatWidthLG(),
        minWidth: getChatWidthLG(),
      },
      [theme.breakpoints.down('prompt_list_lg')]: {
        maxWidth: getChatWidthSM(),
        minWidth: getChatWidthSM(),
      },
      [theme.breakpoints.down('lg')]: {
        maxWidth: '100% !important',
        minWidth: '100% !important',
      },
      '& split': {
        display: 'flex',
        flexDirection: 'row',
      },
      '& .gutter': {
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '50%',
        height: !isSmallWindow ? '100%' : undefined,
        width: isSmallWindow ? '100% !important' : undefined,
        '&.gutter-horizontal': {
          backgroundImage: `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==')`,
          cursor: 'col-resize',
          minWidth: showResizeGutter ? '24px' : '0px',
          width: '0px !important',
        },
        '&.gutter-vertical': {
          minHeight: showResizeGutter ? '24px' : '0px',
        },
      },
    },
    splitWrapper: {
      display: 'flex',
      flex: 1,
      height: '100%',
      minHeight: '100%',
      flexDirection: isSmallWindow ? 'column' : 'row',
      maxWidth: '100%',
      gap: isSmallWindow ? '12px' : undefined,
    },
    splitChatWrapper: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '100%',
      gap: '8px',
      justifyContent: 'space-between',
      minWidth: isSmallWindow ? '100%' : '320px',
      width: !isAnyEditorOpen ? '100% !important' : undefined,
    },
    loadingContainer: {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1000,
    },
    loadingInnerContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      borderRadius: '1rem',
      border: `1px solid ${theme.palette.border.lines}`,
      background: theme.palette.background.secondary,
    },
  };
};

export default NewChat;
