import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import { SKILL_RUN_MATCH, SKILL_RUN_START_ERROR } from '@/[fsd]/features/skill/lib/constants';
import {
  buildSkillRunConversation,
  buildSkillRunName,
  buildSkillRunParticipant,
  findSkillParticipant,
  matchSkillRun,
} from '@/[fsd]/features/skill/lib/helpers';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import {
  TAG_TYPE_CONVERSATION_DETAILS,
  useConversationCreateMutation,
  useConversationDetailsQuery,
  useDeleteAllMessagesFromConversationMutation,
  useDeleteMessageFromConversationMutation,
  useLazyMessageTracesQuery,
  useStopChatTaskMutation,
} from '@/api';
import { eliteaApi } from '@/api/eliteaApi';
import { ChatParticipantType, ROLES, sioEvents } from '@/common/constants';
import {
  buildTraceListParams,
  convertConversationToChatHistory,
} from '@/common/convertChatConversationMessages';
import { buildErrorMessage } from '@/common/utils';
import { useChatMessageDeleteSocket, useChatMessageSyncSocket } from '@/components/Chat/hooks';
import useSynAgentChatMessage from '@/hooks/application/useSynAgentChatMessage';
import { useAttachmentState } from '@/hooks/chat/useAttachmentState';
import useStreamingNavBlocker from '@/hooks/chat/useStreamingNavBlocker';
import { useManualSocket } from '@/hooks/useSocket';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const isPendingMessage = message => message.isStreaming || message.isLoading || message.isRegenerating;

export const useSkillRunChat = ({
  projectId,
  skillId,
  skillName,
  versionDetails,
  runConversationId,
  onRunConversationChange,
  onOpenRunVersion,
}) => {
  const dispatch = useDispatch();
  const { toastError, toastInfo, toastSuccess } = useToast();
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeParticipant, setActiveParticipant] = useState(null);
  const [unsavedLLMSettings, setUnsavedLLMSettings] = useState(null);
  const chatHistoryRef = useRef([]);
  const createdRunIdRef = useRef(null);

  const [createConversation, { isLoading: isCreatingConversation }] = useConversationCreateMutation();
  const [deleteMessage, { reset: resetDeleteMessage }] = useDeleteMessageFromConversationMutation();
  const [deleteAllMessages, { reset: resetDeleteAll }] = useDeleteAllMessagesFromConversationMutation();
  const [stopChatTask] = useStopChatTaskMutation();
  const [getMessageTraces] = useLazyMessageTracesQuery();
  const { emit: emitEnterRoom } = useManualSocket(sioEvents.chat_enter_room);
  const { emit: emitLeaveRoom } = useManualSocket(sioEvents.chat_leave_rooms);
  const { attachments, onAttachFiles, onDeleteAttachment, onClearAttachments } = useAttachmentState();

  const versionId = versionDetails?.id;
  const savedLlmSettings = versionDetails?.run_settings?.llm_settings;

  const skillParticipant = useMemo(
    () =>
      skillId && versionId
        ? buildSkillRunParticipant({
            skillId: Number(skillId),
            skillName,
            projectId,
            versionId,
            iconMeta: versionDetails?.meta?.icon_meta,
          })
        : null,
    [projectId, skillId, skillName, versionId, versionDetails?.meta?.icon_meta],
  );

  const buildNewRun = useCallback(
    () => ({
      name: buildSkillRunName(skillName),
      is_private: true,
      source: ParticipantEntityTypes.Skill,
      participants: [skillParticipant],
      chat_history: [],
      isNew: true,
      isApplicationChat: true,
    }),
    [skillName, skillParticipant],
  );

  const isRunLoaded =
    Boolean(runConversationId) && String(activeConversation?.id) === String(runConversationId);

  const {
    data: runConversationData,
    isFetching: isFetchingRun,
    isError: isRunError,
  } = useConversationDetailsQuery(
    { projectId, id: runConversationId },
    { skip: !projectId || !runConversationId || isRunLoaded, refetchOnMountOrArgChange: true },
  );

  useEffect(() => {
    if (!runConversationId || isRunLoaded || isFetchingRun || !runConversationData) return;
    if (String(runConversationData.id) !== String(runConversationId)) return;

    const runParticipant = findSkillParticipant(runConversationData);
    const runMatch = matchSkillRun(runParticipant, { skillId, projectId, versionId });
    if (runMatch === SKILL_RUN_MATCH.otherSkill) {
      toastError('This conversation is not a run of this skill');
      onRunConversationChange(null);
      return;
    }
    if (runMatch === SKILL_RUN_MATCH.otherVersion) {
      onOpenRunVersion(runParticipant.entity_settings.version_id, runConversationData.id);
      return;
    }

    let isSuperseded = false;
    const tracesRequest = getMessageTraces({
      projectId,
      conversationId: runConversationData.id,
      params: buildTraceListParams(runConversationData.message_groups),
    });
    (async () => {
      try {
        const tracesResult = await tracesRequest;
        if (isSuperseded) return;
        const chatHistory = convertConversationToChatHistory(runConversationData, tracesResult.data);
        chatHistoryRef.current = chatHistory;
        setActiveConversation({ ...runConversationData, chat_history: chatHistory, isApplicationChat: true });
        setActiveParticipant(runParticipant);
        emitEnterRoom({
          conversation_id: runConversationData.id,
          conversation_uuid: runConversationData.uuid,
          project_id: projectId,
        });
      } catch {
        if (!isSuperseded) toastError('Failed to load the skill run');
      }
    })();
    return () => {
      isSuperseded = true;
      tracesRequest.abort();
    };
  }, [
    emitEnterRoom,
    getMessageTraces,
    isFetchingRun,
    isRunLoaded,
    onOpenRunVersion,
    onRunConversationChange,
    projectId,
    runConversationData,
    runConversationId,
    skillId,
    toastError,
    versionId,
  ]);

  useEffect(() => {
    if (runConversationId && isRunError && !isFetchingRun) {
      toastError('The skill run could not be opened; starting a new run');
      onRunConversationChange(null);
    }
  }, [isFetchingRun, isRunError, onRunConversationChange, runConversationId, toastError]);

  useEffect(() => {
    if (runConversationId || !skillParticipant) return;
    const isCurrentNewRun =
      activeConversation?.isNew && activeConversation.participants?.[0] === skillParticipant;
    const isCreatedRunAwaitingUrl =
      activeConversation?.id !== undefined &&
      activeConversation.id === createdRunIdRef.current &&
      findSkillParticipant(activeConversation)?.entity_settings?.version_id === versionId;
    if (isCurrentNewRun || isCreatedRunAwaitingUrl) return;
    setActiveConversation(buildNewRun());
    setActiveParticipant(skillParticipant);
    setUnsavedLLMSettings(null);
  }, [activeConversation, buildNewRun, runConversationId, skillParticipant, versionId]);

  const isStreaming = useMemo(
    () => Boolean(activeConversation?.chat_history?.some(isPendingMessage)),
    [activeConversation?.chat_history],
  );
  useStreamingNavBlocker(isStreaming);

  const setChatHistory = useCallback(chatHistory => {
    setActiveConversation(prev => {
      if (!prev) return prev;
      const nextHistory =
        typeof chatHistory === 'function' ? chatHistory(prev.chat_history || []) : chatHistory;
      chatHistoryRef.current = nextHistory || [];
      return { ...prev, chat_history: nextHistory };
    });
  }, []);

  const createRunConversation = useCallback(
    async ({ newMessages, eventPayload }) => {
      const result = await createConversation(
        buildSkillRunConversation({ projectId, skillName, participant: skillParticipant }),
      );
      if (!result.data) {
        toastError(buildErrorMessage(result.error) || SKILL_RUN_START_ERROR);
        return { success: false };
      }

      const runParticipant = findSkillParticipant(result.data) || skillParticipant;
      const createdConversation = { ...result.data, chat_history: [], isApplicationChat: true };
      createdRunIdRef.current = result.data.id;
      setActiveConversation(createdConversation);
      setActiveParticipant(runParticipant);
      emitEnterRoom({
        conversation_id: result.data.id,
        conversation_uuid: result.data.uuid,
        project_id: projectId,
      });
      onRunConversationChange(result.data.id);

      return {
        success: true,
        createdConversation,
        activeParticipant: runParticipant,
        updatedEventPayload: {
          ...eventPayload,
          conversation_uuid: result.data.uuid,
          participant_id: runParticipant.id,
        },
        updatedMessages: newMessages.map(message => ({
          ...message,
          participant_id: message.role === ROLES.User ? message.participant_id : runParticipant.id,
        })),
      };
    },
    [
      createConversation,
      emitEnterRoom,
      onRunConversationChange,
      projectId,
      skillName,
      skillParticipant,
      toastError,
    ],
  );

  const onSend = useCallback(
    async messageData =>
      messageData.needsConversationCreation && !activeConversation?.id
        ? createRunConversation(messageData)
        : { success: true },
    [activeConversation?.id, createRunConversation],
  );

  const stopMessages = useCallback(
    messages => {
      messages
        .filter(message => message.task_id && message.id)
        .forEach(message => stopChatTask({ projectId, messageGroupUuid: message.id }));
      const streamIds = messages.map(message => message.id).filter(Boolean);
      if (streamIds.length) emitLeaveRoom(streamIds);
    },
    [emitLeaveRoom, projectId, stopChatTask],
  );

  const onStopStreaming = useCallback(
    message => async () => {
      stopMessages([message]);
      setChatHistory(prev =>
        prev.map(item =>
          item.id === message.id
            ? { ...item, isStreaming: false, isLoading: false, task_id: undefined }
            : item,
        ),
      );
    },
    [setChatHistory, stopMessages],
  );

  const stopAll = useCallback(() => {
    stopMessages(
      chatHistoryRef.current.filter(message => message.role !== ROLES.User && isPendingMessage(message)),
    );
  }, [stopMessages]);

  const onStartNewRun = useCallback(() => {
    stopAll();
    createdRunIdRef.current = null;
    onClearAttachments();
    setActiveConversation(buildNewRun());
    setActiveParticipant(skillParticipant);
    setUnsavedLLMSettings(null);
    onRunConversationChange(null);
  }, [buildNewRun, onClearAttachments, onRunConversationChange, skillParticipant, stopAll]);

  const onDeleteAllMessages = useCallback(
    async callback => {
      if (!activeConversation?.id) {
        setChatHistory([]);
        callback?.();
        return;
      }
      stopAll();
      const result = await deleteAllMessages({ projectId, conversationId: activeConversation.id });
      if (result.error) {
        toastError(buildErrorMessage(result.error) || 'Failed to delete the messages, please try again.');
        return;
      }
      setChatHistory([]);
      toastInfo('The messages have been deleted');
      resetDeleteAll();
      callback?.();
    },
    [
      activeConversation?.id,
      deleteAllMessages,
      projectId,
      resetDeleteAll,
      setChatHistory,
      stopAll,
      toastError,
      toastInfo,
    ],
  );

  const onDeleteMessage = useCallback(
    async (messageId, callback) => {
      const result = await deleteMessage({
        conversationId: activeConversation?.id,
        projectId,
        id: messageId,
      });
      if (result.error) {
        toastError(buildErrorMessage(result.error) || 'Failed to delete the message, please try again.');
        return;
      }
      setChatHistory(prev => prev.filter(message => message.id !== messageId));
      callback?.();
      toastSuccess('The message has been successfully deleted.');
      resetDeleteMessage();
    },
    [
      activeConversation?.id,
      deleteMessage,
      projectId,
      resetDeleteMessage,
      setChatHistory,
      toastError,
      toastSuccess,
    ],
  );

  const onSetLLMSettings = useCallback(newSettings => {
    setUnsavedLLMSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const llmSettings = useMemo(
    () => ({ ...(savedLlmSettings || {}), ...(unsavedLLMSettings || {}) }),
    [savedLlmSettings, unsavedLLMSettings],
  );

  const { onRemoteChatMessageSync } = useSynAgentChatMessage({ activeConversation, setActiveConversation });
  useChatMessageSyncSocket({ onRemoteChatMessageSync });
  const onRemoteDeleteMessage = useCallback(
    id => setChatHistory(prev => prev.filter(message => message.id !== id)),
    [setChatHistory],
  );
  useChatMessageDeleteSocket({ onRemoteDeleteMessage });

  const wasStreamingRef = useRef(isStreaming);
  useEffect(() => {
    const hasTurnFinished = wasStreamingRef.current && !isStreaming;
    if (hasTurnFinished && activeConversation?.id) {
      dispatch(
        eliteaApi.util.invalidateTags([{ type: TAG_TYPE_CONVERSATION_DETAILS, id: activeConversation.id }]),
      );
    }
    wasStreamingRef.current = isStreaming;
  }, [activeConversation?.id, dispatch, isStreaming]);

  const activeParticipantDetails = useMemo(
    () =>
      versionDetails
        ? {
            id: Number(skillId),
            name: skillName,
            description: '',
            participantType: ChatParticipantType.Skills,
            version_details: versionDetails,
            project_id: projectId,
          }
        : null,
    [projectId, skillId, skillName, versionDetails],
  );

  return {
    activeConversation,
    activeParticipant,
    activeParticipantDetails,
    isStreaming,
    isLoadingConversation: isCreatingConversation || (Boolean(runConversationId) && !isRunLoaded),
    llmSettings,
    unsavedLLMSettings,
    setUnsavedLLMSettings,
    setChatHistory,
    setActiveConversation,
    onSend,
    onStartNewRun,
    onDeleteAllMessages,
    onDeleteMessage,
    onStopStreaming,
    onSetLLMSettings,
    attachments,
    onAttachFiles,
    onDeleteAttachment,
    onClearAttachments,
  };
};
