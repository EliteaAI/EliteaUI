import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { v4 as uuidv4, v4 } from 'uuid';

import { useTrackEvent } from '@/GA';
import { ChatHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import * as ParsePipelineHelpers from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/parsePipeline.helpers';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useContextExecutionEntity, useProjectType } from '@/[fsd]/shared/lib/hooks';
import useCtrlEnterKeyEventsHandler from '@/[fsd]/shared/lib/hooks/useCtrlEnterKeyEventsHandler.hooks';
import { useStopChatTaskMutation } from '@/api';
import { useStopDatasourceTaskMutation } from '@/api/datasources';
import {
  ChatParticipantType,
  ROLES,
  SocketMessageType,
  TOOL_ACTION_NAMES,
  TOOL_ACTION_TYPES,
  ToolActionStatus,
  sioEvents,
} from '@/common/constants';
import { convertTime } from '@/common/convertChatConversationMessages.js';
import { convertJsonToString } from '@/common/utils';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSocket, { useManualSocket } from '@/hooks/useSocket';
import RouteDefinitions from '@/routes';

export { useCtrlEnterKeyEventsHandler };

export const useStopStreaming = ({
  chatHistoryRef,
  chatHistory,
  setChatHistory,
  emitLeaveRoom,
  userParticipantId,
  userId,
}) => {
  const isFromChat = useIsFrom(RouteDefinitions.Chat);

  const isStreaming = useMemo(() => {
    if (!isFromChat) {
      return chatHistory.some(msg => msg.isStreaming && msg.task_id);
    } else {
      const myLastStreamingResponseIndex = chatHistory.findLastIndex(
        msg =>
          msg.role === ROLES.Assistant &&
          (msg.replyTo?.author_participant_id === userParticipantId || msg.replyTo?.user_id === userId) &&
          (msg.isStreaming || msg.isRegenerating) &&
          msg.task_id,
      );
      const myLastResponseIndex = chatHistory.findLastIndex(
        msg =>
          msg.role === ROLES.Assistant &&
          (msg.replyTo?.author_participant_id === userParticipantId || msg.replyTo?.user_id === userId),
      );
      return myLastStreamingResponseIndex !== -1 && myLastStreamingResponseIndex === myLastResponseIndex;
    }
  }, [chatHistory, isFromChat, userId, userParticipantId]);

  const [stopDatasourceTask, { isError: isStopDatasourceTaskError, error: stopDatasourceError }] =
    useStopDatasourceTaskMutation();
  const [stopChatTask, { isError: isStopChatTaskError, error: stopChatTaskError }] =
    useStopChatTaskMutation();
  const isStopError = useMemo(
    () => isStopChatTaskError || isStopDatasourceTaskError,
    [isStopChatTaskError, isStopDatasourceTaskError],
  );
  const stopError = useMemo(
    () => stopChatTaskError || stopDatasourceError,
    [stopChatTaskError, stopDatasourceError],
  );
  const projectId = useSelectedProjectId();
  const onStopStreaming = useCallback(
    message => async () => {
      const { id: streamId, task_id, participant = {} } = message;
      const { entity_name } = participant || {};
      if (task_id) {
        if (entity_name == ChatParticipantType.Datasources) {
          await stopDatasourceTask({ projectId, task_id });
        } else if (entity_name === ChatParticipantType.Applications) {
          await stopChatTask({ projectId, messageGroupUuid: streamId });
        } else {
          await stopChatTask({ projectId, messageGroupUuid: streamId });
        }
      }
      emitLeaveRoom([streamId]);
      setTimeout(
        () =>
          setChatHistory?.(prevState =>
            prevState.map(msg =>
              msg.id === streamId
                ? {
                    ...msg,
                    isStreaming: false,
                    isLoading: false,
                    task_id: undefined,
                    // Stop freezes the run: drop any pending HITL approval cards
                    // (#4993 Track 2). They are client-side only, so the backend
                    // sync can't clear them — and a click on a stale card would
                    // re-invoke the parent and re-fan-out every child.
                    hitlInterrupts: undefined,
                    hitlInterrupt: undefined,
                  }
                : { ...msg, task_id: undefined },
            ),
          ),
        200,
      );
    },
    [emitLeaveRoom, projectId, setChatHistory, stopChatTask, stopDatasourceTask],
  );

  const onStopAll = useCallback(async () => {
    const streamIds = chatHistoryRef.current
      .filter(message => message.role !== ROLES.User && message.isStreaming)
      .map(message => message.id);
    const messagesWithTaskId = chatHistoryRef.current.filter(
      message => message.role !== ROLES.User && message.task_id && message.isStreaming,
    );
    messagesWithTaskId.forEach(async message => {
      const { participant: { entity_name } = {}, task_id } = message;
      if (entity_name == ChatParticipantType.Datasources) {
        await stopDatasourceTask({ projectId, task_id });
      } else {
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
            task_id: undefined,
            // Stop freezes the run — drop pending HITL cards (#4993 Track 2).
            hitlInterrupts: undefined,
            hitlInterrupt: undefined,
          })),
        ),
      200,
    );
  }, [chatHistoryRef, emitLeaveRoom, projectId, setChatHistory, stopChatTask, stopDatasourceTask]);

  const stopAllRef = useRef(onStopAll);
  const shouldCleanupRef = useRef(true);

  useEffect(() => {
    stopAllRef.current = onStopAll;
  }, [onStopAll]);

  // Track if component is actually being destroyed vs just re-rendered
  useEffect(() => {
    return () => {
      // Only cleanup if the component is actually being unmounted
      // and there are streaming messages
      if (shouldCleanupRef.current && !isFromChat) {
        stopAllRef.current?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep empty dependency array

  // Method to disable cleanup (call this when canvas/agent editing starts)
  const disableCleanup = useCallback(() => {
    shouldCleanupRef.current = false;
  }, []);

  // Method to re-enable cleanup
  const enableCleanup = useCallback(() => {
    shouldCleanupRef.current = true;
  }, []);

  return {
    isStreaming,
    onStopAll,
    onStopStreaming,
    isStopError,
    stopError,
    stopAllRef,
    disableCleanup,
    enableCleanup,
  };
};

const addMessageToChatHistory = ({
  msgIndex,
  msg,
  setChatHistoryRef,
  participantsRef,
  question_id,
  participant_id,
  activeParticipantRef,
}) => {
  msgIndex === -1
    ? setChatHistoryRef.current?.(prevState => {
        // Guard against duplicate insertion: when multiple socket events race with a stale
        // chatHistoryRef (e.g. StartTask + AgentLlmChunk arriving before React re-renders after
        // a POST-API-triggered message), both see msgIndex=-1 and would splice the same message
        // twice. If the message already exists in the latest prevState, update it instead.
        const existingIdx = prevState.findIndex(item => item.id === msg.id);
        if (existingIdx !== -1) {
          const newState = [...prevState];
          newState[existingIdx] = { ...newState[existingIdx], ...msg };
          return newState;
        }
        if (question_id) {
          const questionIndex = prevState.findIndex(
            item => item.role === ROLES.User && item.id === question_id,
          );
          if (questionIndex !== -1) {
            const newState = [...prevState];
            const theParticipant = participantsRef.current?.find(
              participant => participant.id === participant_id,
            );
            msg.participant = { ...(theParticipant || { entity_meta: {}, meta: {} }) };
            newState.splice(questionIndex + 1, 0, msg);
            return newState;
          } else {
            return prevState;
          }
        } else {
          return [...prevState, { ...msg, participant: { ...activeParticipantRef.current } }];
        }
      })
    : setChatHistoryRef.current?.(prevState => {
        const newState = [...prevState]; // Create new array first
        const existingMessage = newState[msgIndex];
        if (!existingMessage.participant) {
          const theParticipant = participantsRef.current?.find(
            participant => participant.id === participant_id,
          );
          msg.participant = { ...(theParticipant || { entity_meta: {}, meta: {} }) };
        }
        // Preserve SwarmChild toolActions from current state that may have been added
        // by socket events not yet reflected in chatHistoryRef (stale ref issue)
        const existingSwarmChildren = (existingMessage?.toolActions || []).filter(
          a => a.type === TOOL_ACTION_TYPES.SwarmChild,
        );
        if (existingSwarmChildren.length > 0) {
          const nonSwarmChildren = (msg.toolActions || []).filter(
            a => a.type !== TOOL_ACTION_TYPES.SwarmChild,
          );
          msg.toolActions = [...nonSwarmChildren, ...existingSwarmChildren];
        }
        newState[msgIndex] = { ...existingMessage, ...msg };
        return newState;
      });
};

export const useSocketEvents = () => {
  const { subscribeEvent, leaveEvent } = useMemo(() => {
    return {
      subscribeEvent: sioEvents.chat_predict,
      leaveEvent: sioEvents.chat_leave_rooms,
    };
  }, []);

  return { subscribeEvent, leaveEvent };
};

export const useChatSocket = ({
  mode,
  handleError,
  isMonoChatting,
  setIsRunning,
  chatHistory,
  setChatHistory,
  activeParticipant,
  participants,
  onRcvAgentEvent,
}) => {
  const trackEvent = useTrackEvent();

  const { contextExecutionEntity } = useContextExecutionEntity();

  const { projectType } = useProjectType();

  const projectTypeRef = useRef(projectType);

  useEffect(() => {
    projectTypeRef.current = projectType;
  }, [projectType]);

  const [completionResult, setCompletionResult] = useState([
    {
      id: uuidv4(),
      role: ROLES.Assistant,
      isLoading: false,
      content: '',
    },
  ]);
  const modeRef = useRef(mode);
  const chatHistoryRef = useRef(chatHistory);
  const completionResultRef = useRef(completionResult);
  const activeParticipantRef = useRef();
  const participantsRef = useRef(participants);
  const onRcvAgentEventRef = useRef(onRcvAgentEvent);
  const isMonoChattingRef = useRef(isMonoChatting);
  const setChatHistoryRef = useRef(setChatHistory);
  const setIsRunningRef = useRef(setIsRunning);
  const handleErrorRef = useRef(handleError);

  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);

  useEffect(() => {
    setIsRunningRef.current = setIsRunning;
  }, [setIsRunning]);

  useEffect(() => {
    setChatHistoryRef.current = setChatHistory;
  }, [setChatHistory]);

  useEffect(() => {
    onRcvAgentEventRef.current = onRcvAgentEvent;
  }, [onRcvAgentEvent]);

  useEffect(() => {
    activeParticipantRef.current = activeParticipant;
  }, [activeParticipant]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  useEffect(() => {
    completionResultRef.current = completionResult;
  }, [completionResult]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    isMonoChattingRef.current = isMonoChatting;
  }, [isMonoChatting]);

  const getMessage = useCallback((messageId, question_id) => {
    const msgIdx =
      chatHistoryRef.current?.findIndex(
        i => i.id === messageId || (question_id && i.question_id === question_id),
      ) ?? -1;
    let msg;
    if (msgIdx < 0) {
      const lastMsg = chatHistoryRef.current?.at(-1);
      if (isMonoChattingRef.current && lastMsg?.internal_id) {
        lastMsg.id = messageId;
        lastMsg.role = ROLES.Assistant;
        lastMsg.content = '';
        lastMsg.isLoading = false;
        lastMsg.created_at = new Date().getTime();
        lastMsg.participant = { ...activeParticipantRef.current };
        msg = lastMsg;
        return [chatHistoryRef.current.length - 1, lastMsg];
      } else {
        msg = {
          id: messageId,
          role: ROLES.Assistant,
          content: '',
          isLoading: false,
          created_at: new Date().getTime(),
        };
      }
    } else {
      msg = chatHistoryRef.current[msgIdx];
      if (msg.internal_id) {
        msg.id = messageId;
        msg.created_at = new Date().getTime();
      }
    }
    return [msgIdx, msg];
  }, []);

  const handleSocketEvent = useCallback(
    async message => {
      const {
        message_id,
        type: socketMessageType,
        response_metadata,
        sio_event,
        question_id: questionIdFromMessage,
      } = message;
      const {
        task_id,
        participant_id,
        question_id: questionIdFromContent,
      } = message.content instanceof Object ? message.content : {};
      const question_id = questionIdFromMessage || questionIdFromContent;
      const [msgIndex, msg] = getMessage(message_id, question_id);

      let t;

      switch (socketMessageType) {
        case SocketMessageType.StartTask: {
          const isContinuing = msg.isContinuing;
          msg.isLoading = true;
          msg.isStreaming = true;
          msg.isSending = false;
          msg.isRegenerating = undefined;
          msg.isContinuing = undefined;
          if (!isContinuing) {
            msg.content = '';
            msg.references = [];
            msg.created_at = new Date().getTime();
          }
          msg.task_id = task_id;
          msg.participant_id = participant_id;
          msg.question_id = question_id;
          msg.requiresConfirmation = undefined; // Clear confirmation state when task resumes
          msg.hitlInterrupt = undefined; // Clear HITL state when task resumes
          if (!msg.replyTo) {
            const questionMessage = chatHistoryRef.current.find(m => m.id === question_id);
            if (questionMessage) {
              msg.replyTo = {
                ...questionMessage,
              };
            } else {
              msg.replyTo = { uuid: question_id };
            }
          }
          addMessageToChatHistory({
            msgIndex,
            msg,
            setChatHistoryRef,
            participantsRef,
            question_id,
            participant_id,
            activeParticipantRef,
          });

          const theParticipant =
            participantsRef.current?.find(participant => participant.id === participant_id) ||
            activeParticipantRef.current;

          if (theParticipant?.entity_name === ChatParticipantType.Applications) {
            const agentType = theParticipant.entity_settings?.agent_type || 'unknown';
            const isPipeline = agentType === 'pipeline';
            const key = isPipeline ? 'PIPELINE' : 'AGENT';

            const commonFields = {
              [GA_EVENT_PARAMS[`${key}_ID`]]: theParticipant.entity_meta?.id || 'unknown',
              [GA_EVENT_PARAMS[`${key}_VERSION`]]: theParticipant.entity_settings?.version_id || 'unknown',
              [GA_EVENT_PARAMS.ENTITY]: contextExecutionEntity,
            };

            if (isPipeline) {
              trackEvent(GA_EVENT_NAMES.PIPELINE_EXECUTED, {
                ...commonFields,
                [GA_EVENT_PARAMS.PIPELINE_NAME]: theParticipant.meta?.name || 'unknown',
              });

              const nodeUsageData = ParsePipelineHelpers.extractPipelineNodeTypes(
                theParticipant.entity_settings?.instructions,
              );

              if (nodeUsageData) {
                trackEvent(GA_EVENT_NAMES.PIPELINE_NODE_USAGE, {
                  ...commonFields,
                  [GA_EVENT_PARAMS.NODE_TYPES]: Object.keys(nodeUsageData.nodeTypes).join(','),
                  [GA_EVENT_PARAMS.TOTAL_NODE_COUNT]: nodeUsageData.totalNodeCount,
                });
              }
            } else {
              trackEvent(GA_EVENT_NAMES.AGENT_EXECUTED, {
                ...commonFields,
                [GA_EVENT_PARAMS.AGENT_NAME]: theParticipant.meta?.name || 'unknown',
                [GA_EVENT_PARAMS.AGENT_TYPE]: agentType,
              });
            }
          }

          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        }
        case SocketMessageType.ChatUserMessage: {
          const {
            author_participant_id,
            uuid: userMessageId,
            content: question,
            sent_to_id,
            created_at,
            message_items,
          } = message;
          const theUser = participantsRef.current?.find(
            participant => participant.id === author_participant_id,
          );
          const sentTo = participantsRef.current?.find(participant => participant.id === sent_to_id);
          msg.id = userMessageId;
          msg.role = ROLES.User;
          msg.name = theUser?.meta.user_name || '';
          msg.avatar = theUser?.meta.user_avatar || '';
          msg.content = question;
          msg.message_items = message_items;
          msg.created_at = new Date(convertTime(created_at)).getTime();
          msg.user_id = author_participant_id;
          msg.participant_id = sent_to_id;
          msg.sentTo = sentTo;
          setChatHistoryRef.current?.(prev => [...prev, { ...msg }]);
          break;
        }
        case SocketMessageType.Chunk:
        case SocketMessageType.AIMessageChunk:
        case SocketMessageType.AgentResponse:
          msg.content += convertJsonToString(message.content, true);
          if (sio_event === sioEvents.chat_predict && response_metadata?.finish_reason) {
            msg.isLoading = false;
            const threadId = response_metadata?.metadata?.thread_id || response_metadata?.thread_id;
            if (threadId) {
              msg.threadId = threadId;
            }
            msg.isStreaming = false;
          }
          if (socketMessageType === SocketMessageType.AgentResponse) {
            onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          }
          break;
        case SocketMessageType.AgentLlmChunk: {
          const toolRunId = response_metadata?.tool_run_id;
          const chunkContent = convertJsonToString(message.content, false);
          // Extract streaming thinking content (Anthropic extended thinking)
          const chunkThinking = message.thinking || '';

          // If message doesn't exist yet in chat history, add it first
          if (msgIndex === -1) {
            msg.isLoading = true;
            msg.isStreaming = true;
            msg.role = ROLES.Assistant;
            if (msg.toolActions === undefined) {
              msg.toolActions = [];
            }
            // Create toolAction if it doesn't exist
            if (toolRunId && !msg.toolActions.find(i => i.id === toolRunId)) {
              msg.toolActions.push({
                name: response_metadata?.metadata?.langgraph_node?.trim() || TOOL_ACTION_NAMES.Llm,
                id: toolRunId,
                status: ToolActionStatus.processing,
                toolMeta: {
                  ...(response_metadata?.metadata || {}),
                  ls_model_name: response_metadata?.model_name,
                },
                created_at: message.created_at,
                type: TOOL_ACTION_TYPES.Llm,
                content: chunkContent,
                thinking: chunkThinking,
              });
            }
            addMessageToChatHistory({
              msgIndex,
              msg,
              setChatHistoryRef,
              participantsRef,
              question_id,
              participant_id,
              activeParticipantRef,
            });
            return;
          }

          // For existing messages, use state update with proper new object references
          // so React detects the change and re-renders
          setChatHistoryRef.current?.(prevState =>
            prevState.map((item, idx) => {
              if (idx !== msgIndex) return item;
              const existingToolActions = item.toolActions || [];
              const existingAction = existingToolActions.find(ta => ta.id === toolRunId);

              let updatedToolActions;
              if (existingAction) {
                // Update existing toolAction with new content and thinking
                updatedToolActions = existingToolActions.map(ta =>
                  ta.id === toolRunId
                    ? {
                        ...ta,
                        content: (ta.content || '') + chunkContent,
                        thinking: (ta.thinking || '') + chunkThinking,
                      }
                    : ta,
                );
              } else if (toolRunId) {
                // Create new toolAction
                updatedToolActions = [
                  ...existingToolActions,
                  {
                    name: response_metadata?.metadata?.langgraph_node?.trim() || TOOL_ACTION_NAMES.Llm,
                    id: toolRunId,
                    status: ToolActionStatus.processing,
                    toolMeta: {
                      ...(response_metadata?.metadata || {}),
                      ls_model_name: response_metadata?.model_name,
                    },
                    created_at: message.created_at,
                    type: TOOL_ACTION_TYPES.Llm,
                    content: chunkContent,
                    thinking: chunkThinking,
                  },
                ];
              } else {
                updatedToolActions = existingToolActions;
              }

              return {
                ...item,
                toolActions: updatedToolActions,
              };
            }),
          );
          return;
        }
        case SocketMessageType.AgentLlmEnd: {
          // Process ALL thinking_steps and update ALL matching toolActions
          // This handles pipelines with multiple LLM nodes that report in a single AgentLlmEnd
          const thinkingSteps = message.response_metadata?.thinking_steps || [];
          const actionsToRemove = [];

          for (const thinkStep of thinkingSteps) {
            // Use normalized tool_run_id from backend (works for both Anthropic and OpenAI)
            // Fallback to extracting from message.id for backwards compatibility
            const stepRunId = thinkStep.tool_run_id || thinkStep.message?.id?.replace('lc_run--', '');
            if (!stepRunId) continue;

            // Find matching toolAction
            t = msg.toolActions?.find(i => i.id === stepRunId);
            if (!t) continue;

            // Backend normalizes text field for all providers (OpenAI, Anthropic, etc.)
            let thinkText = convertJsonToString(thinkStep.text, true);
            // Clean up verbose tool call text - remove "with inputs {...}" part
            thinkText = thinkText.replace(/\s+with inputs\s+\{[^}]*\}/g, '');
            t.content = thinkText;
            t.ended_at = thinkStep.timestamp_finish;

            // Update model name from thinking_step if not already set
            const stepModelName = thinkStep.message?.response_metadata?.model_name;
            if (stepModelName && !t.toolMeta?.ls_model_name) {
              t.toolMeta = { ...t.toolMeta, ls_model_name: stepModelName };
            }

            // Update name from thinking_step's response_metadata.tool_name (correct pipeline node name)
            // Only update if correctToolName is a meaningful node name, not the model name itself
            const correctToolName = thinkStep.message?.response_metadata?.tool_name;
            const modelName = t.toolMeta?.ls_model_name;
            if (correctToolName && correctToolName.trim() && correctToolName !== modelName) {
              t.name = correctToolName;
            }

            // Extract extended thinking/reasoning if available
            if (thinkStep.thinking) {
              t.thinking = thinkStep.thinking;
            }

            // Mark actions with empty content for removal (transition steps)
            if (!thinkText || !thinkText.trim()) {
              actionsToRemove.push(t.id);
            } else {
              t.status = ToolActionStatus.complete;
            }
          }

          // Remove empty transition actions
          for (const idToRemove of actionsToRemove) {
            const idx = msg.toolActions?.findIndex(i => i.id === idToRemove);
            if (idx !== -1) {
              msg.toolActions.splice(idx, 1);
            }
          }

          // Also handle the primary tool_run_id if not in thinking_steps
          t = msg.toolActions?.find(i => i.id === response_metadata?.tool_run_id);
          if (t && t.status !== ToolActionStatus.complete) {
            t.ended_at = message.created_at;
            t.status = ToolActionStatus.complete;
          }

          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        }
        case SocketMessageType.AgentLlmStart:
        case SocketMessageType.AgentToolStart: {
          if (msg.toolActions === undefined) {
            msg.toolActions = [];
          }

          // Capture threadId from tool events - store on THIS message only
          const toolThreadId = response_metadata?.metadata?.thread_id;
          if (toolThreadId) {
            msg.threadId = toolThreadId;
          }

          if (!msg.toolActions.find(i => i.id === message.response_metadata?.tool_run_id)) {
            // Extract metadata from response FIRST
            // For tool_meta, we need to extract the nested metadata field (from LangChain's tool.metadata)
            // Merge both metadata sources with tool_meta.metadata taking precedence
            let metadata =
              socketMessageType === SocketMessageType.AgentLlmStart
                ? message.response_metadata?.metadata
                : {
                    ...(message.response_metadata?.metadata || {}),
                    ...(message.response_metadata?.tool_meta?.metadata || {}),
                  };

            // If metadata doesn't have toolkit_name, try to extract from description
            // Support multiple formats: "[Toolkit: name]", "Toolkit: name\n...", "...\nToolkit: name"
            if (!metadata?.toolkit_name && message.response_metadata?.tool_meta?.description) {
              const desc = message.response_metadata.tool_meta.description;
              // Try pattern 1: [Toolkit: name] (vectorstore, inventory)
              let descMatch = desc.match(/\[Toolkit:\s*([^\]]+)]/);
              if (!descMatch) {
                // Try pattern 2: Toolkit: name at start or end (most other toolkits)
                descMatch = desc.match(/(?:^|\n)Toolkit:\s*([^\n]+)/);
              }
              if (descMatch) {
                metadata = metadata || {};
                metadata.toolkit_name = descMatch[1].trim();
              }
            }

            // Now extract toolkit name and type using the merged metadata
            // Support both old format (toolkit___tool) and new format (clean tool names)
            const toolNameRaw = message.response_metadata?.tool_name || '';
            const hasOldFormat = toolNameRaw.includes('___');
            const toolkitName =
              metadata?.toolkit_name ||
              message.response_metadata?.toolkit_name ||
              (hasOldFormat ? toolNameRaw.split('___')[0] : '');
            const toolkitType =
              metadata?.toolkit_type ||
              message.response_metadata?.toolkit_type ||
              msg?.participant?.meta?.tools?.find(
                tool => tool.name === toolkitName || tool.toolkit_name === toolkitName,
              )?.type ||
              '';

            if (message.response_metadata?.tool_meta) {
              window.__lastToolMetaFull = message.response_metadata.tool_meta;
            }

            if (socketMessageType === SocketMessageType.AgentToolStart) {
              const isMCP = toolkitType === 'mcp' || metadata?.mcp;

              if (isMCP)
                trackEvent(GA_EVENT_NAMES.MCP_EXECUTED, {
                  [GA_EVENT_PARAMS.MCP_NAME]: toolkitName || 'unknown',
                  [GA_EVENT_PARAMS.MCP_TYPE]: toolkitType || 'mcp',
                  [GA_EVENT_PARAMS.TOOL_NAME]: toolNameRaw || 'unknown',
                  [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString().split('T')[0],
                  [GA_EVENT_PARAMS.ENTITY]: contextExecutionEntity,
                });
              else
                trackEvent(GA_EVENT_NAMES.TOOLKIT_USAGE, {
                  [GA_EVENT_PARAMS.TOOLKIT_NAME]: toolkitName || 'unknown',
                  [GA_EVENT_PARAMS.TOOLKIT_TYPE]: toolkitType || 'unknown',
                  [GA_EVENT_PARAMS.TOOL_NAME]: toolNameRaw || 'unknown',
                  [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString().split('T')[0],
                  [GA_EVENT_PARAMS.ENTITY]: contextExecutionEntity,
                });
            }

            if (socketMessageType === SocketMessageType.AgentLlmStart) {
              const modelName =
                message.response_metadata?.model_name ||
                message.response_metadata?.ls_model_name ||
                metadata?.model_name ||
                metadata?.ls_model_name;

              if (modelName)
                trackEvent(GA_EVENT_NAMES.LLM_MODEL_USAGE, {
                  [GA_EVENT_PARAMS.MODEL_NAME]: modelName,
                  [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString().split('T')[0],
                  [GA_EVENT_PARAMS.ENTITY]: contextExecutionEntity,
                });
            }

            // Store MCP session_id if present in metadata
            if (metadata?.mcp_session_id && metadata?.mcp_server_url) {
              McpAuthHelpers.setSessionId(metadata.mcp_server_url, metadata.mcp_session_id);
            }

            const toolMeta = {
              ...(metadata || {}),
              toolkit_type: toolkitType,
            };

            msg.toolActions.push({
              // When a lazy-loading wrapper is used, tool_name holds the wrapper's class name (e.g. "LazyLoading")
              // rather than the actual tool name. The SDK signals this by setting metadata.original_name.
              // In that case, prefer tool_meta.name which contains the real tool name (e.g. "get_plan_status").
              name:
                metadata?.original_name && message.response_metadata?.tool_meta?.name
                  ? message.response_metadata.tool_meta.name
                  : message.response_metadata?.tool_name,
              original_name: ChatHelpers.getToolActionOriginalName(metadata),
              parent_agent_name: metadata?.parent_agent_name,
              id: message.response_metadata?.tool_run_id,
              status: ToolActionStatus.processing,
              message: '',
              toolInputs: message.response_metadata?.tool_inputs,
              toolOutputs: message.response_metadata?.tool_outputs,
              toolMeta,
              created_at: message.response_metadata?.timestamp_start || message.created_at,
              type:
                socketMessageType === SocketMessageType.AgentLlmStart
                  ? TOOL_ACTION_TYPES.Llm
                  : TOOL_ACTION_TYPES.Tool,
            });
          }
          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        }
        case SocketMessageType.AgentThinkingStepUpdate: {
          if (msg.toolActions === undefined) {
            msg.toolActions = [];
          }
          t = msg.toolActions.find(i => i.id === message.response_metadata?.tool_run_id);
          if (t) {
            // const newData = message.response_metadata?.tool_output
            t.message = convertJsonToString(message.response_metadata?.message, true);
            t.markdown = message.response_metadata?.markdown || false;
            // Update toolMeta if provided (needed for toolkit badge display)
            if (message.response_metadata?.tool_meta) {
              t.toolMeta = { ...t.toolMeta, ...message.response_metadata.tool_meta };
            }
          }
          break;
        }
        case SocketMessageType.AgentThinkingStep: {
          if (msg.toolActions === undefined) {
            msg.toolActions = [];
          }
          // Find the tool action by tool_run_id (not thinking_step_ prefixed)
          const toolRunId = message?.response_metadata?.tool_run_id;
          const toolAction = msg.toolActions.find(i => i.id === toolRunId);

          if (!toolAction) {
            // If tool action doesn't exist yet (thinking step arrived before tool_start), create it
            const thinkingStepRunId = 'thinking_step_' + toolRunId || '' + v4();
            msg.toolActions?.push({
              name: TOOL_ACTION_NAMES.Toolkit,
              id: thinkingStepRunId,
              status: ToolActionStatus.processing,
              toolInputs: message.response_metadata?.tool_inputs,
              toolOutputs: message.response_metadata?.tool_outputs,
              toolMeta: { ...(message.response_metadata?.metadata || {}) },
              responseMetadata: message.response_metadata,
              created_at: message.created_at,
              type: TOOL_ACTION_TYPES.Toolkit,
              markdown: message?.response_metadata?.markdown || true,
              renderHtml: message?.response_metadata?.render_html || false,
              message: message?.response_metadata?.message,
              content: '',
            });
          } else {
            // Update the existing tool action's message field with the latest progress
            toolAction.message = message?.response_metadata?.message;
            toolAction.markdown = message?.response_metadata?.markdown || true;
          }
          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        }
        // add new events here
        case SocketMessageType.AgentToolEnd:
          t = msg.toolActions?.find(i => i.id === response_metadata?.tool_run_id);
          if (t) {
            const newData = message.response_metadata?.tool_output;
            if (typeof newData === 'string') {
              t.toolOutputs = (t.toolOutputs || '') + convertJsonToString(newData, true);
            } else if (typeof newData === 'object' && newData !== null) {
              t.toolOutputs = {
                ...(t.toolOutputs || {}),
                ...newData,
              };
            }

            // Store MCP session_id if present in metadata (may be newly created)
            const metadata = message.response_metadata?.metadata;
            if (metadata?.mcp_session_id && metadata?.mcp_server_url) {
              McpAuthHelpers.setSessionId(metadata.mcp_server_url, metadata.mcp_session_id);
            }

            Object.assign(t, {
              message: undefined, // we clear status messages when the tool ends
              content: convertJsonToString(message?.content ?? ''),
              status: ToolActionStatus.complete,
              ended_at: message.response_metadata.timestamp_finish || message.created_at,
              created_at: message.response_metadata.timestamp_start || t.created_at,
            });
          }
          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        case SocketMessageType.AgentToolError:
          t = msg.toolActions?.find(i => i.id === response_metadata?.tool_run_id);
          if (t) {
            Object.assign(t, {
              content: convertJsonToString(message?.content ?? ''),
              status: ToolActionStatus.error,
              ended_at: message.created_at,
              isError: true,
            });
          }
          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        case SocketMessageType.McpAuthorizationRequired: {
          if (msg.toolActions === undefined) {
            msg.toolActions = [];
          }
          const toolRunId = response_metadata?.tool_run_id || v4();
          const existingAction = msg.toolActions.find(i => i.id === toolRunId);
          const resourceMetadataUrl = response_metadata?.resource_metadata_url;
          const toolName = response_metadata?.tool_name || 'MCP toolkit';
          const serverUrl = response_metadata?.server_url || 'MCP server';
          const statusCode = response_metadata?.status || 401;

          // Check if we have authorization servers (either from resource_metadata or directly)
          const authServers =
            response_metadata?.resource_metadata?.authorization_servers ||
            response_metadata?.authorization_servers;
          const hasAuthServers = authServers && authServers.length > 0;

          // Token storage key must match what get_toolkit() looks up in kwargs['tokens'].
          // SharePoint and OpenAPI use a composite key or the oauth discovery endpoint (not server URL).
          // Pre-built MCPs (type starts with "mcp_") use toolkit_type as the key — the backend
          // looks up tokens by server_name / toolkit_name, not by the OAuth server URL.
          // All other toolkits (regular MCP) use serverUrl (the MCP server URL = oauth endpoint).
          const isSharePoint = response_metadata?.resource_metadata?.resource_name === 'SharePoint';
          const isOpenApi = response_metadata?.resource_metadata?.resource_name === 'OpenAPI';
          const configUuid = response_metadata?.resource_metadata?.configuration_uuid;
          const oauthEndpoint = authServers?.[0];
          const toolkitType = response_metadata?.toolkit_type;
          const isPrebuildMcpToolkit =
            typeof toolkitType === 'string' && toolkitType.startsWith('mcp_') && toolkitType !== 'mcp';
          const effectiveServerUrl = isPrebuildMcpToolkit
            ? // Pre-built MCP: use toolkit type as token storage key so backend can match it.
              toolkitType
            : configUuid && oauthEndpoint
              ? // Composite key "{configUuid}:{oauthEndpoint}" — matches SDK primary lookup for
                // any delegated OAuth toolkit where configuration_uuid is present.
                `${configUuid}:${oauthEndpoint}`
              : isSharePoint || isOpenApi
                ? // Delegated OAuth without configUuid: token lives under the discovery endpoint.
                  oauthEndpoint || serverUrl
                : // Regular MCP: the MCP server URL is itself the OAuth endpoint.
                  serverUrl;

          let contentMessage;
          let status;

          if (!hasAuthServers) {
            // Cannot process authorization - show error message
            contentMessage =
              `${statusCode}: Authorization error in "${toolName}" toolkit.\n\n` +
              `The MCP server at ${serverUrl} requires OAuth authorization, but the server ` +
              `did not provide the authorization server configuration. ` +
              `Please contact the server administrator or check the toolkit configuration.`;
            status = ToolActionStatus.error;
          } else {
            // Can process authorization - show normal message
            const baseMessage = convertJsonToString(message?.content ?? 'Authorization required.', true);
            const metadataInfo = resourceMetadataUrl
              ? `\n\nResource metadata: ${resourceMetadataUrl}`
              : `\n\nAuthorization servers: ${authServers.join(', ')}`;
            contentMessage = `${baseMessage}${metadataInfo}`;
            status = ToolActionStatus.actionRequired;
          }

          const toolActionPayload = {
            name: toolName,
            id: toolRunId,
            status,
            toolInputs: undefined,
            toolOutputs: hasAuthServers
              ? {
                  resource_metadata_url: resourceMetadataUrl || null,
                  authorization_servers: authServers,
                  server_url: effectiveServerUrl,
                }
              : undefined,
            toolMeta: response_metadata,
            created_at: message.created_at,
            ended_at: message.created_at,
            type: TOOL_ACTION_TYPES.Toolkit,
            markdown: false,
            renderHtml: false,
            content: contentMessage,
          };

          if (existingAction) {
            // Create new array with updated action to trigger React re-render
            msg.toolActions = msg.toolActions.map(action =>
              action.id === existingAction.id ? { ...action, ...toolActionPayload } : action,
            );
          } else {
            // Create new array reference to trigger React re-render
            msg.toolActions = [...msg.toolActions, toolActionPayload];
          }

          // Stop streaming/loading/regenerating state when auth is required - user needs to take action
          msg.isLoading = false;
          msg.isStreaming = false;
          msg.isRegenerating = false;
          msg.isSending = false;
          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        }
        case SocketMessageType.AgentRequiresConfirmation: {
          // Handle token limit reached - show continue button
          msg.isLoading = false;
          msg.isStreaming = isMonoChattingRef.current;
          msg.isRegenerating = false;
          msg.isSending = false;

          // threadId should already be set on this message from earlier tool events
          // If AgentRequiresConfirmation event includes thread_id, use it to set/override
          const incomingThreadId =
            message.threadId || response_metadata?.metadata?.thread_id || response_metadata?.thread_id;
          if (incomingThreadId) {
            msg.threadId = incomingThreadId;
          }
          // Note: msg.threadId should have been set from AgentResponse or tool events for THIS message
          // If it's not set, that means this message never received events with thread_id

          message.threadId = msg.threadId; // Ensure message also has threadId for event handlers
          msg.requiresConfirmation = {
            message: "Token limit reached mid-response. Press 'Continue' to see more.",
            buttonText: message.content || 'Continue',
          };
          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        }
        case SocketMessageType.AgentHitlInterrupt: {
          // Track 2 fan-out child (#4993): the indexer stamps the child's own
          // thread + sub-agent name into event metadata. Such a pause belongs to
          // ONE child that streams onto the parent's message while its siblings
          // keep running — so it arrives as a separate event per child, must be
          // ACCUMULATED (not replace the others), carries its OWN thread_id for
          // resume routing, and must NOT stop the message's streaming state (the
          // running siblings still need their live boxes + shimmer).
          const hitlMeta = response_metadata?.metadata || {};
          const childThreadId = hitlMeta.child_thread_id || '';
          const isFanoutChild = Boolean(hitlMeta.parent_agent_name && childThreadId);

          if (!isFanoutChild) {
            msg.isLoading = false;
            msg.isStreaming = false;
            msg.isRegenerating = false;
            msg.isSending = false;
          } else {
            // A fan-out child pausing for approval means the overall run is still
            // active: siblings keep streaming and this child awaits a human
            // decision. The parent's park-by-return may have already emitted an
            // AgentResponse/finish_reason that flipped this message to
            // non-streaming — re-arm it so the live thinking view (which hosts the
            // per-child approval cards) keeps rendering instead of stalling.
            msg.isStreaming = true;
            msg.isLoading = false;
            msg.isSending = false;
            // Clear any leftover regenerating flag: if this message was being
            // regenerated when a child paused, leaving it set keeps the UI in a
            // processing state and suppresses the live thinking view.
            msg.isRegenerating = false;
          }

          const hitlThreadId = message.threadId || hitlMeta.thread_id || response_metadata?.thread_id;
          // Only the single-thread (non-fan-out) case parks the whole message on
          // one threadId. A fan-out child resumes on its OWN thread carried per
          // interrupt entry below, so don't clobber msg.threadId with whichever
          // child happened to pause last.
          if (hitlThreadId && !isFanoutChild) {
            msg.threadId = hitlThreadId;
          }
          message.threadId = msg.threadId;
          // Do NOT overwrite msg.content with the interrupt text. The pause
          // state is rendered from the inline HITL card(s) below; leaving
          // content empty until the real agent_response streams avoids a
          // leftover "...requires approval..." bubble lingering after resume.

          // Build a single UI-shaped interrupt entry from a raw interrupt
          // object. A parallel sub-agent fan-out sends one entry per paused
          // child (each carrying its own tool_call_id) in hitl_interrupts;
          // a single pause sends only the legacy top-level fields. For a fan-out
          // child the parent_agent_name / child thread are NOT on the raw
          // interrupt (the child doesn't know it's a child) — they come from the
          // indexer's event-metadata stamp (hitlMeta).
          const buildHitlInterrupt = (raw, fallbackMessage) => ({
            message: raw?.message || fallbackMessage || 'Please review and take action.',
            node_name: raw?.node_name || '',
            available_actions: raw?.available_actions || ['approve', 'reject'],
            routes: raw?.routes || {},
            edit_state_key: raw?.edit_state_key || '',
            guardrail_type: raw?.guardrail_type || '',
            tool_name: raw?.tool_name || '',
            toolkit_name: raw?.toolkit_name || '',
            toolkit_type: raw?.toolkit_type || '',
            action_label: raw?.action_label || '',
            tool_args: raw?.tool_args || null,
            policy_message: raw?.policy_message || '',
            // A fan-out child's tool_call_id arrives in the event-metadata
            // overlay (hitlMeta), NOT on the raw interrupt — the child doesn't
            // know it's a child. Without this fallback the card carries an empty
            // tool_call_id, so onHitlResume can't match the decided entry, falls
            // out of the fan-out branch, and blanks the whole message (#4993).
            tool_call_id: raw?.tool_call_id || hitlMeta.tool_call_id || '',
            child_thread_id: raw?.child_thread_id || childThreadId || '',
            // Sub-agent the paused action originated from; used to group N
            // stacked approval cards by sub-agent name (issue #4993).
            parent_agent_name: raw?.parent_agent_name || hitlMeta.parent_agent_name || '',
            // Per-entry thread to route resume to this child's OWN thread
            // (Track 2). Empty for single-thread pauses (resume uses msg.threadId).
            thread_id: raw?.thread_id || childThreadId || '',
          });

          const fallbackMessage = response_metadata?.message || message.content;
          const rawInterrupts = Array.isArray(response_metadata?.hitl_interrupts)
            ? response_metadata.hitl_interrupts
            : [];

          let incomingInterrupts;
          if (rawInterrupts.length > 0) {
            incomingInterrupts = rawInterrupts.map(raw => buildHitlInterrupt(raw, fallbackMessage));
          } else {
            // Single-pause path: synthesize one entry from the legacy
            // top-level + nested hitl_interrupt fields.
            const singleRaw = {
              message: response_metadata?.message,
              node_name: response_metadata?.node_name,
              available_actions: response_metadata?.available_actions,
              routes: response_metadata?.routes,
              edit_state_key: response_metadata?.edit_state_key,
              guardrail_type: response_metadata?.hitl_interrupt?.guardrail_type,
              tool_name: response_metadata?.hitl_interrupt?.tool_name,
              toolkit_name: response_metadata?.hitl_interrupt?.toolkit_name,
              toolkit_type: response_metadata?.hitl_interrupt?.toolkit_type,
              action_label: response_metadata?.hitl_interrupt?.action_label,
              tool_args: response_metadata?.hitl_interrupt?.tool_args,
              policy_message: response_metadata?.hitl_interrupt?.policy_message,
              tool_call_id: response_metadata?.hitl_interrupt?.tool_call_id,
            };
            incomingInterrupts = [buildHitlInterrupt(singleRaw, fallbackMessage)];
          }

          if (isFanoutChild) {
            // Merge this child's pause into the running set (keyed by its own
            // thread, falling back to tool_call_id) so a second child pausing
            // doesn't erase the first child's still-pending card.
            const keyOf = e => e.child_thread_id || e.thread_id || e.tool_call_id;
            const merged = Array.isArray(msg.hitlInterrupts) ? [...msg.hitlInterrupts] : [];
            incomingInterrupts.forEach(inc => {
              const k = keyOf(inc);
              const at = k ? merged.findIndex(e => keyOf(e) === k) : -1;
              if (at >= 0) merged[at] = inc;
              else merged.push(inc);
            });
            msg.hitlInterrupts = merged;
          } else if (rawInterrupts.length > 0) {
            // True backend parallel aggregate (Track 1): N entries arrive in
            // hitl_interrupts. Populate the array so ChatBox routes resume via
            // hitl_decisions (keyed by tool_call_id).
            msg.hitlInterrupts = incomingInterrupts;
          } else {
            // Legacy single pause: leave hitlInterrupts UNSET. ChatBox's
            // isParallel detection keys off the mere presence of the array; a
            // single pause must keep the sequential hitl_action resume shape.
            // ApplicationAnswer falls back to [hitlInterrupt] for rendering.
            msg.hitlInterrupts = undefined;
          }
          // Keep the singular field populated with the first entry for
          // back-compat with consumers that read hitlInterrupt, and as the sole
          // carrier for the legacy single-pause path above. Prefer the merged
          // array head (fan-out) so it tracks the first still-pending child.
          msg.hitlInterrupt =
            (Array.isArray(msg.hitlInterrupts) && msg.hitlInterrupts[0]) || incomingInterrupts[0];
          trackEvent(GA_EVENT_NAMES.HITL_INTERRUPT, {
            [GA_EVENT_PARAMS.AGENT_ID]:
              (participantsRef.current?.find(p => p.id === participant_id) || activeParticipantRef.current)
                ?.entity_meta?.id || 'unknown',
            [GA_EVENT_PARAMS.NODE_NAME]: response_metadata?.node_name || 'unknown',
            [GA_EVENT_PARAMS.GUARDRAIL_TYPE]: response_metadata?.hitl_interrupt?.guardrail_type || 'none',
            [GA_EVENT_PARAMS.TOOL_NAME]: response_metadata?.hitl_interrupt?.tool_name || 'unknown',
            [GA_EVENT_PARAMS.TOOLKIT_NAME]: response_metadata?.hitl_interrupt?.toolkit_name || 'unknown',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        }
        case SocketMessageType.References:
          msg.references = message.references;
          break;
        case SocketMessageType.Error:
          msg.isLoading = false;
          msg.isStreaming = false;
          msg.isSending = false;
          trackEvent(GA_EVENT_NAMES.CHAT_ERROR, {
            [GA_EVENT_PARAMS.ERROR_TYPE]: 'socket_error',
            [GA_EVENT_PARAMS.ERROR_CONTENT]: String(message.content || '').substring(0, 100),
            [GA_EVENT_PARAMS.AGENT_ID]:
              (participantsRef.current?.find(p => p.id === participant_id) || activeParticipantRef.current)
                ?.entity_meta?.id || 'unknown',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
          handleError({ data: message.content || [] });
          return;
        case SocketMessageType.AgentException: {
          // A fan-out child (#4993) carries its own thread + sub-agent name in
          // the event-metadata overlay. Its hard LLM/provider exception belongs
          // to ONE child whose siblings may still be running — route it into
          // that child's accordion (keyed by sub-agent name) instead of the
          // whole-message exception box, which would misleadingly mark the
          // entire orchestrator run as failed. Keep the message streaming so the
          // running siblings retain their live view (mirrors the HITL re-arm).
          const exMeta = response_metadata?.metadata || {};
          const exChildName = exMeta.parent_agent_name || '';
          const isFanoutChildException = Boolean(exChildName && exMeta.child_thread_id);

          if (isFanoutChildException) {
            msg.isLoading = false;
            msg.isSending = false;
            msg.isRegenerating = false;
            msg.isStreaming = true;
            msg.subAgentErrors = {
              ...(msg.subAgentErrors || {}),
              [exChildName]: { exception: message.content },
            };
          } else {
            msg.isLoading = false;
            msg.isStreaming = false;
            msg.exception = message.content;
          }
          trackEvent(GA_EVENT_NAMES.AGENT_EXCEPTION, {
            [GA_EVENT_PARAMS.ERROR_TYPE]: 'agent_exception',
            [GA_EVENT_PARAMS.ERROR_CONTENT]: String(message.content || '').substring(0, 100),
            [GA_EVENT_PARAMS.AGENT_ID]:
              (participantsRef.current?.find(p => p.id === participant_id) || activeParticipantRef.current)
                ?.entity_meta?.id || 'unknown',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        }
        case SocketMessageType.LlmError: {
          msg.isLoading = false;
          msg.isStreaming = false;
          msg.exception = message.content;
          const llmErrorParticipant =
            participantsRef.current?.find(p => p.id === participant_id) || activeParticipantRef.current;
          trackEvent(GA_EVENT_NAMES.LLM_ERROR, {
            [GA_EVENT_PARAMS.ERROR_TYPE]: 'llm_error',
            [GA_EVENT_PARAMS.ERROR_CONTENT]: String(message.content || '').substring(0, 100),
            [GA_EVENT_PARAMS.AGENT_ID]: llmErrorParticipant?.entity_meta?.id || 'unknown',
            [GA_EVENT_PARAMS.MODEL_NAME]: llmErrorParticipant?.entity_settings?.model_name || 'unknown',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
          break;
        }
        case SocketMessageType.Freeform:
          break;
        case SocketMessageType.AgentStart:
          // For attachment indexing events, initialize and add message to chat history
          if (msgIndex === -1 && sio_event === 'chat_predict_attachment') {
            msg.isLoading = true;
            msg.isStreaming = true;
            msg.content = '';
            msg.role = ROLES.Assistant;
            msg.question_id = question_id; // Set question_id for duplicate detection
            addMessageToChatHistory({
              msgIndex,
              msg,
              setChatHistoryRef,
              participantsRef,
              question_id,
              participant_id,
              activeParticipantRef,
            });
          }
          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        case SocketMessageType.SwarmChildMessage: {
          // Handle swarm child agent message - add as tool action on parent message
          const {
            message_id: childMessageId,
            parent_message_id: parentMessageId,
            agent_name: agentName,
            content: childContent,
            created_at: createdAt,
          } = message;

          // Extract text from content blocks (backend sends Anthropic-format content blocks)
          // Content may be: string, array of {text: "..."} and/or {type: "tool_use", ...} blocks
          let childContentStr = '';
          if (typeof childContent === 'string') {
            childContentStr = childContent;
          } else if (Array.isArray(childContent)) {
            childContentStr = childContent
              .filter(block => block?.text || typeof block === 'string')
              .map(block => (typeof block === 'string' ? block : block.text))
              .join('\n');
          } else if (childContent && typeof childContent === 'object') {
            childContentStr = childContent.text || convertJsonToString(childContent);
          }

          // Skip if no meaningful text content (e.g., tool_use-only messages)
          if (!childContentStr?.trim()) {
            return;
          }

          // Create swarm child tool action
          const swarmChildAction = {
            id: childMessageId,
            name: agentName,
            status: ToolActionStatus.complete,
            toolInputs: '',
            toolOutputs: childContentStr,
            toolMeta: {
              agent_name: agentName,
            },
            created_at: createdAt ? new Date(convertTime(createdAt)).getTime() : Date.now(),
            ended_at: createdAt ? new Date(convertTime(createdAt)).getTime() : Date.now(),
            timestamp: createdAt ? new Date(convertTime(createdAt)).getTime() : Date.now(),
            content: childContentStr,
            type: TOOL_ACTION_TYPES.SwarmChild,
            markdown: true,
          };

          // Add to parent message's toolActions
          // IMPORTANT: Directly mutate the ref object (matching how Chunk/AgentResponse handlers work)
          // so that subsequent socket events see the SwarmChild immediately via chatHistoryRef.
          // Without this, the stale ref would cause addMessageToChatHistory to overwrite toolActions.
          {
            let parentMsg = chatHistoryRef.current?.find(m => m.id === parentMessageId);
            if (!parentMsg) {
              parentMsg = chatHistoryRef.current?.find(m => m.isStreaming || m.isLoading);
            }
            if (parentMsg) {
              parentMsg.toolActions = [...(parentMsg.toolActions || []), swarmChildAction];
            }
          }
          // Also trigger a React state update so the UI re-renders
          setChatHistoryRef.current?.(prevHistory => [...prevHistory]);
          return;
        }
        case SocketMessageType.AgentOnFunctionToolNode:
        case SocketMessageType.AgentOnToolNode:
        case SocketMessageType.AgentOnTransitionalEdge:
        case SocketMessageType.PipelineFinish:
        case SocketMessageType.AgentOnDecisionEdge:
        case SocketMessageType.AgentOnConditionalEdge:
          onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          break;
        case SocketMessageType.ChatPredictSummaryStarted: {
          msg.isLoading = true;
          msg.isStreaming = true;
          msg.isSending = false;
          msg.isRegenerating = undefined;
          msg.content = '';
          msg.references = [];
          msg.task_id = task_id;
          msg.participant_id = participant_id;
          msg.question_id = question_id;
          msg.requiresConfirmation = undefined; // Clear confirmation state when task resumes
          msg.hitlInterrupt = undefined; // Clear HITL state when task resumes
          // Find the question message to populate replyTo with complete information
          if (!msg.replyTo) {
            const questionMessage = chatHistoryRef.current.find(m => m.id === question_id);
            if (questionMessage) {
              msg.replyTo = {
                ...questionMessage,
              };
            } else {
              msg.replyTo = { uuid: question_id };
            }
          }
          if (msg.toolActions === undefined) {
            msg.toolActions = [];
          }
          const { payload } = message;
          const thinkingStepRunId = 'thinking_step_' + payload?.response_metadata?.tool_run_id || '' + v4();
          msg.toolActions?.push({
            name: TOOL_ACTION_NAMES.Summary,
            id: thinkingStepRunId,
            status: ToolActionStatus.processing,
            toolInputs: undefined,
            toolOutputs: undefined,
            toolMeta: {
              ls_model_name: payload?.llm_settings?.model_name || '',
            },
            created_at: new Date().getTime(),
            type: TOOL_ACTION_TYPES.Summary,
            markdown: true,
            renderHtml: false,
            message: 'Summarizing the chat history...',
            content: '',
          });
          addMessageToChatHistory({
            msgIndex,
            msg,
            setChatHistoryRef,
            participantsRef,
            question_id,
            participant_id,
            activeParticipantRef,
          });
          break;
        }
        case SocketMessageType.ChatPredictSummaryFinished: {
          t = msg.toolActions?.find(
            i => i.type === TOOL_ACTION_TYPES.Summary && i.status === ToolActionStatus.processing,
          );
          if (t) {
            Object.assign(t, {
              message: undefined, // we clear status messages when the tool ends
              content: '',
              status: ToolActionStatus.complete,
              ended_at: new Date().getTime(),
            });
          }
          break;
        }
        case SocketMessageType.AgentSwarmAgentStart:
        case SocketMessageType.AgentSwarmAgentResponse:
        case SocketMessageType.AgentSwarmHandoff:
          // Raw swarm events forwarded by the backend - no UI action needed.
          // The actual UI rendering is handled via SwarmChildMessage above.
          break;
        default:
          if (socketMessageType?.startsWith('agent_on')) {
            onRcvAgentEventRef.current && onRcvAgentEventRef.current({ ...message });
          }

          // eslint-disable-next-line no-console
          console.warn('unknown message type', socketMessageType);
          return;
      }
      // This runs on EVERY socket message, even if msg hasn't changed
      msgIndex > -1 &&
        setChatHistoryRef.current?.(prevState => {
          const newState = [...prevState];
          newState[msgIndex] = { ...msg }; // Create new object reference for React to detect change
          return newState;
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getMessage, handleError],
  );

  const { subscribeEvent, leaveEvent } = useSocketEvents();

  const { emit } = useSocket(subscribeEvent, handleSocketEvent);
  useSocket(sioEvents.chat_predict_attachment, handleSocketEvent);

  const handleSocketErrorEvent = useCallback(
    async message => {
      const { message_id, type: socketMessageType } = message;

      switch (socketMessageType) {
        case SocketMessageType.Error:
        default:
          // Handle all socket validation errors by displaying in chat with red border
          setChatHistoryRef.current?.(prevState => {
            return [
              ...prevState.map(item => {
                if (item.question_id === message_id) {
                  return {
                    ...item,
                    exception: message.content,
                    isLoading: false,
                    isStreaming: false,
                    isRegenerating: false,
                    isSending: false,
                  };
                }
                if (item.id === message_id) {
                  return {
                    ...item,
                    isLoading: false,
                    isStreaming: false,
                    isRegenerating: false,
                    isSending: false,
                  };
                }
                return item;
              }),
            ];
          });
          // Show both toast notification AND display in chat with red border
          trackEvent(GA_EVENT_NAMES.SOCKET_VALIDATION_ERROR, {
            [GA_EVENT_PARAMS.ERROR_TYPE]: 'socket_validation_error',
            [GA_EVENT_PARAMS.ERROR_CONTENT]: String(message.content || '').substring(0, 100),
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
          handleError({ data: message.content || [] });
          return;
      }
    },
    [handleError, trackEvent],
  );

  useSocket(sioEvents.socket_validation_error, handleSocketErrorEvent);

  const { emit: emitLeaveRoom } = useManualSocket(leaveEvent);

  return {
    chatHistoryRef,
    emit,
    emitLeaveRoom,
    completionResult,
    setCompletionResult,
  };
};

export const useChatMessageSyncSocket = ({ onRemoteChatMessageSync }) => {
  const onRemoteChatMessageSyncRef = useRef(onRemoteChatMessageSync);

  useEffect(() => {
    onRemoteChatMessageSyncRef.current = onRemoteChatMessageSync;
  }, [onRemoteChatMessageSync]);

  const handleSocketEvent = useCallback(async message => {
    onRemoteChatMessageSyncRef.current(message);
  }, []);

  useSocket(sioEvents.chat_message_sync, handleSocketEvent);
};

export const useChatMessageDeleteSocket = ({ onRemoteDeleteMessage }) => {
  const onRemoteDeleteMessageRef = useRef(onRemoteDeleteMessage);

  useEffect(() => {
    onRemoteDeleteMessageRef.current = onRemoteDeleteMessage;
  }, [onRemoteDeleteMessage]);

  const handleSocketEvent = useCallback(async message => {
    const { message_group_uid } = message;
    onRemoteDeleteMessageRef.current(message_group_uid);
  }, []);

  useSocket(sioEvents.chat_message_delete, handleSocketEvent);
};

export const useChatMessageDeleteAllSocket = ({ onRemoteDeleteAllMessages }) => {
  const onRemoteDeleteAllMessagesRef = useRef(onRemoteDeleteAllMessages);

  useEffect(() => {
    onRemoteDeleteAllMessagesRef.current = onRemoteDeleteAllMessages;
  }, [onRemoteDeleteAllMessages]);

  const handleSocketEvent = useCallback(async message => {
    const { conversation_id } = message;
    onRemoteDeleteAllMessagesRef.current(conversation_id);
  }, []);

  useSocket(sioEvents.chat_message_delete_all, handleSocketEvent);
};

export const useChatParticipantDeleteSocket = ({ onRemoteDeleteParticipant }) => {
  const onRemoteDeleteParticipantRef = useRef(onRemoteDeleteParticipant);

  useEffect(() => {
    onRemoteDeleteParticipantRef.current = onRemoteDeleteParticipant;
  }, [onRemoteDeleteParticipant]);

  const handleSocketEvent = useCallback(async message => {
    const { conversation_id, participant_id } = message;
    onRemoteDeleteParticipantRef.current(conversation_id, participant_id);
  }, []);

  useSocket(sioEvents.chat_participant_delete, handleSocketEvent);
};

export const useChatParticipantUpdateSocket = ({ onRemoteUpdateParticipant }) => {
  const onRemoteUpdateParticipantRef = useRef(onRemoteUpdateParticipant);

  useEffect(() => {
    onRemoteUpdateParticipantRef.current = onRemoteUpdateParticipant;
  }, [onRemoteUpdateParticipant]);

  const handleSocketEvent = useCallback(async participant => {
    onRemoteUpdateParticipantRef.current(participant);
  }, []);

  useSocket(sioEvents.chat_participant_update, handleSocketEvent);
};

export const useChatConversationNameUpdateSocket = ({ onRemoteUpdateConversationName }) => {
  const onRemoteUpdateConversationNameRef = useRef(onRemoteUpdateConversationName);

  useEffect(() => {
    onRemoteUpdateConversationNameRef.current = onRemoteUpdateConversationName;
  }, [onRemoteUpdateConversationName]);

  const handleSocketEvent = useCallback(async data => {
    onRemoteUpdateConversationNameRef.current(data);
  }, []);

  useSocket(sioEvents.chat_conversation_name_updated, handleSocketEvent);
};
