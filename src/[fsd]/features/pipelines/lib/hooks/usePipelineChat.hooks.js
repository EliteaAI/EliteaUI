import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useMatch } from 'react-router-dom';

import { ChatHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { alitaApi } from '@/api/alitaApi';
import {
  useConversationCreateMutation,
  useConversationDetailsQuery,
  useDeleteAllMessagesFromConversationMutation,
  useDeleteMessageFromConversationMutation,
  useStopChatTaskMutation,
} from '@/api/chat';
import { ROLES, WELCOME_MESSAGE_ID, sioEvents } from '@/common/constants';
import { convertConversationToChatHistory } from '@/common/convertChatConversationMessages';
import { buildErrorMessage } from '@/common/utils';
import { useChatMessageDeleteSocket, useChatMessageSyncSocket } from '@/components/Chat/hooks';
import useAgentAttachments from '@/hooks/application/useAgentAttachments';
import useApplicationChatSwitchVersion from '@/hooks/application/useApplicationChatSwitchVersion';
import useSynAgentChatMessage from '@/hooks/application/useSynAgentChatMessage';
import useStreamingNavBlocker from '@/hooks/chat/useStreamingNavBlocker';
import { useManualSocket } from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

/**
 * Custom hook for managing pipeline chat functionality
 * Encapsulates conversation creation, socket handling, and state management
 * for pipeline pages (Configuration tab)
 */
export const usePipelineChat = ({
  pipelineId,
  pipelineName,
  pipelineVersionDetails,
  projectId,
  setFieldValue,
  currentLLMSettings = {},
  deleteAllRunNodes,
  restoredConversationID = null,
  onRestoreConversationComplete,
}) => {
  const isCreating = useMatch({ path: RouteDefinitions.CreatePipeline });

  const [activeConversation, setActiveConversation] = useState(null);
  const [activeParticipant, setActiveParticipant] = useState(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isRestoringConversation, setIsRestoringConversation] = useState(false);
  const [hasRestoredConversation, setHasRestoredConversation] = useState(false);

  const [deleteMessage, { reset: resetDeleteMessage }] = useDeleteMessageFromConversationMutation();
  const [deleteAllMessages, { reset: resetDeleteAll }] = useDeleteAllMessagesFromConversationMutation();
  const { toastError, toastInfo } = useToast();
  const chatHistoryRef = useRef([]);

  const {
    data: restoredConversationData,
    isLoading: isLoadingRestoredConversation,
    isError: isErrorRestoredConversation,
  } = useConversationDetailsQuery(
    {
      projectId,
      id: restoredConversationID,
    },
    {
      skip: !restoredConversationID || !projectId,
      refetchOnMountOrArgChange: true,
    },
  );
  const { attachments, onAttachFiles, onDeleteAttachment, disableAttachments, onClearAttachments } =
    useAgentAttachments({ agentVersionDetails: pipelineVersionDetails });
  useApplicationChatSwitchVersion({
    activeParticipant,
    activeConversation,
    applicationVersionDetails: pipelineVersionDetails,
    projectId,
    setActiveParticipant,
  });

  // Stop streaming functionality
  const [stopChatTask] = useStopChatTaskMutation();

  // Streaming state management - more robust detection
  const isStreaming = useMemo(
    () =>
      activeConversation?.chat_history?.some(msg => msg.isStreaming || msg.isLoading || msg.isRegenerating) ||
      false,
    [activeConversation?.chat_history],
  );

  useStreamingNavBlocker(isStreaming);

  // Conversation creation mutation and socket handlers
  const [createConversation, { isLoading: isLoadingConversation }] = useConversationCreateMutation();
  const { emit: emitEnterRoom } = useManualSocket(sioEvents.chat_enter_room);
  const { emit: emitLeaveRoom } = useManualSocket(sioEvents.chat_leave_rooms);

  // Create pipeline participant from current pipeline data
  const pipelineParticipant = useMemo(() => {
    if (!pipelineId || !pipelineVersionDetails) return null;

    return {
      id: pipelineId,
      entity_name: 'application',
      entity_meta: {
        id: pipelineId,
        name: pipelineName,
        project_id: projectId,
      },
      entity_settings: {
        variables: pipelineVersionDetails.variables || [],
        instructions: pipelineVersionDetails.instructions,
        tools: pipelineVersionDetails.tools,
        version_id: pipelineVersionDetails.id,
        icon_meta: pipelineVersionDetails.meta?.icon_meta || {},
        ...(pipelineVersionDetails.agent_type && {
          agent_type: pipelineVersionDetails.agent_type,
        }),
      },
      meta: {
        name: pipelineName,
      },
    };
  }, [pipelineId, pipelineName, pipelineVersionDetails, projectId]);

  // Restore conversation effect
  useEffect(() => {
    if (
      restoredConversationID &&
      restoredConversationData &&
      !isLoadingRestoredConversation &&
      !isErrorRestoredConversation &&
      !isRestoringConversation
    ) {
      setIsRestoringConversation(true);

      const convertedChatHistory = convertConversationToChatHistory(restoredConversationData);

      const restoredConversation = {
        ...restoredConversationData,
        chat_history: convertedChatHistory,
        isPipelineChat: true,
      };

      // Find the pipeline participant from the restored conversation
      const restoredPipelineParticipant = restoredConversationData.participants?.find(
        p => p.entity_name === 'application',
      );

      if (restoredPipelineParticipant) {
        setActiveConversation(restoredConversation);
        setActiveParticipant(restoredPipelineParticipant);

        chatHistoryRef.current = convertedChatHistory;

        emitEnterRoom({
          conversation_id: restoredConversationData.id,
          conversation_uuid: restoredConversationData.uuid,
          project_id: projectId,
        });

        toastInfo('Conversation restored successfully');
        setHasRestoredConversation(true);
      } else {
        toastError('Could not find pipeline participant in restored conversation');
      }

      onRestoreConversationComplete();
      setIsRestoringConversation(false);
    }
  }, [
    restoredConversationID,
    restoredConversationData,
    isLoadingRestoredConversation,
    isErrorRestoredConversation,
    isRestoringConversation,
    emitEnterRoom,
    projectId,
    toastInfo,
    toastError,
    onRestoreConversationComplete,
  ]);

  // Handle restoration errors
  useEffect(() => {
    if (restoredConversationID && isErrorRestoredConversation && !isLoadingRestoredConversation) {
      toastError('Failed to restore conversation');
      setIsRestoringConversation(false);

      onRestoreConversationComplete();
    }
  }, [
    restoredConversationID,
    isErrorRestoredConversation,
    isLoadingRestoredConversation,
    toastError,
    onRestoreConversationComplete,
  ]);

  // Initialize conversation when participant is ready (only if not restoring)
  useEffect(() => {
    if (
      pipelineParticipant &&
      !activeConversation &&
      !isCreatingConversation &&
      !restoredConversationID &&
      !isRestoringConversation &&
      pipelineName
    ) {
      setIsCreatingConversation(true);

      // Create a basic conversation structure for pipeline chat
      const newConversation = {
        name: `Chat with ${pipelineName}`,
        is_private: true,
        source: 'pipeline',
        participants: [pipelineParticipant],
        chat_history: [],
        isNew: true,
        isPipelineChat: true,
      };

      // Set the conversation and participant directly
      setActiveConversation(newConversation);

      setActiveParticipant(pipelineParticipant);
      setHasRestoredConversation(false);
      setIsCreatingConversation(false);
    }
  }, [
    pipelineParticipant,
    activeConversation,
    isCreatingConversation,
    pipelineName,
    restoredConversationID,
    isRestoringConversation,
  ]);

  // Keep conversation participants in sync with pipelineParticipant when version changes
  useEffect(() => {
    if (!pipelineParticipant) return;

    setActiveConversation(prev => {
      if (!prev) return prev;

      const hasExistingPipelineParticipant = prev.participants?.some(p => p.entity_name === 'application');

      if (!hasExistingPipelineParticipant) return prev;

      const updatedParticipants = prev.participants.map(p =>
        p.entity_name === 'application' ? pipelineParticipant : p,
      );

      return {
        ...prev,
        participants: updatedParticipants,
      };
    });
  }, [pipelineParticipant]);

  // Handle conversation creation when first message is sent
  const handleCreateConversationOnFirstMessage = useCallback(
    async messageData => {
      try {
        const {
          userInput,
          newMessages,
          question_id,
          eventPayload: { attachments_info, mcp_tokens, ignored_mcp_servers } = {},
        } = messageData;

        // Create conversation via API
        const result = await createConversation({
          is_private: true,
          name: `Chat with ${pipelineName}`,
          source: 'pipeline',
          meta: {
            single_participant: pipelineParticipant,
            internal_tools: pipelineVersionDetails?.meta?.internal_tools,
          },
          participants: [pipelineParticipant],
          projectId,
        });

        if (result.data) {
          // Attachments are now handled via internal tools auto-injection
          // No need to manually set attachment storage or create attachment artifact
          const createdConversation = {
            ...result.data,
            chat_history: [], // Don't set chat history here, ChatBox will handle it
            isPipelineChat: true,
            participants: result.data.participants || [],
          };

          // Update the conversation with real UUID from backend
          setActiveConversation(createdConversation);

          // Find the pipeline participant from the created conversation
          const pipelineParticipantFromBackend = result.data.participants?.find(
            p => p.entity_name === 'application',
          );

          // Update the active participant with the backend-assigned participant
          if (pipelineParticipantFromBackend) {
            setActiveParticipant(pipelineParticipantFromBackend);
          }

          // Join the conversation room
          emitEnterRoom({
            conversation_id: result.data.id,
            conversation_uuid: result.data.uuid,
            project_id: projectId,
          });

          // Update the messages with correct participant IDs
          const updatedMessages = newMessages.map(msg => ({
            ...msg,
            participant_id:
              msg.role === ROLES.User
                ? msg.participant_id
                : pipelineParticipantFromBackend?.id || pipelineParticipant.id,
          }));

          // Return updated event payload with correct conversation UUID and participant ID
          const updatedEventPayload = {
            user_input: userInput,
            // Preserve llm_settings from event payload if provided (from unsavedLLMSettings)
            // Otherwise fall back to pipelineVersionDetails or currentLLMSettings
            llm_settings: messageData.eventPayload?.llm_settings || {
              model_name: pipelineVersionDetails?.llm_settings?.model_name || currentLLMSettings.model_name,
              model_project_id:
                pipelineVersionDetails?.llm_settings?.model_project_id ||
                currentLLMSettings.model_project_id ||
                projectId,
            },
            project_id: projectId,
            conversation_uuid: result.data.uuid,
            question_id,
            participant_id: pipelineParticipantFromBackend?.id || pipelineParticipant.id,
            attachments_info,
            mcp_tokens,
            ignored_mcp_servers,
          };

          // Return success with updated payload, conversation, and participant for ChatBox
          return {
            success: true,
            updatedEventPayload,
            createdConversation,
            activeParticipant: pipelineParticipantFromBackend || pipelineParticipant,
            updatedMessages,
          };
        } else {
          toastError('Failed to create conversation');
          return { success: false };
        }
      } catch (error) {
        toastError('Failed to create conversation');

        // eslint-disable-next-line no-console
        console.error('Conversation creation error:', error);
        return { success: false };
      }
    },
    [
      createConversation,
      pipelineName,
      pipelineParticipant,
      projectId,
      emitEnterRoom,
      pipelineVersionDetails?.llm_settings?.model_name,
      pipelineVersionDetails?.llm_settings?.model_project_id,
      currentLLMSettings.model_name,
      currentLLMSettings.model_project_id,
      toastError,
      pipelineVersionDetails?.meta?.internal_tools,
    ],
  );

  // Handle conversation creation when first message is sent
  const handleMessage = useCallback(
    async messageData => {
      try {
        const { eventPayload } = messageData;
        if (!eventPayload.llm_settings?.model_name) {
          // Return updated event payload with llm_settings from pipelineVersionDetails or currentLLMSettings
          // only if they weren't provided in the event payload
          const updatedEventPayload = {
            ...eventPayload,
            llm_settings: eventPayload.llm_settings || {
              model_name: pipelineVersionDetails?.llm_settings?.model_name || currentLLMSettings.model_name,
              model_project_id:
                pipelineVersionDetails?.llm_settings?.model_project_id ||
                currentLLMSettings.model_project_id ||
                projectId,
            },
          };

          // Return success with updated payload, conversation, and participant for ChatBox
          return {
            success: true,
            updatedEventPayload,
          };
        }
      } catch (error) {
        toastError('Failed to create conversation');

        // eslint-disable-next-line no-console
        console.error('Conversation creation error:', error);
        return { success: false };
      }
      return { success: true };
    },
    [
      projectId,
      pipelineVersionDetails?.llm_settings?.model_name,
      pipelineVersionDetails?.llm_settings?.model_project_id,
      currentLLMSettings.model_name,
      currentLLMSettings.model_project_id,
      toastError,
    ],
  );

  // Set up chat history state management
  const setChatHistory = useCallback(chat_history => {
    if (typeof chat_history === 'function') {
      setActiveConversation(prev => {
        const updated = prev ? { ...prev, chat_history: chat_history(prev?.chat_history || []) } : prev;
        chatHistoryRef.current = updated?.chat_history || [];
        return updated;
      });
    } else {
      setActiveConversation(prev => {
        const updated = prev ? { ...prev, chat_history } : prev;
        chatHistoryRef.current = updated?.chat_history || [];
        return updated;
      });
    }
  }, []);

  useEffect(() => {
    if (restoredConversationID || hasRestoredConversation) return;
    if (!pipelineVersionDetails || !pipelineParticipant?.id) return;

    setChatHistory(prev => {
      const hasWelcomeMessage = prev.length && prev[0].id === WELCOME_MESSAGE_ID;

      if (pipelineVersionDetails?.welcome_message) {
        const welcomeMessage = ChatHelpers.getWelcomeMessage(
          pipelineVersionDetails.welcome_message,
          pipelineParticipant.id,
        );

        if (hasWelcomeMessage) {
          return [welcomeMessage, ...prev.slice(1)];
        } else {
          return [welcomeMessage, ...prev];
        }
      } else {
        if (hasWelcomeMessage) return prev.slice(1);

        return prev;
      }
    });
  }, [
    pipelineVersionDetails,
    pipelineVersionDetails?.welcome_message,
    pipelineVersionDetails?.id,
    pipelineParticipant?.id,
    restoredConversationID,
    hasRestoredConversation,
    setChatHistory,
  ]);

  // Update chatHistoryRef when conversation changes
  useEffect(() => {
    chatHistoryRef.current = activeConversation?.chat_history || [];
  }, [activeConversation?.chat_history]);

  // Stop streaming functionality
  const onStopStreaming = useCallback(
    message => async () => {
      const { id: streamId, task_id } = message;

      if (task_id && streamId) await stopChatTask({ projectId, messageGroupUuid: streamId });

      emitLeaveRoom([streamId]);

      setTimeout(
        () =>
          setChatHistory?.(prevState =>
            prevState.map(msg => ({
              ...msg,
              isStreaming: msg.id === streamId ? false : msg.isStreaming,
              isLoading: msg.id === streamId ? false : msg.isLoading,
              task_id: msg.id === streamId ? undefined : msg.task_id,
            })),
          ),
        200,
      );
    },
    [emitLeaveRoom, projectId, setChatHistory, stopChatTask],
  );

  const onStopAll = useCallback(async () => {
    const streamIds = chatHistoryRef.current
      .filter(
        message =>
          message.role !== ROLES.User && (message.isStreaming || message.isLoading || message.isRegenerating),
      )
      .map(message => message.id);
    const messagesWithTaskId = chatHistoryRef.current.filter(
      message =>
        message.role !== ROLES.User &&
        message.task_id &&
        (message.isStreaming || message.isLoading || message.isRegenerating),
    );

    messagesWithTaskId.forEach(async message => {
      const { task_id } = message;
      if (task_id && message?.id) {
        await stopChatTask({ projectId, messageGroupUuid: message.id });
      }
    });

    if (streamIds?.length) {
      emitLeaveRoom(streamIds);
    }

    setTimeout(
      () =>
        setChatHistory?.(prevState =>
          prevState.map(msg => ({
            ...msg,
            isStreaming: false,
            isLoading: false,
            isRegenerating: false,
            task_id: undefined,
          })),
        ),
      200,
    );
  }, [chatHistoryRef, emitLeaveRoom, projectId, setChatHistory, stopChatTask]);

  // Clear messages handler
  const resetChatHistory = useCallback(async () => {
    if (activeConversation?.chat_history?.length) {
      const initialChatHistory =
        pipelineVersionDetails?.welcome_message && pipelineParticipant?.id
          ? [ChatHelpers.getWelcomeMessage(pipelineVersionDetails.welcome_message, pipelineParticipant.id)]
          : [];

      setActiveConversation(prev =>
        prev ? { ...prev, chat_history: initialChatHistory, uuid: undefined, id: undefined } : prev,
      );
    }
  }, [
    activeConversation?.chat_history?.length,
    pipelineVersionDetails?.welcome_message,
    pipelineParticipant?.id,
  ]);

  // Delete single message handler
  const onDeleteMessage = useCallback(
    async (messageIdToDelete, callback) => {
      const result = await deleteMessage({
        conversationId: activeConversation?.id,
        projectId,
        id: messageIdToDelete,
      });
      if (!result.error) {
        setChatHistory(prevMessages => {
          const updatedMessages = prevMessages.filter(msg => msg.id !== messageIdToDelete);
          callback?.();
          return updatedMessages;
        });
        toastInfo('The message has been deleted');
        resetDeleteMessage();
      } else {
        toastError(buildErrorMessage(result.error) || 'Failed to delete the message, please try again.');
      }
    },
    [
      activeConversation?.id,
      deleteMessage,
      projectId,
      resetDeleteMessage,
      setChatHistory,
      toastError,
      toastInfo,
    ],
  );

  // Delete all messages handler
  const onDeleteAllMessages = useCallback(
    async callback => {
      await onStopAll();
      const result = await deleteAllMessages({
        projectId,
        conversationId: activeConversation?.id,
      });
      if (!result.error) {
        await onStopAll();
        const initialChatHistory =
          pipelineVersionDetails?.welcome_message && pipelineParticipant?.id
            ? [ChatHelpers.getWelcomeMessage(pipelineVersionDetails.welcome_message, pipelineParticipant.id)]
            : [];

        setActiveConversation({
          name: `Chat with ${pipelineName}`,
          is_private: true,
          source: 'pipeline',
          participants: [pipelineParticipant],
          chat_history: initialChatHistory,
          isNew: true,
          isPipelineChat: true,
        });
        callback?.();
        resetDeleteAll();
      } else {
        toastError(buildErrorMessage(result.error) || 'Failed to clear the chat messages, please try again.');
      }
    },
    [
      activeConversation?.id,
      deleteAllMessages,
      onStopAll,
      pipelineName,
      pipelineParticipant,
      pipelineVersionDetails?.welcome_message,
      projectId,
      resetDeleteAll,
      toastError,
    ],
  );

  // Handler for updating participant settings (for pipeline page)
  const onChangeParticipantSettings = useCallback(
    (participantId, updates) => {
      if (!participantId && !isCreating) {
        return; // Skip updating model on initial settings if the pipeline details is not fully loaded
      }
      if (updates.entity_settings?.llm_settings && setFieldValue) {
        // Update the pipeline's llm_settings in Formik
        Object.entries(updates.entity_settings.llm_settings).forEach(([key, value]) => {
          setFieldValue(`version_details.llm_settings.${key}`, value);
        });
      }
    },
    [isCreating, setFieldValue],
  );

  // LLM Settings setter for the modal dialog
  const onSetLLMSettings = useCallback(
    newSettings => {
      if (setFieldValue) {
        // Update each setting individually
        Object.entries(newSettings).forEach(([key, value]) => {
          setFieldValue(`version_details.llm_settings.${key}`, value);
        });
      }
    },
    [setFieldValue],
  );

  // Handle messages sent from ChatBox
  const onSend = useCallback(
    async messageData => {
      const { needsConversationCreation } = messageData;

      // If conversation needs to be created (first message in pipeline page)
      if (needsConversationCreation && !activeConversation?.id) {
        const result = await handleCreateConversationOnFirstMessage(messageData);
        return result; // Returns { success: boolean, updatedEventPayload?: object }
      }
      // For existing conversations, just return success to proceed with normal flow
      return handleMessage(messageData);
    },
    [activeConversation?.id, handleMessage, handleCreateConversationOnFirstMessage],
  );

  // No-op handlers for pipeline chat
  const onSelectThisParticipant = () => {};
  const onClearActiveParticipant = () => {};

  const { onRemoteChatMessageSync } = useSynAgentChatMessage({ activeConversation, setActiveConversation });
  useChatMessageSyncSocket({
    onRemoteChatMessageSync,
  });

  const onRemoteDeleteMessage = useCallback(
    id => {
      setChatHistory(prev => prev.filter(message => message.id != id));
    },
    [setChatHistory],
  );
  useChatMessageDeleteSocket({ onRemoteDeleteMessage });

  useEffect(() => {
    if (activeConversation?.chat_history?.length) resetChatHistory();

    deleteAllRunNodes?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineVersionDetails?.id]);

  // When streaming transitions from true to false, invalidate context status cache via TAG_TYPE_CONVERSATION_DETAILS tag
  const dispatch = useDispatch();
  const prevIsStreamingRef = useRef(isStreaming);
  useEffect(() => {
    // When streaming transitions from true to false, invalidate cache
    if (prevIsStreamingRef.current === true && isStreaming === false && activeConversation?.id) {
      // Invalidate context status cache to refetch updated token counts
      dispatch(
        alitaApi.util.invalidateTags([{ type: 'TAG_TYPE_CONVERSATION_DETAILS', id: activeConversation.id }]),
      );
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, activeConversation?.id, dispatch]);

  return {
    // State
    activeConversation,
    activeParticipant,
    isCreatingConversation,
    isStreaming,
    isLoadingConversation: isLoadingConversation || isLoadingRestoredConversation || isRestoringConversation,

    // Handlers
    setChatHistory,
    setActiveConversation,
    onDeleteMessage,
    onDeleteAllMessages,
    onChangeParticipantSettings,
    onSetLLMSettings,
    onSend,
    onSelectThisParticipant,
    onClearActiveParticipant,
    onStopStreaming,
    // Data
    pipelineParticipant,
    // Add activeParticipantDetails to prevent API fetching
    activeParticipantDetails: pipelineVersionDetails
      ? {
          id: pipelineId,
          name: pipelineName,
          description: pipelineVersionDetails.description || '',
          participantType: 'application',
          agent_type: pipelineVersionDetails.agent_type || 'pipeline',
          version_details: pipelineVersionDetails,
          project_id: projectId,
        }
      : null,
    // Attachment related props
    attachments,
    disableAttachments,
    onAttachFiles,
    onDeleteAttachment,
    onClearAttachments,
  };
};

export default usePipelineChat;
