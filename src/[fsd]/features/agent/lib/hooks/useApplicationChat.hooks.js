import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

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
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import { useManualSocket } from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

/**
 * Custom hook for managing application chat functionality
 * Encapsulates conversation creation, socket handling, and state management
 * for agent pages (both Run and Configuration tabs)
 */
export const useApplicationChat = ({
  applicationId,
  applicationName,
  applicationVersionDetails,
  projectId,
  setFieldValue,
  restoredConversationID = null,
  onRestoreConversationComplete,
}) => {
  const dispatch = useDispatch();
  const isFromPipelines = useIsFrom(RouteDefinitions.Pipelines);
  const source = isFromPipelines ? 'pipeline' : 'agent';

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

  useApplicationChatSwitchVersion({
    activeParticipant,
    activeConversation,
    applicationVersionDetails,
    projectId,
    setActiveParticipant,
  });

  // Stop streaming functionality
  const [stopChatTask] = useStopChatTaskMutation();

  // Enhanced streaming state management with tracking
  const [streamingState, setStreamingState] = useState({
    isStreaming: false,
    streamingMessages: new Set(),
  });

  // Streaming state management - more robust detection
  const isStreaming = useMemo(() => {
    const hasStreamingMessages =
      activeConversation?.chat_history?.some(msg => msg.isStreaming || msg.isLoading || msg.isRegenerating) ||
      false;

    // Update our internal streaming state
    if (hasStreamingMessages !== streamingState.isStreaming) {
      setStreamingState(prev => ({
        ...prev,
        isStreaming: hasStreamingMessages,
        streamingMessages: hasStreamingMessages
          ? new Set(
              activeConversation?.chat_history
                ?.filter(msg => msg.isStreaming || msg.isLoading || msg.isRegenerating)
                .map(msg => msg.id),
            )
          : new Set(),
      }));
    }

    return hasStreamingMessages;
  }, [activeConversation?.chat_history, streamingState.isStreaming]);
  useStreamingNavBlocker(isStreaming);

  // Conversation creation mutation and socket handlers
  const [createConversation, { isLoading: isLoadingConversation }] = useConversationCreateMutation();
  const { emit: emitEnterRoom } = useManualSocket(sioEvents.chat_enter_room);
  const { emit: emitLeaveRoom } = useManualSocket(sioEvents.chat_leave_rooms);

  // Create application participant from current application data
  const applicationParticipant = useMemo(() => {
    if (!applicationId || !applicationVersionDetails) return null;

    return {
      id: applicationId,
      entity_name: 'application',
      entity_meta: {
        id: applicationId,
        name: applicationName,
        project_id: projectId,
      },
      entity_settings: {
        variables: applicationVersionDetails.variables || [],
        instructions: applicationVersionDetails.instructions,
        tools: applicationVersionDetails.tools,
        version_id: applicationVersionDetails.id,
        icon_meta: applicationVersionDetails.meta?.icon_meta || {},
        ...(applicationVersionDetails.agent_type && {
          agent_type: applicationVersionDetails.agent_type,
        }),
      },
      meta: {
        name: applicationName,
      },
    };
  }, [applicationId, applicationName, applicationVersionDetails, projectId]);

  const { onAttachFiles, attachments, onDeleteAttachment, disableAttachments, onClearAttachments } =
    useAgentAttachments({ agentVersionDetails: applicationVersionDetails });

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
        isApplicationChat: true,
      };

      // Find the application participant from the restored conversation
      const appParticipant = restoredConversationData.participants?.find(
        p => p.entity_name === 'application',
      );

      if (appParticipant) {
        setActiveConversation(restoredConversation);
        setActiveParticipant(appParticipant);

        chatHistoryRef.current = convertedChatHistory;

        emitEnterRoom({
          conversation_id: restoredConversationData.id,
          conversation_uuid: restoredConversationData.uuid,
          project_id: projectId,
        });

        toastInfo('Conversation restored successfully');
        setHasRestoredConversation(true);
      } else {
        toastError('Could not find application participant in restored conversation');
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
      applicationParticipant &&
      !activeConversation &&
      !isCreatingConversation &&
      !restoredConversationID &&
      !isRestoringConversation
    ) {
      setIsCreatingConversation(true);

      // Create a basic conversation structure for application chat
      const newConversation = {
        name: `Chat with ${applicationName}`,
        is_private: true,
        source,
        participants: [applicationParticipant],
        chat_history: [],
        isNew: true,
        isApplicationChat: true,
      };

      // Set the conversation and participant directly
      setActiveConversation(newConversation);
      setActiveParticipant(applicationParticipant);
      setHasRestoredConversation(false);
      setIsCreatingConversation(false);
    }
  }, [
    applicationParticipant,
    activeConversation,
    isCreatingConversation,
    applicationName,
    source,
    restoredConversationID,
    isRestoringConversation,
  ]);

  // Keep conversation participants in sync with applicationParticipant when version changes
  useEffect(() => {
    if (!applicationParticipant) return;

    setActiveConversation(prev => {
      if (!prev) return prev;

      const hasExistingApplicationParticipant = prev.participants?.some(p => p.entity_name === 'application');

      if (!hasExistingApplicationParticipant) return prev;

      const updatedParticipants = prev.participants.map(p =>
        p.entity_name === 'application' ? applicationParticipant : p,
      );

      return {
        ...prev,
        participants: updatedParticipants,
      };
    });
  }, [applicationParticipant]);

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
          name: `Chat with ${applicationName}`,
          source,
          meta: {
            single_participant: applicationParticipant,
            internal_tools: applicationVersionDetails?.meta?.internal_tools,
          },
          participants: [applicationParticipant],
          projectId,
        });

        if (result.data) {
          // Attachments are now handled via internal tools auto-injection
          // No need to manually set attachment storage or create attachment artifact
          const createdConversation = {
            ...result.data,
            chat_history: [], // Don't set chat history here, ChatBox will handle it
            isApplicationChat: true,
            participants: result.data.participants || [],
          };

          // Update the conversation with real UUID from backend
          setActiveConversation(createdConversation);

          // Find the application participant from the created conversation
          const appParticipant = result.data.participants?.find(p => p.entity_name === 'application');

          // Update the active participant with the backend-assigned participant
          if (appParticipant) {
            setActiveParticipant(appParticipant);
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
              msg.role === ROLES.User ? msg.participant_id : appParticipant?.id || applicationParticipant.id,
          }));

          // Return updated event payload with correct conversation UUID and participant ID
          const updatedEventPayload = {
            user_input: userInput,
            // Preserve llm_settings from event payload if provided (from unsavedLLMSettings)
            // Otherwise fall back to applicationVersionDetails
            llm_settings: messageData.eventPayload?.llm_settings || {
              model_name: applicationVersionDetails?.llm_settings?.model_name,
              model_project_id: applicationVersionDetails?.llm_settings?.model_project_id,
              max_tokens: applicationVersionDetails?.llm_settings?.max_tokens,
              temperature: applicationVersionDetails?.llm_settings?.temperature,
              reasoning_effort: applicationVersionDetails?.llm_settings?.reasoning_effort,
            },
            project_id: projectId,
            conversation_uuid: result.data.uuid,
            question_id,
            participant_id: appParticipant?.id || applicationParticipant.id,
            attachments_info,
            mcp_tokens,
            ignored_mcp_servers,
          };

          // Return success with updated payload, conversation, and participant for ChatBox
          return {
            success: true,
            updatedEventPayload,
            createdConversation,
            activeParticipant: appParticipant || applicationParticipant,
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
      applicationName,
      applicationParticipant,
      projectId,
      emitEnterRoom,
      applicationVersionDetails?.llm_settings?.model_name,
      applicationVersionDetails?.llm_settings?.model_project_id,
      applicationVersionDetails?.llm_settings?.max_tokens,
      applicationVersionDetails?.llm_settings?.temperature,
      applicationVersionDetails?.llm_settings?.reasoning_effort,
      toastError,
      source,
      applicationVersionDetails?.meta?.internal_tools,
    ],
  );

  // Handle conversation creation when first message is sent
  const handleMessage = useCallback(
    async messageData => {
      try {
        const { eventPayload } = messageData;
        if (!eventPayload.llm_settings?.model_name) {
          // Return updated event payload with llm_settings from applicationVersionDetails
          // only if they weren't provided in the event payload
          const updatedEventPayload = {
            ...eventPayload,
            llm_settings: eventPayload.llm_settings || {
              model_name: applicationVersionDetails?.llm_settings?.model_name,
              model_project_id: applicationVersionDetails?.llm_settings?.model_project_id,
              max_tokens: applicationVersionDetails?.llm_settings?.max_tokens,
              temperature: applicationVersionDetails?.llm_settings?.temperature,
              reasoning_effort: applicationVersionDetails?.llm_settings?.reasoning_effort,
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
      applicationVersionDetails?.llm_settings?.model_name,
      applicationVersionDetails?.llm_settings?.model_project_id,
      applicationVersionDetails?.llm_settings?.max_tokens,
      applicationVersionDetails?.llm_settings?.temperature,
      applicationVersionDetails?.llm_settings?.reasoning_effort,
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

    if (applicationVersionDetails?.welcome_message) {
      setChatHistory(prev => {
        if (prev.length && prev[0].id == WELCOME_MESSAGE_ID) {
          return [
            ChatHelpers.getWelcomeMessage(
              applicationVersionDetails?.welcome_message,
              applicationParticipant?.id,
            ),
            ...prev.slice(1),
          ];
        } else {
          return [
            ChatHelpers.getWelcomeMessage(
              applicationVersionDetails?.welcome_message,
              applicationParticipant?.id,
            ),
            ...prev,
          ];
        }
      });
    } else {
      setChatHistory(prev => {
        if (prev.length && prev[0].id == WELCOME_MESSAGE_ID) {
          return prev.slice(1);
        } else {
          return prev;
        }
      });
    }
  }, [
    applicationVersionDetails?.welcome_message,
    setChatHistory,
    restoredConversationID,
    applicationParticipant,
    hasRestoredConversation,
  ]);

  // Update chatHistoryRef when conversation changes
  useEffect(() => {
    chatHistoryRef.current = activeConversation?.chat_history || [];
  }, [activeConversation?.chat_history]);

  // Stop streaming functionality
  const onStopStreaming = useCallback(
    message => async () => {
      const { id: streamId, task_id } = message;

      // Update streaming state immediately to show button is working
      setStreamingState(prev => {
        const newStreamingMessages = new Set(prev.streamingMessages);
        newStreamingMessages.delete(streamId);
        return {
          isStreaming: newStreamingMessages.size > 0,
          streamingMessages: newStreamingMessages,
        };
      });

      if (task_id && streamId) {
        await stopChatTask({ projectId, messageGroupUuid: streamId });
      }
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

    // Update streaming state immediately
    setStreamingState({
      isStreaming: false,
      streamingMessages: new Set(),
    });

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
      setActiveConversation(prev =>
        prev
          ? {
              ...prev,
              chat_history: ChatHelpers.getInitialChatHistory(
                applicationVersionDetails?.welcome_message,
                applicationParticipant?.id,
              ),
              uuid: undefined,
              id: undefined,
            }
          : prev,
      );
    }
  }, [
    activeConversation?.chat_history?.length,
    applicationParticipant?.id,
    applicationVersionDetails?.welcome_message,
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

  const onDeleteAllMessages = useCallback(
    async callback => {
      await onStopAll();
      const result = await deleteAllMessages({
        projectId,
        conversationId: activeConversation?.id,
      });
      if (!result.error) {
        setActiveConversation({
          name: `Chat with ${applicationName}`,
          is_private: true,
          source: 'agent',
          participants: [applicationParticipant],
          chat_history: !applicationVersionDetails?.welcome_message
            ? []
            : [
                ChatHelpers.getWelcomeMessage(
                  applicationVersionDetails?.welcome_message,
                  applicationParticipant?.id,
                ),
              ],
          isNew: true,
          isApplicationChat: true,
        });
        toastInfo('The messages have been deleted');
        resetDeleteAll();
        callback?.();
      } else {
        toastError(buildErrorMessage(result.error) || 'Failed to delete the message, please try again.');
      }
    },
    [
      activeConversation?.id,
      applicationName,
      applicationParticipant,
      applicationVersionDetails?.welcome_message,
      deleteAllMessages,
      onStopAll,
      projectId,
      resetDeleteAll,
      toastError,
      toastInfo,
    ],
  );

  // Handler for updating participant settings (for agents page)
  const onChangeParticipantSettings = useCallback(
    (participantId, updates) => {
      if (updates.entity_settings?.llm_settings && setFieldValue) {
        // Update the agent's llm_settings in Formik
        Object.entries(updates.entity_settings.llm_settings).forEach(([key, value]) => {
          setFieldValue(`version_details.llm_settings.${key}`, value);
        });
      }
    },
    [setFieldValue],
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

      // If conversation needs to be created (first message in agent page)
      if (needsConversationCreation && !activeConversation?.id) {
        const result = await handleCreateConversationOnFirstMessage(messageData);
        return result; // Returns { success: boolean, updatedEventPayload?: object }
      }

      // For existing conversations, just return success to proceed with normal flow
      return handleMessage(messageData);
    },
    [activeConversation?.id, handleMessage, handleCreateConversationOnFirstMessage],
  );

  // No-op handlers for application chat
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
    resetChatHistory(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationVersionDetails?.id]); // Clear messages when version changes

  // When streaming transitions from true to false, invalidate context status cache via TAG_TYPE_CONVERSATION_DETAILS tag
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
    isLoadingConversation: isLoadingConversation || isLoadingRestoredConversation,
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
    applicationParticipant,
    // Add activeParticipantDetails to prevent API fetching
    activeParticipantDetails: applicationVersionDetails
      ? {
          id: applicationId,
          name: applicationName,
          description: applicationVersionDetails.description || '',
          participantType: 'application',
          agent_type: applicationVersionDetails.agent_type,
          version_details: applicationVersionDetails,
          project_id: projectId,
        }
      : null,

    // Attachment related props
    disableAttachments,
    attachments,
    onAttachFiles,
    onDeleteAttachment,
    onClearAttachments,
  };
};
