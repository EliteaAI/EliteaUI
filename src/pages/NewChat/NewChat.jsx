import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import Split from 'react-split';
import { v4 as uuidv4 } from 'uuid';

import { Box, CircularProgress, Grid, useTheme } from '@mui/material';

import { useEditingArtifactsNavBlocker } from '@/[fsd]/features/artifacts/lib/hooks';
import { useManualSocket } from '@/[fsd]/features/auth/lib/hooks';
import { useLazyConversationDetailsQuery } from '@/[fsd]/features/chat/api';
import { applyParticipantChanges } from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import {
  useChatHistoryActions,
  useChatHistoryData,
  useCreateFolder,
  useDuplicateConversation,
  useOpenImportedConversation,
  usePinConversation,
  useRegisterChatPage,
  useSelectInitialConversation,
} from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import {
  useApplyChatSendFailures,
  useChatEditors,
  useChatSocketReconnect,
  useConversationNavigation,
  useCreatedAwayConversationName,
  useEditConversation,
  useInternalToolsConfig,
  useIsCreatingConversation,
  useMarkConversationRunSeen,
} from '@/[fsd]/features/chat/lib/hooks';
import {
  canParticipantBeActiveInChat,
  getChatParticipantUniqueId,
} from '@/[fsd]/features/chat/participants/lib/helpers';
import {
  useActivateConversationParticipant,
  useActiveParticipantDetails,
  useAddNewParticipants,
} from '@/[fsd]/features/chat/participants/lib/hooks';
import { ParticipantsWrapper } from '@/[fsd]/features/chat/participants/ui';
import { ChatBox } from '@/[fsd]/features/chat/ui';
import { AddNewUserModal } from '@/[fsd]/features/chat/ui/chat-modal';
import { ChatEditorPanel } from '@/[fsd]/features/chat/ui/editors';
import { FIRST_ELITEA_TOUR_ID, useProposePendingTour } from '@/[fsd]/features/interactive-tours';
import { skillComposerPlaceholder } from '@/[fsd]/features/skill/lib/helpers';
import { ChunkHelpers } from '@/[fsd]/shared/lib/helpers';
import { useIsSmallWindow, useToast } from '@/[fsd]/shared/lib/hooks';
import { eliteaApi } from '@/api/eliteaApi';
import {
  ChatParticipantType,
  DefaultConversationName,
  SearchParams,
  dummyConversation,
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
import useEditingCanvasNavBlocker from '@/hooks/chat/useEditingCanvasNavBlocker';
import useLocalActiveParticipant from '@/hooks/chat/useLocalActiveParticipant';
import usePlaybackConversation from '@/hooks/chat/usePlaybackConversation';
import useRemoteParticipantUpdate from '@/hooks/chat/useRemoteParticipantUpdate';
import useSelectConversation from '@/hooks/chat/useSelectConversation';
import useSynChatMessage from '@/hooks/chat/useSyncChatMessage';
import useUploadAttachments from '@/hooks/chat/useUploadAttachments';
import useNavBlocker from '@/hooks/useNavBlocker';
import NewConversationView from '@/pages/NewChat/NewConversationView';
import { actions as chatActions } from '@/slices/chat';
import { actions } from '@/slices/settings';

const PlaybackChatBox = ChunkHelpers.lazyWithRetry(
  () => import('@/[fsd]/features/chat/ui/playback/PlaybackChatBox'),
);

const TAG_TYPE_FOLDERS = 'TAG_TYPE_FOLDERS';

const noop = () => {};

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

  // The chat list lives in the menu (ChatHistoryProvider); the page edits it through the same setters
  const {
    dateGroups,
    pinnedConversations,
    folders,
    searchQuery: sidebarSearchQuery,
    isLoadMoreConversations,
    isConversationsLoaded,
  } = useChatHistoryData();
  const { setDateGroups, setConversations, setPinnedConversations, setFolders, setActiveFolder } =
    useChatHistoryActions();

  const conversations = useMemo(() => dateGroups.flatMap(g => g.conversations), [dateGroups]);

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

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newConversationQuestion, setNewConversationQuestion] = useState('');

  const { isSmallWindow } = useIsSmallWindow();

  const { id: userId } = useSelector(state => state.user);

  // The 248px Participants panel of the design plus the column's 24px and 16px paddings
  const rightPanelWidth = 288;

  const { clearLocalActiveParticipant, getLocalActiveParticipant, setLocalActiveParticipant } =
    useLocalActiveParticipant();

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
    [activeConversation?.uuid, changeUrlByConversation, dispatch, setConversations, setFolders],
  );

  useChatConversationNameUpdateSocket({ onRemoteUpdateConversationName });
  const { watchConversationName } = useCreatedAwayConversationName({
    projectId,
    onNameResolved: onRemoteUpdateConversationName,
  });

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

  // Bumped when the user starts opening another chat: the active one only changes once it has loaded
  const selectionCountRef = useRef(0);

  const { onCreateConversation, onCancelCreateConversation } = useCreateConversation({
    activeConversation,
    selectionCountRef,
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

  const {
    onSelectConversation: selectConversationNow,
    isLoadingConversation,
    isSelectingConversation,
    markConversationDeleted,
    isConversationDeleted,
  } = useSelectConversation({
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

  const onSelectConversation = useCallback(
    conversation => {
      selectionCountRef.current += 1;
      return selectConversationNow(conversation);
    },
    [selectConversationNow],
  );

  const { onImportedConversation } = useOpenImportedConversation({
    setConversations,
    onSelectConversation,
  });

  const [getConversationDetailForRefresh] = useLazyConversationDetailsQuery();

  const activeConversationIdRef = useRef(activeConversation?.id);
  useLayoutEffect(() => {
    activeConversationIdRef.current = activeConversation?.id;
  }, [activeConversation?.id]);

  const { activateParticipant } = useActivateConversationParticipant({
    activeConversationIdRef,
    setActiveParticipant,
    setLocalActiveParticipant,
  });

  useChatSocketReconnect({ activeConversation, projectId, setActiveConversation });

  useApplyChatSendFailures({
    conversationUuid: activeConversation?.isNew ? undefined : activeConversation?.uuid,
    isLoaded: !isSelectingConversation && !isLoadingConversation,
    chatHistory: activeConversation?.chat_history,
    setChatHistory,
  });

  // A run that ended or asked something while this chat was away is read once it is open (EL-7385)
  useMarkConversationRunSeen(projectId, activeConversation?.isNew ? undefined : activeConversation?.uuid);

  const handleRestrictAccessSuccess = useCallback(
    async (conversationId, participantChanges = {}) => {
      // The Share window can also make the chat public
      const isPrivate = participantChanges.isPrivate ?? true;
      const applyPrivate = conv => (conv.id === conversationId ? { ...conv, is_private: isPrivate } : conv);

      setConversations(prev => prev.map(applyPrivate));
      setPinnedConversations(prev => prev.map(applyPrivate));
      setFolders(prev =>
        prev.map(folder => ({ ...folder, conversations: (folder.conversations || []).map(applyPrivate) })),
      );

      if (!activeConversationIdRef.current || activeConversationIdRef.current !== conversationId) return;

      const updateActiveParticipants = participants =>
        setActiveConversation(prev => {
          if (!prev || prev.id !== conversationId) return prev;
          return {
            ...prev,
            participants: applyParticipantChanges(participants ?? prev.participants, participantChanges),
            is_private: isPrivate,
          };
        });

      updateActiveParticipants();

      // The refetch may be served by a request that started before the deletes landed, so the confirmed
      // changes are re-applied on top of whatever it returns.
      const result = await getConversationDetailForRefresh({ projectId, id: conversationId });
      if (!result.data?.participants) return;
      updateActiveParticipants(result.data.participants);
    },
    [
      getConversationDetailForRefresh,
      projectId,
      setActiveConversation,
      setConversations,
      setPinnedConversations,
      setFolders,
    ],
  );

  const handleNotFoundAcknowledge = useCallback(() => {
    setConversationNotFound(false);
    clearUrlConversation();
    const pinnedList = pinnedConversations || [];
    const dateGroupList = dateGroups?.flatMap(g => g.conversations) || [];
    const folderList = folders?.flatMap(f => f.conversations) || [];
    const firstAvailable = [...pinnedList, ...dateGroupList, ...folderList][0];
    if (firstAvailable) onSelectConversation(firstAvailable);
  }, [clearUrlConversation, pinnedConversations, dateGroups, folders, onSelectConversation]);

  useSelectInitialConversation({
    onSelectConversation,
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
    setCollapsedConversations: noop,
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
    activateParticipant,
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
    onCreateSkill,
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
    isSkillCreateMode,
    editingAgent,
    editingToolkit,
    editingPipeline,
    editingSkill,
    pipelineSizes,
    pipelineOnDragEnd,
    pipelineGutterStyle,
    onAgentCreated,
    onPipelineCreated,
    onSkillCreated,
    onToolkitCreated,
    handleAgentSaved,
    handleEditorDirtyStateChange,
    handleShowVersionChangeAlert,
    handleAttachmentToolChange,
    handleEditorConversationStartersChange,
    handleConversationLlmOverride,
    handleSkillSettingsChange,
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
        // The person goes too: a member of a whole-team chat may not be a participant yet
        shouldMentionUser && mentionTarget?.mentionUser?.(`@${participant.meta.user_name} `, participant);
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
        if (participant) {
          activateParticipant(activeConversation.id, participant);
        } else {
          setActiveParticipant(participant);
          clearLocalActiveParticipant(activeConversation.id);
        }
      } else {
        newConversationViewRef.current?.onSelectParticipant(participant);
      }
    },
    [
      activeConversation?.isNew,
      activeConversation?.id,
      isEditingAgent,
      activateParticipant,
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
      onCreateSkill,
      onCreateToolkit,
      onDeleteParticipant,
    }),
    [
      onChangeParticipantSettings,
      onClearActiveParticipant,
      onSelectThisParticipant,
      setChatHistory,
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
      onCreateSkill,
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

    if (isConversationDeleted(conversationIdFromUrl)) {
      clearUrlConversation({ replace: true });
      return;
    }

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
    clearUrlConversation,
    conversationIdFromUrl,
    conversations,
    folders,
    isConversationDeleted,
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

  const { onEditConversation } = useEditConversation({
    activeConversation,
    setActiveConversation,
    setConversations,
    setPinnedConversations,
    setFolders,
    toastError,
  });

  const { onDeleteConversation } = useDeleteConversation({
    activeConversation,
    setActiveConversation,
    setConversations,
    setFolders,
    setPinnedConversations,
    toastError,
    toastSuccess,
    emitLeaveRoom,
    stopListenCanvasEditorsChangeEvent,
    stopListenCanvasContentChangeEvent,
    conversations,
    folders,
    onSelectConversation,
    markConversationDeleted,
    isConversationDeleted,
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
      if (folder?.isNew || folder?.owner_id != userId) return;
      startNewConversation(folder.id);
    },
    [startNewConversation, userId],
  );

  // The menu's chat history runs these while the page is open: they know the open chat
  useRegisterChatPage({
    actions: {
      onSelectConversation: onHandleSelectConversation,
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
      onRestrictAccessSuccess: handleRestrictAccessSuccess,
      onCreateFolder,
      onCancelCreateFolder,
    },
    selectedConversationId: genConversationId(activeConversation),
    duplicatingConversationId,
  });

  useEffect(() => {
    if (isCreatingConversation && !activeConversation?.isNew) {
      startNewConversation();
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

  // Only leave the room: the run keeps going on the server
  useEffect(() => {
    return () => {
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
    collapsedParticipants,
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
      } else if (entity_name === ChatParticipantType.Skills) {
        onEditSkill(participant);
      }
    },
    [onEditToolkit, onEditAgent, onEditPipeline, onEditSkill],
  );

  const renderRightPanel = useCallback(
    smallWindow => {
      const participantsCommonProps = {
        collapsed: collapsedParticipants,
        rightPanelWidth,
        activeConversation,
        onAccessSaved: handleRestrictAccessSuccess,
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
      handleRestrictAccessSuccess,
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
                watchConversationName={watchConversationName}
                activeConversation={activeConversation}
                setActiveConversation={setActiveConversation}
                activeParticipant={activeParticipant}
                activeParticipantDetails={activeParticipantDetails}
                setActiveParticipant={setActiveParticipant}
                setChatHistory={setChatHistory}
                interaction_uuid={interaction_uuid}
                onShowAgentEditor={onEditAgent}
                onShowPipelineEditor={onEditPipeline}
                onShowSkillEditor={onEditSkill}
                onCloseSkillEditor={onCloseSkillEditor}
                editingSkill={editingSkill}
                isEditorDirty={editorIsDirty}
                onShowVersionChangeAlert={handleShowVersionChangeAlert}
                onCloseAgentEditor={handleCloseAgentEditor}
                onCreateAgent={onCreateAgent}
                onCreatePipeline={onCreatePipeline}
                onCreateSkill={onCreateSkill}
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
                showParticipantsWelcome
                hidden={!showChatBox}
                key={'chatBox' + showChatBox}
                ref={boxRef}
                onEditCanvas={onEditCanvas}
                selectedCodeBlockInfo={selectedCodeBlockInfo}
                onShowAgentEditor={onEditAgent}
                onShowPipelineEditor={onEditPipeline}
                onShowSkillEditor={onEditSkill}
                onCloseSkillEditor={onCloseSkillEditor}
                editingSkill={editingSkill}
                onShowProjectContextEditor={onEditProjectContext}
                onShowToolkitEditor={onEditToolkit}
                onCloseAgentEditor={handleCloseAgentEditor}
                onClosePipelineEditor={handleClosePipelineEditor}
                isEditorDirty={editorIsDirty}
                onShowVersionChangeAlert={handleShowVersionChangeAlert}
                inputPlaceholder={skillComposerPlaceholder(activeParticipant, 'Type your message...')}
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
                handleSkillSettingsChange={handleSkillSettingsChange}
                isNewConversation={!!activeConversation?.isNew}
                onCloseSkillEditor={onCloseSkillEditor}
                isSkillCreateMode={isSkillCreateMode}
                onSkillCreated={onSkillCreated}
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
        alertContent="The chat you are looking for does not exist in your project or you don't have access to it. For sharing links, please use the Share option in the chat menu."
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
  collapsedParticipants,
  rightPanelWidth,
  showResizeGutter,
  isAnyEditorOpen,
}) => {
  const COLLAPSED_RIGHT = 80;

  // The chat list moved to the menu: the chat takes all the width the Participants panel leaves
  const getChatWidth = () => {
    const right = collapsedParticipants ? COLLAPSED_RIGHT : rightPanelWidth;
    return `calc(100% - ${right}px) !important`;
  };

  return {
    container: {
      padding: isSmallWindow ? '1rem 1.5rem' : '1rem 0rem 1rem 1.5rem',
      boxSizing: 'border-box',
      height: '100vh',
      marginLeft: 0,
      background: theme.palette.background.default.tertiary,
      width: '100%',
    },
    conversationWrapper: {
      height: '100%',
      minHeight: '100%',
      boxSizing: 'border-box',
      marginTop: '32px',
      paddingBottom: '10px',
      gap: '12px',
      // One lg block: a responsive marginTop/paddingBottom object would emit the same media query and be lost
      [theme.breakpoints.up('lg')]: {
        marginTop: 0,
        paddingBottom: 0,
        maxWidth: getChatWidth(),
        minWidth: getChatWidth(),
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
      background: theme.palette.background.default.secondary,
    },
  };
};

export default NewChat;
