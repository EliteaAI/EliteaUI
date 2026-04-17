import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import { Box } from '@mui/system';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { ChatHelpers, NewConversationHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_STEPS_LIMIT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { cleanLLMSettings } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import {
  useConversationEditMutation,
  useRegenerateMutation,
  useRemoveAttachmentsMutation,
  useUpdateParticipantLlmSettingsMutation,
} from '@/api/chat';
import { useListModelsQuery } from '@/api/configurations.js';
import {
  ChatParticipantType,
  PROMPT_PAYLOAD_KEY,
  PUBLIC_PROJECT_ID,
  ROLES,
  ToolActionStatus,
  WELCOME_MESSAGE_ID,
  sioEvents,
} from '@/common/constants';
import { initializeNewMessages } from '@/common/initializeNewMessages';
import {
  generateApplicationStreamingPayload,
  generateChatContinuePayload,
  generateMcpContinuePayload,
  generateMessagePayload,
} from '@/common/messagePayloadUtils';
import { buildErrorMessage } from '@/common/utils';
import AlertDialog from '@/components/AlertDialog';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import { useChatSocket, useStopStreaming } from '@/components/Chat/hooks';
import InfoIcon from '@/components/Icons/InfoIcon';
import SocketContext from '@/contexts/SocketContext';
import useChatStreaming from '@/hooks/chat/useChatStreaming';
import useDeleteMessageAlert from '@/hooks/chat/useDeleteMessageAlert';
import useFetchParticipantDetails from '@/hooks/chat/useFetchParticipantDetails';
import { useNewInputKeyDownHandler } from '@/hooks/chat/useInputKeyDownHandler';
import useLoadMoreMessages from '@/hooks/chat/useLoadMoreMessages';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSocket from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';

import ChatMessageList from '../../components/Chat/ChatMessageList';
import ChatConversationStarters from './ChatConversationStarters';
import NewChatInput from './NewChatInput';
import RecommendationList from './Recommendations/RecommendationList';
import SearchResultList from './Recommendations/SearchResultList';

const getParticipantById = (conversation, participantId) => {
  return conversation?.participants.find(({ id }) => id === participantId) || {};
};

const createHitlEditUserMessage = ({ question, userId, name, avatar, participant }) => {
  const messageId = uuidv4();
  const itemId = new Date().getTime();

  return {
    id: messageId,
    role: ROLES.User,
    name,
    avatar,
    content: question,
    created_at: new Date().getTime(),
    user_id: userId,
    participant_id: participant?.id,
    sentTo: participant ?? {},
    message_items: [
      {
        id: itemId,
        uuid: messageId,
        meta: {},
        order_index: 0,
        item_type: 'text_message',
        item_details: {
          content: question,
          id: itemId,
          item_type: 'text_message',
        },
      },
    ],
  };
};

const createArchivedHitlAssistantMessage = assistantMessage => ({
  ...assistantMessage,
  id: `archived-hitl-${uuidv4()}`,
  question_id: undefined,
  hitlInterrupt: undefined,
  requiresConfirmation: undefined,
  isLoading: false,
  isStreaming: false,
  isRegenerating: false,
  archivedFromHitl: true,
});

const getModelSettings = participant => {
  if (participant.entity_name === ChatParticipantType.Applications) {
    const {
      max_tokens = DEFAULT_MAX_TOKENS,
      temperature = DEFAULT_TEMPERATURE,
      reasoning_effort, // Don't provide default here - let cleanLLMSettings handle it
      model_project_id,
      model_name,
    } = participant.entity_settings.llm_settings || {};

    const settings = {
      max_tokens,
      temperature,
      model_name,
      model_project_id,
    };

    // Only include reasoning_effort if it was explicitly set
    if (reasoning_effort !== undefined) {
      settings.reasoning_effort = reasoning_effort;
    }

    return settings;
  }
  return {};
};

/**
 * Get the selected model for a conversation based on user settings
 * @param {Object} conversation - The conversation object
 * @param {Array} availableModels - List of available models
 * @param {string} userId - The user ID
 * @returns {Object|null} The selected model or null if not found
 */
const getSelectedConversationModel = (conversation, availableModels, userId) => {
  const userSettings = NewConversationHelpers.getChatUserSettings(conversation, userId);

  if (!userSettings?.model_name || !availableModels?.length) {
    return null;
  }

  // First try to find the model with exact project_id match
  let model = availableModels.find(
    m => m.name === userSettings.model_name && m.project_id === userSettings.model_project_id,
  );

  // If not found, try to find by name only (for shared models)
  if (!model) {
    model = availableModels.find(m => m.name === userSettings.model_name);
  }

  return model || null;
};

const ChatBox = forwardRef((props, boxRef) => {
  const {
    hidden = false,
    messageListSX,
    activeParticipant,
    onChangeParticipantSettings,
    onSelectThisParticipant,
    onClearActiveParticipant,
    activeConversation,
    setActiveConversation,
    setChatHistory,
    setIsStreaming,
    isLoadingConversation,
    onDeleteMessage,
    onDeleteAllMessages,
    conversationStarters,
    onEditCanvas,
    selectedCodeBlockInfo,
    interaction_uuid,
    enableMentions = true,
    isAgentsPage = false,
    isEditingAgent,
    onShowAgentEditor,
    onShowPipelineEditor,
    onCloseAgentEditor,
    onClosePipelineEditor,
    activeParticipantDetails,
    isEditorDirty,
    onShowVersionChangeAlert,
    onRefreshParticipantDetails,
    newConversationQuestion,

    // LLM Settings props for modal dialog
    llmSettings = {},
    onSetLLMSettings,
    showWebhookSecret = false,
    onSend = () => true,
    inputPlaceholder = '',
    // For pipeline running
    onRcvAgentEvent,
    deleteAllRunNodes,
    onHandleAttachment,
    onStopRun,
    //Attachment
    onAttachFiles,
    attachments,
    onDeleteAttachment,
    disableAttachments = false,
    hideAttachments = false,
    onClearAttachments,
    // Internal tools config
    onInternalToolsConfigChange,
    isUpdatingInternalToolsConfig,
    //Unsaved LLM settings
    unsavedLLMSettings,
    setUnsavedLLMSettings,
    uploadAttachments,
    isUploadingAttachments,
    uploadProgress,
    onOpenArtifactPreview,
  } = props;

  const socket = useContext(SocketContext);
  const projectId = useSelectedProjectId();
  const [regenerate] = useRegenerateMutation();
  const { name, id: userId, avatar } = useSelector(state => state.user);

  const chat_history = useMemo(
    () => activeConversation?.chat_history || [],
    [activeConversation?.chat_history],
  );
  const { toastError, toastSuccess } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const chatInput = useRef(null);
  const [hitlEditMode, setHitlEditMode] = useState(false);
  const pendingHitlMessage = useMemo(
    () => [...chat_history].reverse().find(item => item.hitlInterrupt),
    [chat_history],
  );
  const hasPendingHitlInterrupt = Boolean(pendingHitlMessage?.hitlInterrupt);
  const [isMentioningEveryone, setIsMentioningEveryone] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [hasStarterBeenSent, setHasStarterBeenSent] = useState(false);
  const isTheUserChattingNow = useMemo(() => {
    const latest40Messages = chat_history.slice(-40);
    let isChatting = false;
    for (let index = 0; index < latest40Messages.length; index++) {
      const message = latest40Messages[index];
      if (message && message.isStreaming && message.participant_id === activeParticipant?.id) {
        if (latest40Messages.find(msg => msg.id === message.question_id && msg.user_id === userId)) {
          isChatting = true;
          break;
        }
      }
    }
    return isChatting;
  }, [activeParticipant?.id, chat_history, userId]);

  const { data: modelsData = { items: [], total: 0 } } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );
  const [selectedModel, setSelectedModel] = useState(null);

  const defaultModel = useMemo(() => {
    return modelsData.items.find(model => model.default) || modelsData.items[0] || null;
  }, [modelsData.items]);

  // Create LLM settings for conversation pages from user settings
  const conversationLlmSettings = useMemo(() => {
    if (isAgentsPage) return llmSettings; // Use prop directly for agents page

    const userSettings = NewConversationHelpers.getChatUserSettings(activeConversation, userId);
    // For steps_limit: prefer value already set by user this session (unsavedLLMSettings),
    // then the persisted conversation meta value, then the default.
    // This ensures the correct value is shown both for new conversations (no meta yet)
    // and after the user changes it in the modal before the first message is sent.
    const stepsLimit =
      unsavedLLMSettings?.steps_limit ?? activeConversation?.meta?.steps_limit ?? DEFAULT_STEPS_LIMIT;

    const baseSettings = {
      model_name: userSettings?.model_name || '',
      model_project_id: userSettings?.model_project_id || projectId,
      temperature: userSettings?.temperature || DEFAULT_TEMPERATURE,
      max_tokens: userSettings?.max_tokens || DEFAULT_MAX_TOKENS,
      steps_limit: stepsLimit,
    };

    // Only include reasoning_effort if user had it set or if model supports reasoning
    if (userSettings?.reasoning_effort !== undefined) {
      baseSettings.reasoning_effort = userSettings.reasoning_effort;
    } else {
      // Find the selected model to check if it supports reasoning
      const model = getSelectedConversationModel(activeConversation, modelsData.items || [], userId);
      if (model?.supports_reasoning) {
        baseSettings.reasoning_effort = DEFAULT_REASONING_EFFORT;
      }
    }

    return baseSettings;
  }, [
    isAgentsPage,
    llmSettings,
    unsavedLLMSettings,
    activeConversation,
    userId,
    projectId,
    modelsData.items,
  ]);

  const selectSavedOrDefaultModel = useCallback(
    (forceSelect = true) => {
      if (forceSelect) {
        onClearActiveParticipant(false);
      }

      let settingsToUse = null;

      if (isAgentsPage && llmSettings) {
        // On agents page, use the llmSettings prop directly
        settingsToUse = {
          model_name: llmSettings.model_name,
          model_project_id: llmSettings.model_project_id,
        };
      } else {
        // Fallback to user settings (original behavior for conversations)
        const userSettings = NewConversationHelpers.getChatUserSettings(activeConversation, userId);
        if (userSettings) {
          settingsToUse = {
            model_name: userSettings.model_name,
            model_project_id: userSettings.model_project_id,
          };
        }
      }
      // }

      if (settingsToUse) {
        if (settingsToUse.model_name) {
          // First try to find the model with the exact project_id
          let model = modelsData.items.find(
            p => p.name === settingsToUse.model_name && p.project_id === settingsToUse.model_project_id,
          );

          // If not found, try to find it as a shared model (project_id might be different)
          if (!model) {
            model = modelsData.items.find(p => p.name === settingsToUse.model_name);
          }

          if (model) {
            setSelectedModel(model);
          } else {
            setSelectedModel(defaultModel);
          }
        } else {
          if (isAgentsPage && onChangeParticipantSettings) {
            // If no model is set in llm settings of agents,
            // update the participant to use default model
            const updatedSettings = {
              ...activeParticipant?.entity_settings,
              llm_settings: {
                ...activeParticipant?.entity_settings.llm_settings,
                model_name: defaultModel?.name,
                model_project_id: defaultModel?.project_id,
              },
            };
            onChangeParticipantSettings(activeParticipant?.id, { entity_settings: updatedSettings });
          }
          setSelectedModel(defaultModel);
        }
      } else {
        setSelectedModel(defaultModel);
      }
    },
    [
      isAgentsPage,
      llmSettings,
      onClearActiveParticipant,
      activeConversation,
      userId,
      modelsData.items,
      defaultModel,
      onChangeParticipantSettings,
      activeParticipant?.entity_settings,
      activeParticipant?.id,
    ],
  );

  // We need this useEffect to keep input value while new conversation creation with attachment upload
  useEffect(() => {
    const currentValue = chatInput.current?.getInputContent() || '';
    const needResetInputValue = newConversationQuestion && uploadProgress === 100;
    const needUpdateInputValue =
      newConversationQuestion &&
      isUploadingAttachments &&
      uploadProgress < 100 &&
      currentValue !== newConversationQuestion;

    if (needUpdateInputValue) chatInput.current?.setValue(newConversationQuestion);
    if (needResetInputValue) chatInput.current?.reset();
  }, [newConversationQuestion, isUploadingAttachments, uploadProgress]);

  useEffect(() => {
    selectSavedOrDefaultModel(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, llmSettings, defaultModel, modelsData.items.length]);

  const getRegeneratePayload = useCallback(
    ({ question, question_id, participant, conversationUuid, attachmentList }) => {
      const realParticipant = participant || activeParticipant || {};
      // When on agents page, allow model override from dropdown selection
      // Otherwise use agent's configured model
      const llm_settings = isAgentsPage
        ? unsavedLLMSettings || { model_name: selectedModel.name, model_project_id: selectedModel.project_id }
        : getModelSettings(realParticipant);
      switch (realParticipant.entity_name) {
        case ChatParticipantType.Pipelines:
        case ChatParticipantType.Applications:
          return {
            payload: generateApplicationStreamingPayload({
              projectId: realParticipant.entity_meta?.project_id || projectId,
              application_id: realParticipant?.entity_meta.id + '',
              instructions: realParticipant?.entity_settings.instructions,
              llm_settings,
              variables: realParticipant?.entity_settings.variables,
              question,
              tools: realParticipant?.entity_settings.tools,
              name,
              currentVersionId: realParticipant?.entity_settings.version_id,
              attachmentList,
            }),
            project_id: projectId,
            participant_id: realParticipant.id,
            conversation_uuid: conversationUuid || activeConversation?.uuid,
            question_id,
            interaction_uuid,
          };
        default:
          // throw new Error('Unsupported participant type for regeneration: ' + realParticipant.entity_name)
          return {
            payload: generateMessagePayload({
              question,
              question_id,
              participant,
              conversation_uuid: conversationUuid || activeConversation?.uuid,
              activeParticipant,
              interaction_uuid,
              projectId,
              selectedModel,
              participants: activeConversation?.participants || [],
            }),
            project_id: projectId,
            participant_id: realParticipant.id,
            conversation_uuid: conversationUuid || activeConversation?.uuid,
            question_id,
            interaction_uuid,
          };
      }
    },
    [
      activeParticipant,
      projectId,
      activeConversation?.uuid,
      activeConversation?.participants,
      interaction_uuid,
      name,
      selectedModel,
      isAgentsPage,
      unsavedLLMSettings,
    ],
  );

  const getPayload = useCallback(
    ({ question, question_id, participant, conversationUuid, attachmentList }) => {
      return generateMessagePayload({
        attachmentList,
        question,
        question_id,
        participant,
        conversation_uuid: conversationUuid || activeConversation?.uuid,
        activeParticipant,
        interaction_uuid,
        projectId,
        selectedModel,
        isSendingToUser: isMentioningEveryone || selectedUsers.length,
        userIds: isMentioningEveryone
          ? activeConversation?.participants
              .filter(
                it =>
                  it.entity_name === ChatParticipantType.Users &&
                  it.entity_meta?.id &&
                  userId !== it.entity_meta?.id,
              )
              .map(it => it.entity_meta?.id) || []
          : selectedUsers.map(user => user.user.id),
        unsavedLLMSettings,
        participants: activeConversation?.participants || [],
        allowLLMSettingsOverride: isAgentsPage,
        conversationMeta: activeConversation?.meta,
      });
    },
    [
      activeConversation?.participants,
      activeConversation?.uuid,
      activeConversation?.meta,
      activeParticipant,
      interaction_uuid,
      isAgentsPage,
      isMentioningEveryone,
      projectId,
      selectedModel,
      selectedUsers,
      userId,
      unsavedLLMSettings,
    ],
  );

  const [conversationEdit] = useConversationEditMutation();

  const handleError = useCallback(
    errorObj => {
      toastError(buildErrorMessage(errorObj));
      if (isRegenerating) {
        setIsRegenerating(false);
      }
    },
    [isRegenerating, toastError],
  );

  const onDeleteChatMessage = useCallback(
    async (messageIdToDelete, callback) => {
      if (onDeleteMessage) {
        await onDeleteMessage(messageIdToDelete, callback);
      } else {
        callback?.();
      }
    },
    [onDeleteMessage],
  );

  const onDeleteAllChatMessages = useCallback(
    async callback => {
      await onDeleteAllMessages(callback);
    },
    [onDeleteAllMessages],
  );

  const { chatHistoryRef, emit, emitLeaveRoom } = useChatSocket({
    mode: 'chat',
    handleError,
    chatHistory: chat_history,
    setChatHistory,
    activeParticipant,
    participants: activeConversation?.participants || [],
    onRcvAgentEvent,
    isMonoChatting: isAgentsPage,
  });

  const { emit: emitContinue } = useSocket(sioEvents.chat_continue_predict);

  const userParticipantId = useMemo(
    () =>
      activeConversation?.participants.find(
        p => p.entity_name === ChatParticipantType.Users && p.entity_meta?.id === userId,
      )?.id,
    [activeConversation?.participants, userId],
  );

  const { isStreaming, onStopStreaming, disableCleanup, enableCleanup } = useStopStreaming({
    chatHistoryRef,
    chatHistory: chat_history,
    setChatHistory,
    emitLeaveRoom,
    userParticipantId,
    userId,
  });

  // Disable cleanup when editing canvas or agent
  useEffect(() => {
    if (selectedCodeBlockInfo?.canvasId || isEditingAgent) {
      disableCleanup();
    } else {
      enableCleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCodeBlockInfo?.canvasId, isEditingAgent]);

  useEffect(() => {
    setIsStreaming?.(isStreaming);
  }, [isStreaming, setIsStreaming]);

  const { setStreamingInfo, stopStreaming, clearConversationStreamingInfo, isStreamingNow } =
    useChatStreaming({
      conversationId: activeConversation?.uuid,
      chatHistory: chat_history,
      onStopStreaming,
      isChatStreaming: !isAgentsPage,
    });

  const setActiveConversationRef = useRef(setActiveConversation);
  const stopStreamingRef = useRef(stopStreaming);
  const activeConversationRef = useRef(activeConversation);
  // Store the participant_id from conversation creation to use for subsequent messages
  // This ensures we use the correct participant_id even before React state update propagates
  const participantIdRef = useRef(null);
  useEffect(() => {
    setActiveConversationRef.current = setActiveConversation;
  }, [setActiveConversation]);

  useEffect(() => {
    stopStreamingRef.current = stopStreaming;
  }, [stopStreaming]);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Sync participantIdRef with activeParticipant.id when it changes
  // Clear the ref when participant is deselected to allow switching back to model-only mode
  useEffect(() => {
    if (activeParticipant?.id) {
      participantIdRef.current = activeParticipant.id;
    } else {
      // Clear ref when participant is deselected
      participantIdRef.current = null;
    }
  }, [activeParticipant?.id]);

  // Clear participantIdRef when conversation is reset (no uuid means new conversation)
  useEffect(() => {
    if (!activeConversation?.uuid) {
      participantIdRef.current = null;
    }
  }, [activeConversation?.uuid]);

  const handleStopStreaming = useCallback(() => {
    stopStreamingRef.current?.();
    onStopRun?.();
  }, [onStopRun]);

  const { openAlert, alertContent, onDeleteAnswer, onDeleteAll, onConfirmDelete, onCloseAlert } =
    useDeleteMessageAlert({
      setChatHistory,
      chatInput,
      onDeleteChatMessage,
      onDeleteAllChatMessages,
      deleteAllRunNodes,
    });

  const onClickClearChat = useCallback(() => {
    if (chat_history?.length) {
      if (isAgentsPage) {
        const chatHistory = !activeParticipantDetails?.version_details?.welcome_message
          ? []
          : [
              ChatHelpers.getWelcomeMessage(
                activeParticipantDetails?.version_details?.welcome_message,
                activeParticipantDetails?.id,
              ),
            ];

        const conversationParticipant = {
          id: activeParticipantDetails?.id,
          entity_name: 'application',
          entity_meta: {
            id: activeParticipantDetails?.id,
            name: activeParticipantDetails?.name,
            project_id: activeParticipantDetails?.project_id,
          },
          entity_settings: {
            variables: activeParticipantDetails?.version_details?.variables || [],
            instructions: activeParticipantDetails?.version_details?.instructions || '',
            tools: activeParticipantDetails?.version_details?.tools || [],
            llm_settings: activeParticipantDetails?.version_details?.llm_settings || {},
            version_id: activeParticipantDetails?.version_details?.id,
            icon_meta: activeParticipantDetails?.version_details?.meta?.icon_meta || {},
            ...(activeParticipantDetails?.version_details?.agent_type && {
              agent_type: activeParticipantDetails.version_details.agent_type,
            }),
          },
          meta: {
            name: activeParticipantDetails?.name,
          },
        };

        setChatHistory(chatHistory);
        setActiveConversation({
          name: `Chat with ${activeParticipantDetails.name}`,
          is_private: true,
          source: 'agent',
          participants: [conversationParticipant],
          chat_history: chatHistory,
          isNew: true,
          isApplicationChat: true,
        });

        chatInput.current?.reset();
      } else {
        onDeleteAll();
      }

      clearConversationStreamingInfo?.();
    }
  }, [
    chat_history?.length,
    isAgentsPage,
    clearConversationStreamingInfo,
    activeParticipantDetails,
    setChatHistory,
    setActiveConversation,
    onDeleteAll,
  ]);

  useEffect(() => {
    if (!chat_history?.length || (chat_history?.length === 1 && chat_history[0].id === WELCOME_MESSAGE_ID)) {
      setHasStarterBeenSent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat_history?.length]);

  useImperativeHandle(boxRef, () => ({
    onClear: onClickClearChat,
    mentionUser: content => {
      chatInput.current?.mentionUser(content);
    },
    stopAll: handleStopStreaming,
  }));
  const isSendingToUser = isMentioningEveryone || selectedUsers.length > 0;
  // Direct state management instead of useScrollUserInputEffect hook
  const [askingQuestionId, setAskingQuestionId] = useState();
  const questionItemRef = useRef();
  const [removeAttachment] = useRemoveAttachmentsMutation();
  const onRemoveAttachment = async (fileName, needToRemoveFromStorage) => {
    try {
      // If the attachment has been uploaded (has URL), call API to remove it from server
      if (activeConversation?.id) {
        await removeAttachment({
          projectId,
          conversationId: activeConversation.id,
          attachments: [{ name: fileName }],
          keep_in_storage: !needToRemoveFromStorage,
        }).unwrap();
      }
      if (attachments.length) {
        // Remove from local state
        const localIndex = attachments.findIndex(item => item.name === fileName);
        if (localIndex !== -1) {
          onDeleteAttachment?.(localIndex);
        }
      }
    } catch (error) {
      toastError(buildErrorMessage(error) || 'Failed to remove attachment');
    }
  };

  const onPredictStream = useCallback(
    async question => {
      // Before sending a new message, add any pending MCP server (that required auth) to ignored list
      // This handles the case where user sends a new message instead of clicking Continue
      // Only the last message can have actionRequired status
      const lastMessage = chat_history[chat_history.length - 1];
      const authRequiredAction = lastMessage?.toolActions?.find(
        action => action.status === ToolActionStatus.actionRequired,
      );
      const serverUrl = authRequiredAction?.toolOutputs?.server_url;
      if (serverUrl) {
        McpAuthHelpers.addIgnoredServer(serverUrl);
      }

      const participant = activeParticipant;
      const question_id = uuidv4(); // Use uuidv4 instead of useId hook
      const makeEventPayload = conversationUuid =>
        getPayload({ question, participant, question_id, conversationUuid, attachmentList: attachments });
      let newMessages = initializeNewMessages({
        question,
        question_id,
        participant,
        userId,
        name,
        avatar,
        isSendingToUser,
      });
      const initialConversationUuid = activeConversation?.uuid;
      let eventPayload = makeEventPayload(initialConversationUuid);

      // Prepare message data for onSend callback
      const messageData = {
        userInput: question,
        newMessages,
        eventPayload,
        needsConversationCreation: !activeConversation?.uuid && isAgentsPage,
        participant,
        question_id,
      };

      let sendResult = { success: true };
      if (onSend) {
        sendResult = await onSend(messageData);
        // If onSend returns an updated event payload, use it
        if (sendResult?.updatedEventPayload) {
          eventPayload = sendResult.updatedEventPayload;
          // Store the participant_id for subsequent messages (before React state update propagates)
          if (eventPayload.participant_id) {
            participantIdRef.current = eventPayload.participant_id;
          }
        }
        // Also store participant_id from returned activeParticipant (used by createOrUseConversation)
        if (sendResult?.activeParticipant?.id) {
          participantIdRef.current = sendResult.activeParticipant.id;
        }
        // If onSend returns updated messages (with correct participant IDs), use them
        if (sendResult?.updatedMessages) {
          newMessages = sendResult.updatedMessages;
        }
      }

      // Ensure participant_id is set even if activeParticipant.id is undefined
      // (can happen when React state update hasn't propagated yet)
      if (!eventPayload.participant_id && participantIdRef.current) {
        eventPayload.participant_id = participantIdRef.current;
      }

      const { success, messages, updatedAttachments } = await uploadAttachments({
        attachments,
        conversationId: activeConversation?.id || sendResult.createdConversation?.id || '',
        messages: newMessages,
      });
      if (success) {
        newMessages = messages;
        // Rebuild event payload with sanitized attachment names if they were updated
        if (updatedAttachments) {
          // Preserve participant_id from the existing eventPayload (which may have been set by onSend)
          // This is important when creating a new conversation with attachments, as onSend may create
          // the participant and return its ID in updatedEventPayload, which would otherwise be lost
          // when rebuilding the payload for sanitized attachments
          const existingParticipantId = eventPayload?.participant_id;
          const isNewConversationCreated = sendResult?.createdConversation && !activeConversation?.uuid;

          eventPayload = getPayload({
            question,
            participant,
            question_id,
            conversationUuid: activeConversation?.uuid || sendResult.createdConversation?.uuid,
            attachmentList: updatedAttachments,
          });

          // For agent chats with new conversation creation, always preserve the existing participant_id
          // to prevent "participant does not exist" errors when attachments are involved
          if (isAgentsPage && isNewConversationCreated && existingParticipantId) {
            eventPayload.participant_id = existingParticipantId;
          } else {
            // Restore participant_id if it was set but not included in the rebuilt payload
            if (existingParticipantId && !eventPayload.participant_id)
              eventPayload.participant_id = existingParticipantId;

            // Also fall back to stored participant_id ref if still undefined
            if (!eventPayload.participant_id && participantIdRef.current)
              eventPayload.participant_id = participantIdRef.current;
          }
        }
      } else {
        return;
      }

      // Continue with common logic if sending was successful
      if (sendResult?.success !== false) {
        setChatHistory(prevMessages => {
          return [...prevMessages, ...newMessages];
        });
        setAskingQuestionId(question_id);

        // Only set streaming info if not sending to users (captured before state is cleared)
        if (!isSendingToUser && participant?.entity_name !== 'user') {
          setStreamingInfo(question_id);
        }

        // Only emit if we have a conversation UUID (either existing or newly created)
        // Ensure conversation_uuid is properly set in the payload
        // Check multiple sources: eventPayload (may be set by onSend), sendResult.createdConversation (new conv), activeConversation (existing)
        const conversationUuid =
          eventPayload?.conversation_uuid ||
          sendResult?.createdConversation?.uuid ||
          activeConversation?.uuid;
        if (conversationUuid) {
          emit({ ...eventPayload, conversation_uuid: conversationUuid });
        }

        // If a brand-new conversation was just created and the user had set a custom steps_limit
        // before sending the first message, persist it to the conversation meta now.
        const newlyCreatedConversationId = sendResult?.createdConversation?.id;
        if (
          newlyCreatedConversationId &&
          !activeConversation?.id &&
          unsavedLLMSettings?.steps_limit !== undefined
        ) {
          conversationEdit({
            projectId,
            id: newlyCreatedConversationId,
            meta: { steps_limit: unsavedLLMSettings.steps_limit },
          });
        }

        onClearAttachments?.();
        chatInput.current?.reset();
        // Handle participant state changes
        if (participant?.entity_name === ChatParticipantType.Users) {
          onClearActiveParticipant(true);
        } else if (!participant) {
          setSelectedUsers([]);
          setIsMentioningEveryone(false);
          onClearActiveParticipant(true);
        }
      }
    },
    [
      activeConversation,
      activeParticipant,
      attachments,
      avatar,
      chat_history,
      conversationEdit,
      emit,
      getPayload,
      isAgentsPage,
      isSendingToUser,
      name,
      onClearActiveParticipant,
      onClearAttachments,
      onSend,
      projectId,
      setAskingQuestionId,
      setChatHistory,
      setIsMentioningEveryone,
      setSelectedUsers,
      setStreamingInfo,
      unsavedLLMSettings,
      uploadAttachments,
      userId,
    ],
  );

  const onCopyToClipboard = useCallback(
    id => async () => {
      const message = chat_history.find(item => item.id === id);
      if (message) {
        if (message.exception) {
          try {
            await navigator.clipboard.writeText(JSON.stringify(message.exception));
            toastSuccess('The exception has been copied to the clipboard');
          } catch {
            toastError('Failed to copy the exception!');
          }
        } else {
          // Handle different message types including images
          let contentToCopy;

          if (message.message_items) {
            contentToCopy = message.message_items
              .map(item => {
                switch (item.item_type) {
                  case 'canvas_message':
                    return item.item_details.latest_version?.canvas_content || '';
                  case 'attachment_message': {
                    // Handle attachment as link
                    const attachmentName = item.item_details.name || 'Attachment';
                    return `[${attachmentName}]`;
                  }
                  default:
                    return item.item_details.content || '';
                }
              })
              .join(', ');
          } else {
            contentToCopy = message.content || '';
          }

          try {
            await navigator.clipboard.writeText(contentToCopy);
            toastSuccess('The message has been copied to the clipboard');
          } catch {
            toastError('Failed to copy the message!');
          }
        }
      }
    },
    [chat_history, toastError, toastSuccess],
  );

  const onRegenerateAnswerStream = useCallback(
    (id, question, questionId) => async () => {
      const questionIndex = chat_history.findIndex(item => item.id === id) - 1;
      const theQuestion = question || chat_history[questionIndex]?.content;
      const question_id = questionId || chat_history[questionIndex]?.id;
      const leftChatHistory = chat_history.slice(0, questionIndex);
      const { participant_id } = chat_history.find(item => item.question_id === question_id) || {};
      const participant = getParticipantById(activeConversation, participant_id);

      const payload = getPayload({
        question: theQuestion,
        question_id,
        chatHistory: leftChatHistory,
        participant,
        attachmentList: [],
      });
      payload.payload.message_id = id;
      emit(payload);
    },
    [chat_history, activeConversation, getPayload, emit],
  );

  const onRegenerateAnswer = useCallback(
    (uuid, messageParticipant) => async () => {
      let prevMessage = {};
      setChatHistory(prevMessages => {
        prevMessage = prevMessages.find(message => message.id === uuid);
        return prevMessages.map(message =>
          message.id !== uuid
            ? message
            : {
                ...message,
                content: '',
                message_items: [],
                references: [],
                exception: undefined,
                toolActions: [],
                isRegenerating: true,
              },
        );
      });
      chatInput.current?.reset();
      const oldAnswer = chat_history.find(item => item.id === uuid);
      const questionIndex = chat_history.findIndex(item => item.id === oldAnswer?.question_id);
      const theQuestion =
        chat_history[questionIndex]?.message_items?.find(item => item.item_type === 'text_message')
          ?.item_details?.content || '';
      const attachmentList =
        (
          chat_history[questionIndex]?.message_items?.filter(
            item => item.item_type === 'attachment_message',
          ) || []
        ).map(i => ({ name: i.item_details.name })) || [];
      const question_id = chat_history[questionIndex]?.id;
      const leftChatHistory = chat_history.slice(0, questionIndex);

      const payload = getRegeneratePayload({
        question: theQuestion,
        question_id,
        participant: messageParticipant,
        chatHistory: leftChatHistory,
        attachmentList,
      });
      payload.message_id = uuid;
      payload.stream_id = uuid;
      setTimeout(() => {
        setStreamingInfo(question_id);
      }, 20);
      const { error: regenerateError } = await regenerate({
        ...payload,
        sid: socket?.id,
        projectId,
        id: uuid,
      });
      if (regenerateError) {
        setChatHistory(prevMessages => {
          return prevMessages.map(message => (message.id !== uuid ? message : { ...prevMessage }));
        });
      }
    },
    [setChatHistory, chat_history, getRegeneratePayload, setStreamingInfo, regenerate, socket?.id, projectId],
  );

  /**
   * Continue MCP execution - shared logic for both auth success and skip auth flows.
   * @param {string} messageId - The message ID to continue from
   * @param {boolean} addToIgnoreList - If true, adds the MCP server to ignore list (for "Continue" button)
   */
  const continueMcpExecution = useCallback(
    async (messageId, addToIgnoreList = false) => {
      const message = chat_history.find(item => item.id === messageId);
      const questionIndex = chat_history.findIndex(item => item.id === message?.question_id);
      const theQuestion =
        chat_history[questionIndex]?.message_items?.find(item => item.item_type === 'text_message')
          ?.item_details?.content || 'Continue';
      if (!message) {
        return;
      }

      // Only add to ignore list if user chose to skip auth (clicked "Continue")
      if (addToIgnoreList) {
        const authRequiredAction = message.toolActions?.find(
          action => action.status === ToolActionStatus.actionRequired,
        );
        const serverUrl = authRequiredAction?.toolOutputs?.server_url;
        if (serverUrl) {
          McpAuthHelpers.addIgnoredServer(serverUrl);
        }
      }

      const { question_id, threadId } = message;

      const payload = generateMcpContinuePayload({
        conversation_uuid: activeConversation?.uuid,
        projectId,
        message_id: messageId,
        thread_id: threadId,
        participants: activeConversation?.participants || [],
        question: theQuestion,
      });

      setChatHistory(prevMessages =>
        prevMessages.map(msg =>
          msg.id !== messageId
            ? msg
            : {
                ...msg,
                isLoading: true,
                isStreaming: true,
                toolActions: msg.toolActions?.filter(
                  action => action.status !== ToolActionStatus.actionRequired,
                ),
              },
        ),
      );

      setStreamingInfo(question_id);
      emitContinue(payload);
    },
    [chat_history, activeConversation, projectId, setChatHistory, setStreamingInfo, emitContinue],
  );

  /**
   * Continue execution after token limit interruption.
   * Sends a chat continue payload using the existing conversation, question, and participant context,
   * allowing the backend to resume the interrupted response without re-sending LLM settings.
   */
  const onContinueTokenLimitExecution = useCallback(
    async messageId => {
      const message = chat_history.find(item => item.id === messageId);
      const questionIndex = chat_history.findIndex(item => item.id === message?.question_id);
      const theQuestion =
        chat_history[questionIndex]?.message_items?.find(item => item.item_type === 'text_message')
          ?.item_details?.content || 'Continue';
      if (!message) {
        return;
      }

      const { question_id, threadId } = message;

      const payload = generateChatContinuePayload({
        conversation_uuid: activeConversation?.uuid,
        projectId,
        message_id: messageId,
        thread_id: threadId,
        participants: activeConversation?.participants || [],
        question: theQuestion,
      });

      // Update UI to show it's continuing and clear the confirmation state
      setChatHistory(prevMessages =>
        prevMessages.map(msg =>
          msg.id !== messageId
            ? msg
            : {
                ...msg,
                isLoading: true,
                isStreaming: true,
                // Clear requiresConfirmation state since user confirmed to continue
                requiresConfirmation: undefined,
              },
        ),
      );

      setStreamingInfo(question_id);
      emitContinue(payload);
    },
    [chat_history, activeConversation, projectId, setChatHistory, setStreamingInfo, emitContinue],
  );

  const onHitlResume = useCallback(
    async ({ action, value }) => {
      const lastMessage = pendingHitlMessage;
      if (!lastMessage) return;

      const { question_id, threadId, participant_id } = lastMessage;
      const participant = getParticipantById(activeConversation, participant_id);
      const editMessage =
        action === 'edit'
          ? createHitlEditUserMessage({
              question: value ?? '',
              userId,
              name,
              avatar,
              participant,
            })
          : null;

      const payload = generateChatContinuePayload({
        conversation_uuid: activeConversation?.uuid,
        projectId,
        message_id: lastMessage.id,
        thread_id: threadId,
        participants: activeConversation?.participants || [],
        question: action === 'edit' ? (value ?? '') : action,
      });

      payload.hitl_resume = true;
      payload.hitl_action = action;
      if (action === 'edit') {
        payload.hitl_value = value ?? '';
      }

      setHitlEditMode(false);

      setChatHistory(prevMessages => {
        const assistantIndex = prevMessages.findIndex(msg => msg.id === lastMessage.id);
        if (assistantIndex === -1) {
          return prevMessages;
        }

        const nextMessages = [...prevMessages];
        const assistantMessage = nextMessages[assistantIndex];
        const archivedAssistantMessage = createArchivedHitlAssistantMessage(assistantMessage);
        const resumedAssistantMessage = {
          ...assistantMessage,
          content: '',
          isLoading: true,
          isStreaming: true,
          isRegenerating: false,
          isSending: false,
          requiresConfirmation: undefined,
          exception: undefined,
          hitlInterrupt: undefined,
          references: [],
          toolActions: [],
          replyTo: editMessage ? { ...editMessage } : assistantMessage.replyTo,
          archivedFromHitl: false,
        };

        nextMessages.splice(assistantIndex, 1, archivedAssistantMessage);

        let insertionIndex = assistantIndex + 1;

        if (editMessage) {
          nextMessages.splice(insertionIndex, 0, editMessage);
          insertionIndex += 1;
        }

        nextMessages.splice(insertionIndex, 0, resumedAssistantMessage);
        return nextMessages;
      });

      setStreamingInfo(question_id);
      emitContinue(payload);
    },
    [
      pendingHitlMessage,
      activeConversation,
      projectId,
      userId,
      name,
      avatar,
      setChatHistory,
      setStreamingInfo,
      emitContinue,
    ],
  );

  useEffect(() => {
    if (!hasPendingHitlInterrupt && hitlEditMode) {
      setHitlEditMode(false);
    }
  }, [hasPendingHitlInterrupt, hitlEditMode]);

  const onHitlEditClick = useCallback(() => {
    if (!hasPendingHitlInterrupt) return;
    setHitlEditMode(true);
    setTimeout(() => {
      chatInput.current?.focus();
    }, 0);
  }, [hasPendingHitlInterrupt]);

  const onSendMessage = useCallback(
    async question => {
      if (hasPendingHitlInterrupt && !hitlEditMode) {
        return;
      }

      if (hitlEditMode) {
        await onHitlResume({ action: 'edit', value: question });
        chatInput.current?.reset();
        return;
      }

      return onPredictStream(question);
    },
    [hasPendingHitlInterrupt, hitlEditMode, onHitlResume, onPredictStream],
  );

  const { onKeyDown, isProcessingSymbols, query, stopProcessingSymbols } = useNewInputKeyDownHandler({
    disableHashtagDetection: isAgentsPage,
  });

  const onSelectParticipant = selectedParticipant => {
    const isSearchParticipant = isProcessingSymbols;
    stopProcessingSymbols();
    setTimeout(() => {
      onSelectThisParticipant(selectedParticipant);
      if (isSearchParticipant) {
        chatInput.current?.reset();
      }
    }, 0);
  };

  const onResendQuestionStream = useCallback(
    async (question_id, question) => {
      const leftChatHistory = chat_history.slice(
        0,
        chat_history.findIndex(item => item.id === question_id),
      );
      const { participant_id } = chat_history.find(item => item.id === question_id) || {};
      const participant = getParticipantById(activeConversation, participant_id);
      const payload = getPayload({
        question,
        question_id,
        chatHistory: leftChatHistory,
        participant,
        attachmentList: [],
      });
      emit(payload);
    },
    [chat_history, activeConversation, getPayload, emit],
  );

  const onSubmitEditedMessage = useCallback(
    (id, question) => {
      const { id: answerId } = chat_history.find(item => item.question_id === id) || {};
      setChatHistory(prev => prev.map(item => (item.id === id ? { ...item, content: question } : item)));
      answerId ? onRegenerateAnswerStream(answerId, question)() : onResendQuestionStream(id, question);
    },
    [chat_history, onRegenerateAnswerStream, onResendQuestionStream, setChatHistory],
  );

  const { onLoadMoreMessages, isLoadingMore } = useLoadMoreMessages({
    setChatHistory,
    activeConversation,
    toastError,
  });

  const onSendConversationStarter = useCallback(starter => {
    setHasStarterBeenSent(true);
    chatInput.current.reset();
    chatInput.current.setValue(starter);
  }, []);
  const { fetchOriginalDetails, isFetchingParticipant, fetchOriginalVersionDetails } =
    useFetchParticipantDetails();
  const users = useMemo(
    () => [
      ...(activeConversation?.participants
        ?.filter(participant => participant.entity_name === ChatParticipantType.Users)
        .map(participant => ({
          id: participant.id,
          name: participant.meta.user_name,
          participant,
        })) || []),
      {
        id: '@everyone',
        name: 'Everyone',
        participant: 'All users',
      },
    ],
    [activeConversation?.participants],
  );

  const [showRecommendationList, setShowRecommendationList] = useState(false);
  const [originalParticipant, setOriginalParticipant] = useState();

  useEffect(() => {
    setShowRecommendationList(false);
  }, [activeParticipant]);

  // todo: rewrite this to fetch details each time when activeParticipant changes
  useEffect(() => {
    // If activeParticipantDetails is provided, use it directly instead of fetching
    if (activeParticipantDetails && activeParticipant) {
      setOriginalParticipant({
        ...activeParticipantDetails,
        participantType: activeParticipant?.entity_name,
        agent_type: activeParticipant?.entity_settings?.agent_type,
      });
      return;
    }

    const fetchDetails = async () => {
      const details = await fetchOriginalDetails(
        activeParticipant?.entity_name,
        activeParticipant?.entity_meta.id,
        activeParticipant?.entity_meta.project_id,
      );
      if (
        activeParticipant.participantType !== ChatParticipantType.Datasources &&
        activeParticipant.participantType !== ChatParticipantType.Toolkits &&
        details?.version_details?.name !== LATEST_VERSION_NAME
      ) {
        const versionName = details.versions?.find(
          v => v.id === activeParticipant?.entity_settings?.version_id,
        )?.name;
        const versionDetails = await fetchOriginalVersionDetails(
          activeParticipant?.entity_name,
          activeParticipant?.entity_meta.id,
          activeParticipant?.entity_settings?.version_id,
          activeParticipant?.entity_meta.project_id,
          versionName,
        );
        setOriginalParticipant({
          ...details,
          participantType: activeParticipant?.entity_name,
          agent_type: activeParticipant?.entity_settings?.agent_type,
          version_details: { ...versionDetails },
        });
      } else {
        setOriginalParticipant({
          ...details,
          agent_type: activeParticipant?.entity_settings?.agent_type,
          participantType: activeParticipant?.entity_name,
        });
      }
    };
    if (
      (originalParticipant?.id !== activeParticipant?.entity_meta.id ||
        originalParticipant?.participantType !== activeParticipant?.entity_name) &&
      activeParticipant &&
      activeParticipant?.entity_name !== ChatParticipantType.Models &&
      activeParticipant?.entity_name !== ChatParticipantType.Users
    ) {
      fetchDetails();
    }
  }, [
    activeParticipant,
    fetchOriginalDetails,
    fetchOriginalVersionDetails,
    originalParticipant?.id,
    originalParticipant?.participantType,
    activeParticipantDetails,
  ]);

  const onMentionChange = useCallback(
    mentions => {
      const mentionedEveryone = mentions.find(mention => mention.user?.id === '@everyone');
      if (mentionedEveryone) {
        setIsMentioningEveryone(true);
        onClearActiveParticipant();
        setSelectedUsers([]);
      } else {
        const mentionedUsers = mentions.filter(mention => mention.isValid && mention.user);
        if (mentionedUsers.length > 0) {
          onClearActiveParticipant();
          setIsMentioningEveryone(false);
        } else {
          setIsMentioningEveryone(false);
        }
        setSelectedUsers(mentionedUsers);
      }
    },
    [onClearActiveParticipant],
  );

  const onShowParticipantsList = useCallback(() => {
    setShowRecommendationList(prev => !prev);
    stopProcessingSymbols();
  }, [stopProcessingSymbols]);

  const onSelectVersion = useCallback(
    async version => {
      const versionDetails = await fetchOriginalVersionDetails(
        activeParticipant?.entity_name,
        activeParticipant?.entity_meta.id,
        version.id,
        activeParticipant?.entity_meta.project_id,
        version.name,
      );

      onChangeParticipantSettings(
        {
          ...(activeParticipant || {}),
          entity_settings: {
            version_id: versionDetails.id,
            variables: versionDetails.variables,
            llm_settings: versionDetails.llm_settings || activeParticipant?.entity_settings.llm_settings,
            icon_meta: versionDetails.meta.icon_meta,
            ...(activeParticipant?.entity_name === 'application' &&
              versionDetails.agent_type && {
                agent_type: versionDetails.agent_type,
              }),
          },
        },
        true,
      );
      setOriginalParticipant(prev => ({
        ...prev,
        version_details: { ...versionDetails },
      }));
    },
    [activeParticipant, fetchOriginalVersionDetails, onChangeParticipantSettings],
  );

  const [updateChatLlmSettings, { isLoading: modelSettingsAreSaving }] =
    useUpdateParticipantLlmSettingsMutation();

  // Handler for updating LLM settings on conversation pages
  const handleSetLLMSettings = useCallback(
    async newSettings => {
      // Split steps_limit out — it lives in conversation meta, not in llm_settings
      const { [PROMPT_PAYLOAD_KEY.stepsLimit]: steps_limit, ...llmOnlySettings } = newSettings;

      if (isAgentsPage && onSetLLMSettings) {
        // Use prop handler for agents page — keep steps_limit in unsavedLLMSettings
        onSetLLMSettings(llmOnlySettings);
        setUnsavedLLMSettings?.(prev => ({ ...prev, ...newSettings }));
      } else if (activeConversation?.id) {
        // Update user LLM settings in conversation (excluding steps_limit)
        // Clean settings to remove reasoning_effort if model doesn't support it
        const cleanedSettings = cleanLLMSettings(llmOnlySettings, selectedModel);

        const result = await updateChatLlmSettings({
          projectId,
          conversationId: activeConversation.id,
          llm_settings: cleanedSettings,
        });
        if (result.error) {
          toastError('Failed to update llm settings: ' + buildErrorMessage(result.error));
        } else {
          setActiveConversation(prev => ({
            ...prev,
            participants: prev.participants.map(participant => {
              if (participant.entity_name === 'user' && participant.entity_meta.id === userId) {
                return {
                  ...result.data,
                };
              }
              return participant;
            }),
          }));
        }

        // Save steps_limit to conversation meta if it was provided
        if (steps_limit !== undefined) {
          const metaResult = await conversationEdit({
            projectId,
            id: activeConversation.id,
            meta: {
              ...(activeConversation.meta || {}),
              steps_limit,
            },
          });
          if (metaResult.error) {
            toastError('Failed to update steps limit: ' + buildErrorMessage(metaResult.error));
          } else {
            setActiveConversation(prev => ({
              ...prev,
              meta: { ...(prev.meta || {}), steps_limit },
            }));
          }
        }
      } else {
        // No active conversation yet (new chat before first message) — cache in unsaved settings
        setUnsavedLLMSettings?.(prev => ({ ...prev, ...newSettings }));
      }
    },
    [
      isAgentsPage,
      onSetLLMSettings,
      activeConversation?.id,
      activeConversation?.meta,
      setUnsavedLLMSettings,
      selectedModel,
      updateChatLlmSettings,
      projectId,
      toastError,
      setActiveConversation,
      userId,
      conversationEdit,
    ],
  );

  const onSelectModel = useCallback(
    async newModel => {
      if (isAgentsPage) {
        // For agents page, update the participant's llm_settings
        setSelectedModel(newModel);
        const newLLMSettings = {
          ...activeParticipant?.entity_settings.llm_settings,
          model_name: newModel.name,
          model_project_id: newModel.project_id,
          max_tokens: DEFAULT_MAX_TOKENS, // Reset max tokens to default when changing model
          temperature: DEFAULT_TEMPERATURE,
          // Only set reasoning_effort if the model supports it
          ...(newModel.supports_reasoning && { reasoning_effort: DEFAULT_REASONING_EFFORT }),
          // Preserve steps_limit — not model-specific
          steps_limit: activeParticipant?.entity_settings.llm_settings?.steps_limit ?? DEFAULT_STEPS_LIMIT,
        };

        if (!newModel.supports_reasoning) delete newLLMSettings.reasoning_effort;

        // Update Formik so Save button persists the new model
        if (onSetLLMSettings) {
          onSetLLMSettings(newLLMSettings);
        }

        // Update the participant's entity_settings.llm_settings
        onChangeParticipantSettings?.(activeParticipant.id, {
          entity_settings: {
            ...activeParticipant?.entity_settings,
            llm_settings: newLLMSettings,
          },
        });

        // Store in unsaved settings to be used when sending messages
        setUnsavedLLMSettings?.(prev => ({ ...prev, ...newLLMSettings }));
      } else {
        // Original behavior for regular chat
        setSelectedModel(newModel);
        const userSettings = NewConversationHelpers.getChatUserSettings(activeConversation, userId);
        if (activeConversation?.id) {
          const llmSettingsPayload = {
            ...userSettings,
            model_name: newModel.name,
            model_project_id: newModel.project_id,
            max_tokens: DEFAULT_MAX_TOKENS, // Reset max tokens to default when changing model
            temperature: DEFAULT_TEMPERATURE,
            ...(newModel.supports_reasoning && { reasoning_effort: DEFAULT_REASONING_EFFORT }),
            // steps_limit is stored in conversation meta — do not touch it here
          };

          if (!newModel.supports_reasoning) delete llmSettingsPayload.reasoning_effort;

          const result = await updateChatLlmSettings({
            projectId,
            conversationId: activeConversation?.id,
            llm_settings: llmSettingsPayload,
          });
          if (result.error) {
            toastError('Failed to update llm settings: ' + buildErrorMessage(result.error));
          } else {
            setActiveConversation(prev => ({
              ...prev,
              participants: prev.participants.map(participant => {
                if (participant.entity_name === 'user' && participant.entity_meta.id === userId) {
                  return {
                    ...result.data,
                  };
                }
                return participant;
              }),
            }));
          }
        }
      }
    },
    [
      isAgentsPage,
      onSetLLMSettings,
      onChangeParticipantSettings,
      activeParticipant?.entity_settings,
      activeParticipant?.id,
      activeConversation,
      userId,
      updateChatLlmSettings,
      projectId,
      toastError,
      setActiveConversation,
      setUnsavedLLMSettings,
    ],
  );

  const onChangeVariables = useCallback(
    newVariables => {
      onChangeParticipantSettings(
        {
          ...(activeParticipant || {}),
          entity_settings: {
            ...activeParticipant?.entity_settings,
            variables: [...newVariables],
          },
        },
        true,
      );
    },
    [activeParticipant, onChangeParticipantSettings],
  );

  const onShowMenu = useCallback(() => {
    setShowRecommendationList(false);
    stopProcessingSymbols();
  }, [stopProcessingSymbols]);

  useEffect(() => {
    return () => {
      stopProcessingSymbols();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAgentsPage) {
      setHasStarterBeenSent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParticipant]);

  const styles = chatBoxStyles();
  const displayConversationStarters = !isProcessingSymbols && conversationStarters?.length > 0;

  const isInputLoading = useMemo(
    () =>
      isLoadingConversation ||
      isFetchingParticipant ||
      modelSettingsAreSaving ||
      isUploadingAttachments ||
      isUpdatingInternalToolsConfig ||
      activeConversation?.isSending,
    [
      isLoadingConversation,
      isFetchingParticipant,
      modelSettingsAreSaving,
      isUploadingAttachments,
      isUpdatingInternalToolsConfig,
      activeConversation?.isSending,
    ],
  );

  const isActiveParticipantBroken = useMemo(() => {
    if (!activeParticipant) return false;
    if (activeParticipant.entity_meta?.project_id != PUBLIC_PROJECT_ID) return false;
    const versions = activeParticipantDetails?.versions;
    if (!versions) return false;
    return !versions.some(v => v.id === activeParticipant.entity_settings?.version_id);
  }, [activeParticipant, activeParticipantDetails?.versions]);

  const isInputDisabled = useMemo(
    () =>
      isLoadingConversation ||
      isProcessingSymbols ||
      isFetchingParticipant ||
      isUploadingAttachments ||
      isUpdatingInternalToolsConfig ||
      activeConversation?.isSending ||
      (hasPendingHitlInterrupt && !hitlEditMode) ||
      isStreamingNow ||
      isActiveParticipantBroken,
    [
      isLoadingConversation,
      isProcessingSymbols,
      isFetchingParticipant,
      isUploadingAttachments,
      isUpdatingInternalToolsConfig,
      activeConversation?.isSending,
      hasPendingHitlInterrupt,
      hitlEditMode,
      isStreamingNow,
      isActiveParticipantBroken,
    ],
  );

  const shouldDisableSwitchingParticipant = useMemo(
    () => isMentioningEveryone || selectedUsers.length > 0 || isStreamingNow || isUploadingAttachments,
    [isMentioningEveryone, selectedUsers.length, isStreamingNow, isUploadingAttachments],
  );

  if (hidden) return null;

  return (
    <>
      <ChatBodyContainer sx={styles.container}>
        <ChatMessageList
          sx={messageListSX}
          chat_history={chat_history}
          isLoading={isStreaming}
          isStreaming={isStreaming}
          activeConversation={activeConversation}
          onCopyToClipboard={onCopyToClipboard}
          onDeleteAnswer={onDeleteAnswer}
          onRegenerateAnswer={onRegenerateAnswer}
          onContinueMcpExecution={continueMcpExecution}
          onContinueTokenLimitExecution={onContinueTokenLimitExecution}
          onHitlResume={onHitlResume}
          onHitlEditClick={onHitlEditClick}
          onEditCanvas={onEditCanvas}
          selectedCodeBlockInfo={selectedCodeBlockInfo}
          onSubmitEditedMessage={onSubmitEditedMessage}
          onScrollToTop={onLoadMoreMessages}
          onSelectParticipant={onSelectParticipant}
          isLoadingMore={isLoadingMore}
          interaction_uuid={interaction_uuid}
          askingQuestionId={askingQuestionId}
          questionItemRef={questionItemRef}
          onRemoveAttachment={onRemoveAttachment}
          hideContinueButton={isAgentsPage}
          hideHitlActions={hitlEditMode}
          onOpenArtifactPreview={onOpenArtifactPreview}
        />
        {displayConversationStarters && (
          <ChatConversationStarters
            onSend={onSendConversationStarter}
            conversation_starters={hasStarterBeenSent || isTheUserChattingNow ? [] : conversationStarters}
          />
        )}
        <Box sx={hitlEditMode ? styles.inputWrapperHitl : styles.inputWrapper}>
          {hitlEditMode && (
            <Box sx={styles.hitlInfoBanner}>
              <InfoIcon sx={styles.hitlInfoIcon} />
              <Box
                component="span"
                sx={styles.hitlInfoText}
              >
                Enter your message to proceed.
              </Box>
            </Box>
          )}
          {showRecommendationList && (
            <RecommendationList
              onSelectParticipant={onSelectParticipant}
              existingParticipants={activeConversation?.participants || []}
              onClose={onShowParticipantsList}
            />
          )}
          {enableMentions && !!query?.slice(1) && (
            <SearchResultList
              query={query ? query.slice(1) : ''}
              onSelectParticipant={onSelectParticipant}
              stopProcessingSymbols={stopProcessingSymbols}
              existingParticipants={activeConversation?.participants || []}
              onClose={event => {
                if (event.target.innerHTML !== query) stopProcessingSymbols();
              }}
            />
          )}
          <NewChatInput
            placeholder={inputPlaceholder}
            ref={chatInput}
            onSend={onSendMessage}
            isLoading={isInputLoading}
            disabledSend={isInputDisabled}
            onNormalKeyDown={onKeyDown}
            shouldHandleEnter
            tooltipOfSendButton=""
            onShowParticipantsList={onShowParticipantsList}
            selectedVersionId={activeParticipant?.entity_settings?.version_id}
            onSelectVersion={onSelectVersion}
            variables={
              activeParticipant?.entity_settings.variables ||
              originalParticipant?.version_details?.variables ||
              []
            }
            onChangeVariables={onChangeVariables}
            activeParticipant={activeParticipant}
            activeParticipantDetails={originalParticipant}
            modelList={modelsData?.items || []}
            onSelectModel={onSelectModel}
            selectedModel={selectedModel}
            selectSavedOrDefaultModel={selectSavedOrDefaultModel}
            isStreaming={isStreamingNow}
            onStopGeneration={handleStopStreaming}
            disableSwitchingParticipant={shouldDisableSwitchingParticipant}
            users={users}
            onMentionChange={onMentionChange}
            isEditingAgent={isEditingAgent}
            onShowAgentEditor={onShowAgentEditor}
            onShowPipelineEditor={onShowPipelineEditor}
            onCloseAgentEditor={onCloseAgentEditor}
            onClosePipelineEditor={onClosePipelineEditor}
            isEditorDirty={isEditorDirty}
            onShowVersionChangeAlert={onShowVersionChangeAlert}
            onRefreshParticipantDetails={onRefreshParticipantDetails}
            onShowMenu={onShowMenu}
            isAgentsPage={isAgentsPage}
            llmSettings={conversationLlmSettings}
            onSetLLMSettings={handleSetLLMSettings}
            showWebhookSecret={showWebhookSecret}
            showStepsLimit={!isAgentsPage}
            //Attachments
            onHandleAttachment={onHandleAttachment}
            onAttachFiles={onAttachFiles}
            attachments={attachments}
            onDeleteAttachment={onDeleteAttachment}
            disableAttachments={disableAttachments}
            hideAttachments={hideAttachments}
            isUploadingAttachments={isUploadingAttachments}
            uploadProgress={uploadProgress}
            clearInputAfterSubmit={false}
            //internal tools config
            onInternalToolsConfigChange={onInternalToolsConfigChange}
            internal_tools={activeConversation?.meta?.internal_tools || []}
            projectId={projectId}
          />
        </Box>
      </ChatBodyContainer>
      <AlertDialog
        title="Warning"
        alertContent={alertContent}
        open={openAlert}
        alarm
        onClose={onCloseAlert}
        onCancel={onCloseAlert}
        onConfirm={onConfirmDelete}
      />
    </>
  );
});

ChatBox.displayName = 'ChatBox';

/** @type {MuiSx} */
const chatBoxStyles = () => ({
  container: ({ breakpoints }) => ({
    [breakpoints.up('lg')]: {
      height: 'calc(100vh - 10rem)',
    },
    [breakpoints.down('lg')]: {
      height: '100vh !important',
    },
  }),
  inputWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0.5rem 0.5rem 0.5rem',
    gap: '0.5rem',
  },
  inputWrapperHitl: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0.5rem 0.5rem 0.5rem',
    gap: '0.5rem',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.background.userInputBorderDark}`,
    boxShadow: `0 0 0 0.125rem ${palette.background.userInputBorderShadow}`,
  }),
  hitlInfoBanner: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 0.75rem',
    color: palette.info.main,
    borderRadius: '0.625rem',
    background: palette.background.info,
    border: `0.0625rem solid ${palette.info.main}`,
  }),
  hitlInfoIcon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
  hitlInfoText: {
    fontSize: '0.8125rem',
    lineHeight: '1.25rem',
  },
});

export default ChatBox;
