import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import Split from 'react-split';
import { v4 as uuidv4 } from 'uuid';

import { Box, CircularProgress, Grid, useTheme } from '@mui/material';

import { useEditingArtifactsNavBlocker } from '@/[fsd]/features/artifacts/lib/hooks/useEditingArtifactsNavBlocker.hooks';
import { FilePreviewCanvas } from '@/[fsd]/features/artifacts/ui';
import {
  useAttachmentToolChange,
  useConversationNavigation,
  useConversationStarters,
  useEditConversation,
  useInternalToolsConfig,
} from '@/[fsd]/features/chat/lib/hooks';
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
import { genConversationId, getChatParticipantUniqueId, getRawParticipantUniqueId } from '@/common/utils';
import AlertDialog from '@/components/AlertDialog';
import {
  useChatConversationNameUpdateSocket,
  useChatMessageDeleteAllSocket,
  useChatMessageDeleteSocket,
  useChatMessageSyncSocket,
  useChatParticipantDeleteSocket,
  useChatParticipantUpdateSocket,
} from '@/components/Chat/hooks';
import useActiveParticipantDetails from '@/hooks/chat/useActiveParticipantDetails';
import useAddNewParticipants, { canParticipantBeActiveInChat } from '@/hooks/chat/useAddNewParticipants';
import useAgentCreation from '@/hooks/chat/useAgentCreation';
import { useAgentEditorUrlSync } from '@/hooks/chat/useAgentEditorUrlSync';
import useAttachments from '@/hooks/chat/useAttachments';
import useChangeParticipantSettings from '@/hooks/chat/useChangeParticipantSettings';
import useChatCanvasContentChange from '@/hooks/chat/useChatCanvasContentChange';
import useChatCanvasEditorsChange from '@/hooks/chat/useChatCanvasEditorsChange';
import useChatInteractionUUID from '@/hooks/chat/useChatInteractionUUID';
import useCloseEditorAlert from '@/hooks/chat/useCloseEditorAlert';
import useCreateConversation from '@/hooks/chat/useCreateConversation';
import useCreateFolder from '@/hooks/chat/useCreateFolder';
import useDeleteAllMessageFromConversation from '@/hooks/chat/useDeleteAllMessageFromConversation';
import useDeleteConversation from '@/hooks/chat/useDeleteConversation';
import { useDeleteFolder } from '@/hooks/chat/useDeleteFolder.js';
import useDeleteMessageFromConversation from '@/hooks/chat/useDeleteMessageFromConversation';
import useDeleteParticipant from '@/hooks/chat/useDeleteParticipant';
import useEditAgent from '@/hooks/chat/useEditAgent';
import useEditCanvas from '@/hooks/chat/useEditCanvas';
import useEditFolder from '@/hooks/chat/useEditFolder.js';
import useEditPipeline from '@/hooks/chat/useEditPipeline';
import useEditToolkit from '@/hooks/chat/useEditToolkit';
import useEditingCanvasNavBlocker from '@/hooks/chat/useEditingCanvasNavBlocker';
import useLocalActiveParticipant from '@/hooks/chat/useLocalActiveParticipant';
import useMoveToFolderConversation from '@/hooks/chat/useMoveToFolderConversation.js';
import { useMutuallyExclusiveEditors } from '@/hooks/chat/useMutuallyExclusiveEditors';
import usePinConversation from '@/hooks/chat/usePinConversation';
import usePipelineCreation from '@/hooks/chat/usePipelineCreation';
import usePlaybackConversation from '@/hooks/chat/usePlaybackConversation';
import useQueryFoldersList from '@/hooks/chat/useQueryFoldersList.js';
import useRemoteParticipantUpdate from '@/hooks/chat/useRemoteParticipantUpdate';
import useReorderFolders from '@/hooks/chat/useReorderFolders.js';
import useSelectConversation from '@/hooks/chat/useSelectConversation';
import useStreamingNavBlocker from '@/hooks/chat/useStreamingNavBlocker';
import useSynChatMessage from '@/hooks/chat/useSynChatMessage';
import useToolkitCreation from '@/hooks/chat/useToolkitCreation';
import useUploadAttachments from '@/hooks/chat/useUploadAttachments';
import useGetWindowWidth from '@/hooks/useGetWindowWidth';
import { useIsCreatingConversation } from '@/hooks/useIsFromSpecificPageHooks';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import useNavBlocker from '@/hooks/useNavBlocker';
import { useManualSocket } from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';
import { AddNewUserModal } from '@/pages/NewChat/AddNewUser/AddNewUserModal';
import AgentEditor from '@/pages/NewChat/AgentEditor';
import CanvasEditor from '@/pages/NewChat/CanvasEditor';
import ChatBox from '@/pages/NewChat/ChatBox';
import Conversations from '@/pages/NewChat/Conversations';
import NewConversationView from '@/pages/NewChat/NewConversationView';
import PipelineEditor from '@/pages/NewChat/PipelineEditor';
import PlaybackChatBox from '@/pages/NewChat/PlaybackChatBox';
import ToolkitEditor from '@/pages/NewChat/ToolkitEditor';
import { actions as chatActions } from '@/slices/chat';
import { actions } from '@/slices/settings';

import ParticipantsWrapper from './Participants/index';

const NewChat = props => {
  const { projectId, preProjectId, setPreProjectId } = props;

  const dispatch = useDispatch();

  // For syncing AgentEditor state with URL
  const boxRef = useRef();
  const newConversationViewRef = useRef();

  const { toastError, toastInfo, toastSuccess } = useToast({ topPosition: '.625rem' });

  const theme = useTheme();

  const [searchParams] = useSearchParams();

  const { isAnyEditorOpen } = useNavBlocker();

  // State variables
  const [activeConversation, setActiveConversation] = useState(dummyConversation);
  const [conversations, setConversations] = useState([]);

  const [collapsedConversations, setCollapsedConversations] = useState(false);

  const [activeFolder, setActiveFolder] = useState(dummyFolder);
  const [folders, setFolders] = useState([]);
  const isPlayback = useMemo(() => activeConversation?.isPlayback, [activeConversation]);
  const isNewConversation = useMemo(
    () =>
      activeConversation?.isNew ||
      (!conversations?.length && folders?.every(folder => !folder.conversations?.length)) ||
      !activeConversation?.name,
    [activeConversation?.isNew, activeConversation?.name, conversations?.length, folders],
  );
  const showNewConversationView = useMemo(
    () => !isPlayback && isNewConversation,
    [isNewConversation, isPlayback],
  );
  const showChatBox = useMemo(() => !isPlayback && !isNewConversation, [isNewConversation, isPlayback]);

  const [activeParticipant, setActiveParticipant] = useState();
  const [collapsedParticipants, setCollapsedParticipants] = useState(false);

  const [isStreaming, setIsStreaming] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newConversationQuestion, setNewConversationQuestion] = useState('');

  // Track dirty state for both agent and pipeline editors
  const [editorIsDirty, setEditorIsDirty] = useState(false);
  const [showVersionChangeAlert, setShowVersionChangeAlert] = useState(false);
  const [pendingVersionChangeCallback, setPendingVersionChangeCallback] = useState(null);

  const { windowWidth } = useGetWindowWidth();
  const { isSmallWindow } = useIsSmallWindow();

  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);

  const leftPanelWidth = useMemo(
    () => (sideBarCollapsed ? 300 : windowWidth > 1700 ? 300 : 380 - SIDE_BAR_WIDTH / 2),
    [sideBarCollapsed, windowWidth],
  );

  const rightPanelWidth = useMemo(
    () => (sideBarCollapsed ? 252 : windowWidth > 1700 ? 252 : 332 - SIDE_BAR_WIDTH / 2),
    [sideBarCollapsed, windowWidth],
  );

  const { clearLocalActiveParticipant, getLocalActiveParticipant, setLocalActiveParticipant } =
    useLocalActiveParticipant();

  const ungroupedConversationsCount = useMemo(() => {
    return conversations.length;
  }, [conversations]);

  const totalConversationsAmount = useMemo(() => {
    const folderConversationsCount = (Array.isArray(folders) ? folders : []).reduce((acc, folder) => {
      return acc + (folder.conversations?.length || 0);
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

  const {
    isEditingAgent,
    editingAgent,
    isCreateMode,
    onShowAgentEditor,
    onShowAgentEditorCreator,
    onAgentEditorCreated,
    onCloseAgentEditor,
    handleAgentSaved,
  } = useEditAgent({ activeParticipant, setActiveParticipant, onChangeParticipantSettings });

  const {
    isEditingToolkit,
    editingToolkit,
    isToolkitCreateMode,
    onShowToolkitEditor,
    onCloseToolkitEditor,
    onToolkitEditorCreated,
    onShowToolkitEditorCreator,
  } = useEditToolkit();

  const {
    isEditingPipeline,
    editingPipeline,
    isPipelineCreateMode,
    onShowPipelineEditor,
    onClosePipelineEditor,
    onPipelineEditorCreated,
    onShowPipelineEditorCreator,
    sizes: pipelineSizes,
    onDragEnd: pipelineOnDragEnd,
    gutterStyle: pipelineGutterStyle,
  } = useEditPipeline();

  // --- AgentEditor URL sync logic moved to custom hook ---
  const { markAgentEditorClosed, markPipelineEditorClosed } = useAgentEditorUrlSync({
    editingAgent,
    editingPipeline,
    onShowAgentEditor,
    onShowPipelineEditor,
    activeConversation,
  });

  const { activeParticipantDetails, refetchParticipantDetails } = useActiveParticipantDetails({
    activeParticipant,
  });

  const { handleAttachmentToolChange } = useAttachmentToolChange({
    activeParticipant,
    refetchParticipantDetails,
  });

  const {
    displayedConversationStarters,
    handleEditorConversationStartersChange,
    resetEditorConversationStarters,
  } = useConversationStarters({
    activeParticipant,
    activeParticipantDetails,
    editingAgent,
    editingPipeline,
  });

  // Wrap onCloseAgentEditor to mark explicit close
  const handleCloseAgentEditor = useCallback(() => {
    markAgentEditorClosed();
    resetEditorConversationStarters();
    onCloseAgentEditor();
  }, [markAgentEditorClosed, onCloseAgentEditor, resetEditorConversationStarters]);

  // Wrap onClosePipelineEditor to mark explicit close
  const handleClosePipelineEditor = useCallback(() => {
    markPipelineEditorClosed();
    resetEditorConversationStarters();
    onClosePipelineEditor();
  }, [markPipelineEditorClosed, onClosePipelineEditor, resetEditorConversationStarters]);

  // Handle dirty state changes for both agent and pipeline editors
  const handleEditorDirtyStateChange = useCallback(isDirty => {
    setEditorIsDirty(isDirty);
  }, []);

  const handleShowVersionChangeAlert = useCallback(onConfirmCallback => {
    setPendingVersionChangeCallback(() => onConfirmCallback);
    setShowVersionChangeAlert(true);
  }, []);

  const handleVersionChangeConfirm = useCallback(() => {
    // Close whichever editor is currently open
    if (isEditingAgent) handleCloseAgentEditor();
    if (isEditingPipeline) handleClosePipelineEditor();

    if (pendingVersionChangeCallback) pendingVersionChangeCallback();

    setShowVersionChangeAlert(false);
    setPendingVersionChangeCallback(null);
    setEditorIsDirty(false);
  }, [
    isEditingAgent,
    isEditingPipeline,
    handleCloseAgentEditor,
    handleClosePipelineEditor,
    pendingVersionChangeCallback,
  ]);

  const handleVersionChangeCancel = useCallback(() => {
    setShowVersionChangeAlert(false);
    setPendingVersionChangeCallback(null);
  }, []);

  const playbackChatBoxRef = useRef();

  const { conversationIdFromUrl, clearUrlConversation, changeUrlByConversation } =
    useConversationNavigation();

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
    toastInfo,
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

  useChatMessageDeleteSocket({
    onRemoteDeleteMessage,
  });

  useChatMessageDeleteAllSocket({
    onRemoteDeleteAllMessages,
  });

  const { onDeleteParticipant, onRemoteDeleteParticipant } = useDeleteParticipant({
    setActiveConversation,
    setConversations,
    activeConversation,
    activeParticipant,
    setActiveParticipant,
    toastError,
    newConversationViewRef,
  });

  useChatParticipantDeleteSocket({
    onRemoteDeleteParticipant,
  });

  const { onRemoteUpdateParticipant } = useRemoteParticipantUpdate({
    setActiveConversation,
    setConversations,
    activeConversation,
    activeParticipant,
    setActiveParticipant,
  });

  useChatParticipantUpdateSocket({ onRemoteUpdateParticipant });

  // Handle conversation name auto-update
  const onRemoteUpdateConversationName = useCallback(
    data => {
      // Update active conversation if it matches
      if (activeConversation?.uuid === data.conversation_uuid) {
        changeUrlByConversation(data.conversation_id, data.name);
        setActiveConversation(prev => ({
          ...prev,
          name: data.name,
          isNamingPending: false,
        }));
      }

      // Update conversation in the conversations list
      setConversations(prev =>
        prev.map(conversation =>
          conversation.uuid === data.conversation_uuid
            ? { ...conversation, name: data.name, isNamingPending: false }
            : conversation,
        ),
      );

      // Update conversation in folders as well
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
    },
    [activeConversation?.uuid, changeUrlByConversation],
  );

  useChatConversationNameUpdateSocket({ onRemoteUpdateConversationName });

  const { onPinConversation } = usePinConversation({
    activeConversation,
    setActiveConversation,
    setConversations,
    setFolders,
    projectId,
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

  const { addNewParticipants, addParticipantsToNewConversation } = useAddNewParticipants({
    toastError,
    activeConversation,
    setActiveConversation,
    setConversations,
    newConversationViewRef,
  });

  const doAddNewUsers = useCallback(
    participants => {
      setShowAddUserModal(false);
      addNewParticipants(participants);
      // boxRef.current?.mentionUser?.(participants.map(user => `@${user.name}`).join(' '))
    },
    [addNewParticipants],
  );

  const onSelectParticipant = useCallback(
    (participant, shouldMentionUser = true) => {
      // If AgentEditor is open, update it to show the new participant only if different
      if (isEditingAgent) return;

      if (participant?.entity_name === ChatParticipantType.Users) {
        shouldMentionUser && boxRef.current?.mentionUser?.(`@${participant.meta.user_name} `);
      } else if (participant === 'All users') {
        shouldMentionUser && boxRef.current?.mentionUser?.(`@Everyone `);
        return;
      }

      if (!activeConversation?.isNew && activeConversation?.id) {
        setActiveParticipant(participant);
        if (participant) {
          if (participant?.entity_name !== ChatParticipantType.Users) {
            // Use unique ID to distinguish between public and custom entities with same ID
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
  });

  const {
    isLoadFolders: isLoadConversations,
    isLoadMoreFolders: isLoadMoreConversations,
    onLoadMoreFolders: onLoadMoreConversations,
  } = useQueryFoldersList({
    toastError,
    setFolders,
    setConversations,
    onSelectConversation,
    skipSetConversation:
      isCreatingConversation ||
      activeConversation?.isNew ||
      activeConversation?.id ||
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

  // Ensure AgentEditor, ToolkitEditor, PipelineEditor, CanvasEditor, and ArtifactEditor are mutually exclusive
  const {
    openEditingAlert,
    onCloseEditorAlert,
    onConfirmCloseEditor,
    onEditCanvas,
    onEditAgent,
    onEditToolkit,
    onEditPipeline,
    onEditArtifact,
    onCreateAgent,
    onCreateToolkit,
    onCreatePipeline,
  } = useMutuallyExclusiveEditors({
    //AgentEditor
    onCloseAgentEditor: handleCloseAgentEditor,
    onShowAgentEditor,
    //ToolkitEditor
    onShowToolkitEditor,
    onCloseToolkitEditor,
    //PipelineEditor
    onShowPipelineEditor,
    onClosePipelineEditor,
    //CanvasEditor
    onShowCanvasEditor,
    canvasEditorRef,
    //ArtifactEditor
    onShowArtifactEditor,
    onCloseArtifactEditor,
    // Agent creation
    onShowAgentEditorCreator,
    // Toolkit creation
    onShowToolkitEditorCreator,
    // Pipeline creation
    onShowPipelineEditorCreator,
  });

  // Agent creation workflow hook
  const { onAgentCreated } = useAgentCreation({
    // Agent editor functions
    onAgentEditorCreated,

    // Participant management
    addNewParticipants,
    onSetActiveParticipant: participant => {
      setActiveParticipant(prev =>
        getChatParticipantUniqueId(prev) === getChatParticipantUniqueId(participant) ? participant : prev,
      );
      if (activeConversation?.id) {
        setLocalActiveParticipant(activeConversation.id, getChatParticipantUniqueId(participant));
      }
    },
  });

  // Toolkit creation workflow hook
  const { onToolkitCreated } = useToolkitCreation({
    // Toolkit editor functions
    onToolkitEditorCreated,

    // Participant management
    addNewParticipants,
  });

  // Pipeline creation workflow hook
  const { onPipelineCreated } = usePipelineCreation({
    // Pipeline editor functions
    onPipelineEditorCreated,

    // Participant management
    addNewParticipants,
    onSetActiveParticipant: participant => {
      setActiveParticipant(prev =>
        getChatParticipantUniqueId(prev) === getChatParticipantUniqueId(participant) ? participant : prev,
      );
      if (activeConversation?.id) {
        setLocalActiveParticipant(activeConversation.id, getChatParticipantUniqueId(participant));
      }
    },
  });

  const { onRemoteChatMessageSync } = useSynChatMessage({
    activeConversation,
    setActiveConversation,
    setConversations,
    setFolders,
    setSelectedCodeBlockInfo,
  });

  useChatMessageSyncSocket({
    onRemoteChatMessageSync,
  });

  const onAddNewUsers = useCallback(() => {
    setShowAddUserModal(true);
  }, []);

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
        // Only set as active participant if it's allowed to be active in chat (excludes toolkits)
        if (canParticipantBeActiveInChat(foundParticipant || selectedParticipant)) {
          onSelectParticipant(foundParticipant, false);
        }
        // For toolkits, we just add them to the conversation but don't set them as active
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

  const isEditorOpen = useMemo(
    () =>
      !!(
        selectedCodeBlockInfo ||
        isEditingAgent ||
        isEditingPipeline ||
        (isEditingToolkit && !isToolkitCreateMode) ||
        isEditingArtifact
      ),
    [
      isEditingAgent,
      isEditingArtifact,
      isEditingPipeline,
      isEditingToolkit,
      isToolkitCreateMode,
      selectedCodeBlockInfo,
    ],
  );

  const onCloseEditor = useCallback(() => {
    if (selectedCodeBlockInfo) onCloseCanvasEditor();
    else if (isEditingAgent) handleCloseAgentEditor();
    else if (isEditingPipeline) handleClosePipelineEditor();
    else if (isEditingToolkit) onCloseToolkitEditor();
    else if (isEditingArtifact) onCloseArtifactEditor();
    else onCloseCanvasEditor();
  }, [
    handleCloseAgentEditor,
    handleClosePipelineEditor,
    isEditingAgent,
    isEditingArtifact,
    isEditingPipeline,
    isEditingToolkit,
    onCloseArtifactEditor,
    onCloseCanvasEditor,
    onCloseToolkitEditor,
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
    isEditorOpen,
    onCloseEditor,
    onSelectParticipant,
    onSelectConversation,
    onSelectThisParticipant,
    isStreaming,
    setIsStreaming,
    boxRef,
  });

  // Pipeline run nodes editor ref and handlers
  const pipelineEditorRef = useRef();

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

  // Collapse tabs when any editor (CanvasEditor, AgentEditor, or ToolkitEditor) is open
  useEffect(() => {
    setCollapsedParticipants(isAnyEditorOpen);
    setCollapsedConversations(isAnyEditorOpen);
  }, [isAnyEditorOpen]);

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

  // Memoize functions that don't need to change frequently
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
    ],
  );

  const {
    uploadAttachments,
    isUploading: isUploadingAttachments,
    uploadingAttachments,
    uploadProgress,
  } = useUploadAttachments();

  // Create base settings without frequently changing props
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
    const folderConversations = folders?.map(folder => folder.conversations) || [];
    const conversationList = [...conversations, ...folderConversations.flat()];
    const conversationFromUrl = conversationList.find(
      conversation => conversation.id == conversationIdFromUrl,
    );
    if (!isLoadMoreConversations && conversationIdFromUrl && conversationFromUrl && !activeConversation?.id) {
      onSelectConversation(conversationFromUrl);
    }
  }, [
    activeConversation?.id,
    conversationIdFromUrl,
    conversations,
    folders,
    isLoadMoreConversations,
    onSelectConversation,
  ]);

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
    emitLeaveRoom,
    stopListenCanvasEditorsChangeEvent,
    stopListenCanvasContentChangeEvent,
    // Add missing parameters for conversation selection after deletion
    conversations,
    folders,
    onSelectConversation,
  });

  const { onDeleteFolder } = useDeleteFolder({
    setFolders,
    toastError,
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
    setActiveConversation(prev => ({
      ...prev,
      name: newName,
    }));
  }, []);

  const onChangeActiveFolderName = useCallback(newName => {
    setActiveFolder(prev => ({
      ...prev,
      name: newName,
    }));
  }, []);

  useEffect(() => {
    if (isCreatingConversation && !activeConversation?.isNew) {
      if (isStreaming) {
        boxRef.current?.stopAll?.();
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isNamingPending: false, // Don't show "Naming…" until conversation is actually created
      };
      setActiveConversation(newConversation);
      setActiveParticipant();
      // Close editors when active participant is cleared
      handleCloseAgentEditor();
      onCloseToolkitEditor();
      handleClosePipelineEditor();
      setSelectedCodeBlockInfo();
      onCloseArtifactEditor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearUrlConversation, isCreatingConversation, isStreaming, activeConversation?.isNew]);

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

  const onClickClearChat = useCallback(() => {
    boxRef.current?.onClear?.();
  }, []);

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
    if (isAnyEditorOpen) {
      dispatch(actions.setSideBarCollapsed(true));
    }
  }, [dispatch, isAnyEditorOpen]);

  // Show resize gutter for Canvas or Pipeline editors
  const showResizeGutter = !!(selectedCodeBlockInfo || isEditingPipeline || isEditingArtifact);

  const styles = chatStyles({
    theme,
    isSmallWindow,
    collapsedConversations,
    collapsedParticipants,
    leftPanelWidth,
    rightPanelWidth,
    showResizeGutter,
    isAnyEditorOpen,
  });

  // Unified edit function that routes to the appropriate editor based on participant type
  const onEditParticipant = useCallback(
    participant => {
      if (!participant) return;

      const { entity_name } = participant;

      // Route to the appropriate editor based on participant type
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
        onAddNewUsers,
        addNewParticipants,
        onClickClearChat,
        onShowAgentCreator: onCreateAgent,
        onShowToolkitCreator: onCreateToolkit,
        onShowPipelineCreator: onCreatePipeline,
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
      onAddNewUsers,
      addNewParticipants,
      onClickClearChat,
      onCreateAgent,
      onCreateToolkit,
      onCreatePipeline,
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
            ungroupedConversationsCount={ungroupedConversationsCount}
            totalConversationsAmount={totalConversationsAmount}
            onSelectConversation={onHandleSelectConversation}
            onEditConversation={onEditConversation}
            onDeleteConversation={onDeleteConversation}
            onPlaybackConversation={onPlaybackConversation}
            collapsed={collapsedConversations}
            onCollapsed={onConversationCollapsed}
            onLoadMore={onLoadMoreConversations}
            onPinConversation={onPinConversation}
            onCreateConversation={onCreateConversation}
            onCancelCreateConversation={onCancelCreateConversation}
            onChangeActiveConversationName={onChangeActiveConversationName}
            folders={folders}
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
            onCloseCanvas={onCloseCanvas}
            toastSuccess={toastSuccess}
            toastError={toastError}
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
              // Use pipeline sizes when pipeline editor is open
              if (isEditingPipeline) {
                return pipelineSizes;
              }
              // Use canvas sizes when canvas is open
              if (selectedCodeBlockInfo?.codeBlock) {
                return sizes;
              }
              // Use 50/50 for other editors
              if (isAnyEditorOpen) {
                return [50, 50];
              }
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
                setActiveParticipant={setActiveParticipant}
                setChatHistory={setChatHistory}
                interaction_uuid={interaction_uuid}
                onShowAgentEditor={onEditAgent}
                onShowPipelineEditor={onEditPipeline}
                onCloseAgentEditor={handleCloseAgentEditor}
                ref={newConversationViewRef}
                uploadAttachments={uploadAttachments}
                isUploadingAttachments={isUploadingAttachments}
                uploadProgress={uploadProgress}
                setNewConversationQuestion={setNewConversationQuestion}
              />
              <ChatBox
                hidden={!showChatBox}
                key={'chatBox' + showChatBox}
                ref={boxRef}
                onEditCanvas={onEditCanvas}
                selectedCodeBlockInfo={selectedCodeBlockInfo}
                onShowAgentEditor={onEditAgent}
                onShowPipelineEditor={onEditPipeline}
                onCloseAgentEditor={handleCloseAgentEditor}
                onClosePipelineEditor={handleClosePipelineEditor}
                // TODO: Confirm with Hawk START
                isEditorDirty={editorIsDirty}
                onShowVersionChangeAlert={handleShowVersionChangeAlert}
                // TODO: Confirm with Hawk END
                inputPlaceholder="Type your message. Use # to search and add AI assistants to conversation."
                uploadAttachments={uploadAttachments}
                isUploadingAttachments={isUploadingAttachments}
                uploadProgress={uploadProgress}
                newConversationQuestion={newConversationQuestion}
                {...baseSettings}
              />
              <PlaybackChatBox
                hidden={!isPlayback}
                ref={playbackChatBoxRef}
                conversation={activeConversation}
                toastError={toastError}
                key={'playback' + isPlayback}
              />
              {(isLoadMoreConversations || isSelectingConversation) && (
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
                display: isAnyEditorOpen ? 'block' : 'none',
                position: 'relative',
                paddingLeft: isAnyEditorOpen && !showResizeGutter ? '10px' : undefined,
              }}
            >
              <AgentEditor
                agent={editingAgent}
                versionName={
                  activeParticipantDetails?.versions?.find(
                    v => v.id === activeParticipant?.entity_settings?.version_id,
                  )?.name
                }
                onCloseAgentEditor={handleCloseAgentEditor}
                onAgentCreated={onAgentCreated}
                onAgentSaved={handleAgentSaved}
                onAttachmentToolChange={handleAttachmentToolChange}
                isVisible={isEditingAgent}
                isCreateMode={isCreateMode}
                onAgentDirtyStateChange={handleEditorDirtyStateChange}
                onConversationStartersChange={handleEditorConversationStartersChange}
                activeAgentId={
                  activeParticipant?.entity_name === ChatParticipantType.Applications
                    ? activeParticipant.entity_meta?.id
                    : undefined
                }
              />
              <ToolkitEditor
                toolkit={editingToolkit}
                onCloseToolkitEditor={onCloseToolkitEditor}
                onToolkitCreated={onToolkitCreated}
                onToolkitUpdated={onChangeParticipantSettings}
                isVisible={isEditingToolkit}
              />
              <PipelineEditor
                ref={pipelineEditorRef}
                pipeline={editingPipeline}
                onClosePipelineEditor={handleClosePipelineEditor}
                onPipelineCreated={onPipelineCreated}
                onPipelineSaved={onChangeParticipantSettings}
                isVisible={isEditingPipeline}
                isCreateMode={isPipelineCreateMode}
                onPipelineDirtyStateChange={handleEditorDirtyStateChange}
                onConversationStartersChange={handleEditorConversationStartersChange}
                activePipelineId={
                  activeParticipant?.entity_name === ChatParticipantType.Pipelines ||
                  activeParticipant?.entity_name === ChatParticipantType.Applications
                    ? activeParticipant.entity_meta?.id
                    : undefined
                }
                activeParticipantId={activeParticipant?.id}
                stopRunOnNodeStop={onStopRun}
                onAttachmentToolChange={handleAttachmentToolChange}
              />
              <CanvasEditor
                ref={canvasEditorRef}
                selectedCodeBlockInfo={selectedCodeBlockInfo}
                onCloseCanvasEditor={onCloseCanvasEditor}
                interaction_uuid={interaction_uuid}
                conversation_uuid={activeConversation.uuid}
                key={selectedCodeBlockInfo?.blockId}
              />
              {previewingArtifact && (
                <FilePreviewCanvas
                  key={`${previewingArtifact.name}-${previewingArtifact.bucket}`}
                  file={previewingArtifact}
                  projectId={projectId}
                  bucket={previewingArtifact.bucket}
                  onClose={onCloseArtifactEditor}
                />
              )}
            </Box>
          </Split>
        </Grid>

        {renderRightPanel(!isSmallWindow)}
      </Grid>

      <AlertDialog
        title="Warning"
        alertContent="You are editing now. Do you want to discard current changes and continue?"
        open={openEditingAlert}
        alarm
        onClose={onCloseEditorAlert}
        onCancel={onCloseEditorAlert}
        onConfirm={onConfirmCloseEditor}
      />
      <AddNewUserModal
        open={showAddUserModal}
        onAdd={doAddNewUsers}
        onCancel={() => setShowAddUserModal(false)}
        participants={activeConversation?.participants || []}
      />
      <AlertDialog
        title="Warning"
        multiline
        alertContent={alertContent}
        open={openEditorAlert}
        alarm
        onClose={onCancelOperation}
        onCancel={onCancelOperation}
        onConfirm={onConfirmOperation}
      />
      <AlertDialog
        title="Warning"
        alertContent="You are editing now. Do you want to discard current changes and continue?"
        open={showVersionChangeAlert}
        alarm
        onClose={handleVersionChangeCancel}
        onCancel={handleVersionChangeCancel}
        onConfirm={handleVersionChangeConfirm}
        confirmButtonText="Discard Changes"
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
  const everythingCollapsed = collapsedConversations && collapsedParticipants;
  const onlyConversationCollapsed = collapsedConversations && !collapsedParticipants;
  const onlyParticipantsCollapsed = !collapsedConversations && collapsedParticipants;
  const somethingCollapsed = collapsedConversations || collapsedParticipants;

  const getChatWidthLG = () => {
    if (everythingCollapsed) return 'calc(100% - 120px) !important';
    if (onlyConversationCollapsed) return `calc(100% - ${rightPanelWidth + 60}px) !important`;
    if (onlyParticipantsCollapsed) return `calc(100% - ${leftPanelWidth + 60}px) !important`;

    return `calc(100% - ${rightPanelWidth + leftPanelWidth}px) !important`;
  };

  const getChatWidthSM = () => {
    if (everythingCollapsed) return 'calc(100% - 120px) !important';
    if (somethingCollapsed) return 'calc(75% - 60px) !important';

    return '50% !important';
  };

  return {
    container: {
      padding: '1rem 1.5rem',
      boxSizing: 'border-box',
      height: '100vh',
      marginLeft: 0,
      background: theme.palette.background.chatBkg,
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
      background: theme.palette.background.default,
    },
  };
};

export default NewChat;
