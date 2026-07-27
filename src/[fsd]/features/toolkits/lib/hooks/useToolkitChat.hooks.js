import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { useToolkitSocketContext } from '@/[fsd]/app/providers';
import {
  EditViewTabsEnum,
  IndexStatuses,
  IndexesToolsEnum,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  generateChatMessageBasedOnResponse,
  generateIndexDataPayload,
  generateMockMessageTemplate,
  generateWelcomeMessage,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import {
  INDEX_EXECUTION_COMPLETED_EVENT,
  INDEX_EXECUTION_FAILED_EVENT,
  INDEX_EXECUTION_NODE_EVENT,
  buildIndexExecutionEventsUrl,
  buildPendingIndexExecutionKey,
  parseIndexExecutionEvent,
  parseIndexNodeEvent,
  resolveIndexExecutionState,
  resolveIndexExecutionTaskId,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexExecution.helpers';
import { useIndexHistory } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { ToolkitChatModesEnum } from '@/[fsd]/features/toolkits/lib/constants';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import {
  createToolkitConversationWithParticipant,
  findToolkitParticipant,
} from '@/[fsd]/features/toolkits/lib/helpers/toolkitConversation.helpers';
import { generateLLMSettings, resetLLMSettingsForModel } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import {
  useAddParticipantIntoConversationMutation,
  useConversationCreateMutation,
  useListModelsQuery,
  useStartIndexDataMutation,
  useStopIndexingItemMutation,
} from '@/api';
import { SocketMessageType, VITE_SERVER_URL, sioEvents } from '@/common/constants';
import { convertConversationToChatHistory } from '@/common/convertChatConversationMessages';
import { generateMessagePayload } from '@/common/messagePayloadUtils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSocket, { useManualSocket } from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';

export const useToolkitChat = props => {
  const runningToolRef = useRef(null);
  const indexEventSourceRef = useRef(null);
  const admittedIndexTaskIdRef = useRef(null);
  const { toastSuccess, toastError } = useToast();
  const projectId = useSelectedProjectId();

  // Get toolkit socket context to check if auth check is in progress
  const { isAuthCheckSession } = useToolkitSocketContext();

  const {
    toolkitId,
    runTool,
    isValidForm,
    toolInputVariables,
    index,
    indexConfigOverride,
    traceNewIndex,
    refetchIndexesList,
    cancelIndexingCallback,
    values,
    modes,
    onMcpAuthRequired,
    initialConversation,
  } = props;

  // Keep callback ref updated
  const onMcpAuthRequiredRef = useRef(onMcpAuthRequired);
  useEffect(() => {
    onMcpAuthRequiredRef.current = onMcpAuthRequired;
  }, [onMcpAuthRequired]);

  const isTestToolsMode = useMemo(() => modes.includes(ToolkitChatModesEnum.testTools), [modes]);
  const isCreateIndexMode = useMemo(() => modes.includes(ToolkitChatModesEnum.createIndex), [modes]);
  const currentIndexName = index?.metadata?.collection || toolInputVariables?.index_name;
  const pendingIndexExecutionKey = useMemo(
    () =>
      projectId && toolkitId && currentIndexName
        ? buildPendingIndexExecutionKey({ projectId, toolkitId, indexName: currentIndexName })
        : null,
    [currentIndexName, projectId, toolkitId],
  );

  // Indexes API and data fetching
  const [stopIndex, { isLoading: isStoppingIndexing }] = useStopIndexingItemMutation();
  const [startIndexData] = useStartIndexDataMutation();

  // Conversations API and data fetching
  const [addParticipant] = useAddParticipantIntoConversationMutation();
  const [createConversation] = useConversationCreateMutation();

  const { data: modelsData = { items: [], total: 0 }, isSuccess: modelsFetchSuccess } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );

  const modelList = useMemo(() => modelsData?.items || [], [modelsData.items]);

  const defaultModel = useMemo(() => {
    return modelsData.items.find(model => model.default) || modelsData.items[0] || null;
  }, [modelsData.items]);

  // Configuration state
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [llmSettings, setLLmSettings] = useState(() => generateLLMSettings(defaultModel));

  // Chat state
  const [chatHistory, setChatHistory] = useState([generateWelcomeMessage(runTool, isTestToolsMode)]);
  const [isFullScreenChat, toggleFullScreenChat] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);

  // Action state
  const [isRunning, setIsRunning] = useState(false);
  const [indexExecutionState, setIndexExecutionState] = useState(null);
  const [isStopRequested, setIsStopRequested] = useState(false);
  const effectiveIndexState = resolveIndexExecutionState(index?.metadata?.state, indexExecutionState);
  const isIndexing = effectiveIndexState === IndexStatuses.progress;

  useEffect(() => {
    admittedIndexTaskIdRef.current = null;
    setIndexExecutionState(null);
    setIsStopRequested(false);
  }, [currentIndexName]);

  const shouldRecoverHistory = useMemo(
    () =>
      !isCreateIndexMode &&
      !initialConversation &&
      index?.metadata?.state === IndexStatuses.progress &&
      index?.metadata?.conversation_id,
    [isCreateIndexMode, initialConversation, index?.metadata],
  );

  const {
    conversationDetails,
    traceSteps,
    needGenerateProgressingIndexHistory,
    setProgressingIndexHistoryRecovered,
  } = useIndexHistory({
    shouldRecover: shouldRecoverHistory,
    conversationId: index?.metadata?.conversation_id,
  });

  useEffect(() => {
    if (needGenerateProgressingIndexHistory) {
      const currentConversationMessages = convertConversationToChatHistory(conversationDetails, traceSteps);
      const prettifiedMessages = ToolkitsHelpers.prettifyToolkitConversation(currentConversationMessages);

      setChatHistory(prettifiedMessages);
      setProgressingIndexHistoryRecovered(true);
      setIsRunning(true);
    }
  }, [
    shouldRecoverHistory,
    conversationDetails,
    traceSteps,
    needGenerateProgressingIndexHistory,
    setProgressingIndexHistoryRecovered,
  ]);

  const onSetLLMSettings = useCallback(
    settings =>
      setLLmSettings(prev => ({
        ...prev,
        ...settings,
      })),
    [],
  );

  const onSelectModel = useCallback(model => {
    setSelectedModel(model);
    // Realign only the family pair (temperature/reasoning_effort) — preserve max_tokens and other
    // user-tuned settings (issue #5859).
    setLLmSettings(prev => ({ ...prev, ...resetLLMSettingsForModel(model) }));
  }, []);

  const onRunFinish = useCallback(
    state => {
      setIsRunning(false);

      if (isTestToolsMode) return;

      if (runningToolRef.current && runningToolRef.current !== IndexesToolsEnum.indexData) return;

      setIndexExecutionState(state);
      setIsStopRequested(false);

      if (traceNewIndex)
        traceNewIndex(index?.id ?? null, {
          state,
        });

      if (state === IndexStatuses.cancelled && cancelIndexingCallback)
        cancelIndexingCallback(EditViewTabsEnum.configuration);

      setTimeout(() => {
        refetchIndexesList();
      }, 500);
    },
    [cancelIndexingCallback, index, isTestToolsMode, refetchIndexesList, traceNewIndex],
  );

  const onStartTask = useCallback(
    taskId => {
      if (isTestToolsMode) return;

      traceNewIndex(index?.id ?? null, {
        task_id: resolveIndexExecutionTaskId(taskId, admittedIndexTaskIdRef.current),
      });
    },
    [index?.id, isTestToolsMode, traceNewIndex],
  );

  const onRunFinishRef = useRef(onRunFinish);
  const onStartTaskRef = useRef(onStartTask);
  useEffect(() => {
    onRunFinishRef.current = onRunFinish;
  }, [onRunFinish]);
  useEffect(() => {
    onStartTaskRef.current = onStartTask;
  }, [onStartTask]);

  const closeIndexEventStream = useCallback(() => {
    indexEventSourceRef.current?.close();
    indexEventSourceRef.current = null;
  }, []);

  useEffect(() => closeIndexEventStream, [closeIndexEventStream]);

  const openIndexEventStream = useCallback(
    ({ taskId, messageId, storageKey }) => {
      closeIndexEventStream();

      const loadingMessage = {
        ...generateMockMessageTemplate('🔄 Indexing in progress…', 'toolkit'),
        id: messageId,
        task_id: taskId,
        isLoading: true,
        isStreaming: true,
      };
      setChatHistory(previous => {
        const existing = previous.findIndex(message => message.id === messageId);
        if (existing < 0) return [...previous, loadingMessage];
        const updated = [...previous];
        updated[existing] = { ...updated[existing], ...loadingMessage };
        return updated;
      });

      const source = new EventSource(buildIndexExecutionEventsUrl(VITE_SERVER_URL, projectId, taskId), {
        withCredentials: true,
      });
      admittedIndexTaskIdRef.current = taskId;
      setIndexExecutionState(IndexStatuses.progress);
      indexEventSourceRef.current = source;

      const settle = result => {
        if (indexEventSourceRef.current !== source) return;
        source.close();
        indexEventSourceRef.current = null;
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          // A blocked storage API must not prevent a durable terminal event from settling the UI.
        }
        setChatHistory(previous => {
          const terminalMessage = {
            ...generateMockMessageTemplate(result.content, 'toolkit'),
            id: messageId,
            task_id: taskId,
            isLoading: false,
            isStreaming: false,
          };
          const existing = previous.findIndex(message => message.id === messageId);
          if (existing < 0) return [...previous, terminalMessage];
          const updated = [...previous];
          updated[existing] = { ...updated[existing], ...terminalMessage };
          return updated;
        });
        onRunFinishRef.current(result.state);
      };

      const handleTerminalEvent = event => {
        const result = parseIndexExecutionEvent(event.type, event.data);
        if (result) settle(result);
      };

      const handleNodeEvent = event => {
        if (indexEventSourceRef.current !== source) return;
        const message = parseIndexNodeEvent(event.data, messageId);
        if (!message) return;
        setChatHistory(previous =>
          generateChatMessageBasedOnResponse({
            message,
            chatHistory: previous,
            onStartTask: startedTaskId => onStartTaskRef.current(startedTaskId),
            allowTerminalSideEffects: false,
          }),
        );
      };

      source.addEventListener(INDEX_EXECUTION_NODE_EVENT, handleNodeEvent);
      source.addEventListener(INDEX_EXECUTION_COMPLETED_EVENT, handleTerminalEvent);
      source.addEventListener(INDEX_EXECUTION_FAILED_EVENT, handleTerminalEvent);
      // Native EventSource reconnection carries Last-Event-ID. Preserve the pending execution
      // across connection errors; only a durable named event may settle the run.
    },
    [closeIndexEventStream, projectId],
  );

  useEffect(() => {
    closeIndexEventStream();
    if (!pendingIndexExecutionKey) return undefined;

    let pending;
    try {
      pending = JSON.parse(sessionStorage.getItem(pendingIndexExecutionKey));
    } catch {
      try {
        sessionStorage.removeItem(pendingIndexExecutionKey);
      } catch {
        // Browser storage can be unavailable under restrictive privacy settings.
      }
      return undefined;
    }
    if (!pending?.taskId || !pending?.messageId) return undefined;

    runningToolRef.current = IndexesToolsEnum.indexData;
    admittedIndexTaskIdRef.current = pending.taskId;
    setIndexExecutionState(IndexStatuses.progress);
    setIsRunning(true);
    openIndexEventStream({
      taskId: pending.taskId,
      messageId: pending.messageId,
      storageKey: pendingIndexExecutionKey,
    });
    return closeIndexEventStream;
  }, [closeIndexEventStream, openIndexEventStream, pendingIndexExecutionKey]);

  // Use ref to access isAuthCheckSession in socket callback without adding it as dependency
  const isAuthCheckSessionRef = useRef(isAuthCheckSession);
  useEffect(() => {
    isAuthCheckSessionRef.current = isAuthCheckSession;
  }, [isAuthCheckSession]);

  const handleSocketResponse = useCallback(
    message => {
      // Skip messages if auth check session is active (handled by useMcpAuthCheck)
      if (isAuthCheckSessionRef.current) {
        return;
      }

      // Handle MCP authorization required message
      if (message.type === SocketMessageType.McpAuthorizationRequired) {
        // Reset running state so the retry triggered by onSuccess can proceed
        setIsRunning(false);
        if (onMcpAuthRequiredRef.current) {
          onMcpAuthRequiredRef.current(message);
        }
        return;
      }

      setChatHistory(prev =>
        generateChatMessageBasedOnResponse({
          message,
          chatHistory: prev,
          onFinish: onRunFinish,
          onStartTask,
        }),
      );
    },
    [onRunFinish, onStartTask],
  );

  const { emit: socketEmit } = useSocket(sioEvents.chat_predict, handleSocketResponse);
  const { emit: emitEnterRoom } = useManualSocket(sioEvents.chat_enter_room);
  const { emit: emitLeaveRoom } = useManualSocket(sioEvents.chat_leave_rooms);

  useEffect(() => {
    modelsFetchSuccess && selectedModel === null && setSelectedModel(defaultModel);
  }, [modelsFetchSuccess, defaultModel, selectedModel]);

  // llmSettings is seeded before the model resolves (generateLLMSettings(null) → temperature-only).
  // Realign the family pair once the model is known so a reasoning model never shows/persists a
  // stale temperature (issue #5859).
  useEffect(() => {
    if (!selectedModel) return;
    setLLmSettings(prev => ({ ...prev, ...resetLLMSettingsForModel(selectedModel) }));
  }, [selectedModel]);

  useEffect(() => {
    const conv = conversationDetails ?? initialConversation;
    if (!conv?.id || !conv?.uuid) return;

    const payload = {
      conversation_id: conv.id,
      conversation_uuid: conv.uuid,
      project_id: projectId,
    };

    if (isIndexing || isRunning) emitEnterRoom(payload);
    else emitLeaveRoom(payload);
  }, [
    conversationDetails,
    initialConversation,
    emitEnterRoom,
    emitLeaveRoom,
    isIndexing,
    isRunning,
    projectId,
  ]);

  const createToolkitConversation = useCallback(
    async ({ indexName, configuration, tool }) => {
      try {
        const conversation = await createToolkitConversationWithParticipant({
          createConversation,
          addParticipant,
          toolkitId,
          projectId,
          values,
          llmSettings,
          selectedModel,
          meta: {
            ...(indexName && { index_name: indexName }),
            configuration,
            operation_type: tool,
          },
        });

        if (conversation) {
          setActiveConversation(conversation);
        }

        return conversation;
      } catch {
        setIsRunning(false);
        return null;
      }
    },
    [createConversation, addParticipant, toolkitId, projectId, values, llmSettings, selectedModel],
  );

  const executeIndexData = useCallback(
    async ({ currentConversation, relevantInputVariables, tool }) => {
      if (!currentConversation?.id || !currentConversation?.uuid)
        throw new Error('The index conversation could not be created.');

      const messageId = uuidv4();
      const payload = generateIndexDataPayload({
        projectId,
        values,
        toolInputVariables: relevantInputVariables,
        selectedModel,
        llmSettings,
        tool,
        streamId: currentConversation.uuid,
        messageId,
      });
      const response = await startIndexData({ projectId, ...payload }).unwrap();
      const taskId = response?.task_id;
      if (!taskId) throw new Error('The indexing service returned no task identifier.');
      admittedIndexTaskIdRef.current = taskId;
      setIndexExecutionState(IndexStatuses.progress);
      setIsStopRequested(false);

      const storageKey = buildPendingIndexExecutionKey({
        projectId,
        toolkitId,
        indexName: relevantInputVariables.index_name,
      });
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ taskId, messageId }));
      } catch {
        // The live stream still works when browser storage is disabled; only reload recovery is lost.
      }

      if (!isCreateIndexMode) openIndexEventStream({ taskId, messageId, storageKey });
      if (traceNewIndex)
        traceNewIndex(index?.id ?? null, {
          collection: relevantInputVariables.index_name,
          state: IndexStatuses.progress,
          task_id: taskId,
          conversation_id: currentConversation.id,
          conversation_uuid: currentConversation.uuid,
        });
    },
    [
      index?.id,
      isCreateIndexMode,
      llmSettings,
      openIndexEventStream,
      projectId,
      selectedModel,
      startIndexData,
      toolkitId,
      traceNewIndex,
      values,
    ],
  );

  const executeRunTool = useCallback(
    async ({ relevantInputVariables, indexing, tool }) => {
      try {
        let currentConversation = activeConversation;

        if (!activeConversation || (indexing && !modes.includes(ToolkitChatModesEnum.testTools))) {
          setProgressingIndexHistoryRecovered(true);
          setChatHistory([]);
          currentConversation = await createToolkitConversation({
            indexName: relevantInputVariables.index_name,
            configuration: relevantInputVariables,
            tool,
          });

          if (traceNewIndex && !indexing)
            traceNewIndex(index?.id ?? null, {
              conversation_id: currentConversation.id,
              conversation_uuid: currentConversation.uuid,
            });
        }

        if (indexing) {
          await executeIndexData({ currentConversation, relevantInputVariables, tool });
          return;
        }

        const toolkitParticipant = findToolkitParticipant(currentConversation);

        const commonPayload = generateMessagePayload({
          conversation_uuid: currentConversation?.uuid,
          interaction_uuid: uuidv4(),
          projectId,
          selectedModel,
          participant: toolkitParticipant,
          llmSettings,
          participants: currentConversation?.participants || [],
        });

        const toolParams =
          typeof relevantInputVariables === 'object' && !Array.isArray(relevantInputVariables)
            ? relevantInputVariables
            : {};

        const specificToolkitPayload = {
          ...commonPayload,
          tool_call_input: {
            tool_name: tool,
            tool_params: toolParams,
          },
        };

        socketEmit(specificToolkitPayload);
      } catch (error) {
        setIsRunning(false);

        if (traceNewIndex && indexing)
          traceNewIndex(index?.id ?? null, {
            collection: relevantInputVariables.index_name,
            state: IndexStatuses.fail,
          });

        let errorMessage;

        if (indexing) {
          const responseMessage = error?.data?.message || error?.data?.error;
          errorMessage =
            typeof responseMessage === 'string' ? responseMessage : 'The indexing task could not be started.';
        } else if (error?.message) errorMessage = error.message;
        else if (typeof error === 'string') errorMessage = error;
        else errorMessage = JSON.stringify(error);

        const errorChatMessage = generateMockMessageTemplate(
          `❌ Failed to execute tool "${tool}"\n\n**Error:** ${errorMessage}\n\nPlease check your toolkit configuration and try again.`,
          'toolkit',
        );

        setChatHistory(prev => [...prev, errorChatMessage]);
      }
    },
    [
      activeConversation,
      modes,
      projectId,
      selectedModel,
      llmSettings,
      socketEmit,
      setProgressingIndexHistoryRecovered,
      createToolkitConversation,
      executeIndexData,
      traceNewIndex,
      index?.id,
    ],
  );

  const run = useCallback(
    (tool = IndexesToolsEnum.indexData) => {
      const indexing = tool === IndexesToolsEnum.indexData;
      const canProceed = ((indexing && !isCreateIndexMode) || isValidForm) && !isRunning;

      let relevantInputVariables = toolInputVariables;

      if (!isCreateIndexMode && indexing && index)
        relevantInputVariables = {
          ...(index.metadata.index_configuration || {}),
          ...(indexConfigOverride || {}),
        };
      else if (!indexing && index?.metadata?.collection)
        relevantInputVariables = {
          index_name: index.metadata.collection,
          ...toolInputVariables,
        };

      if (canProceed) {
        setIsRunning(true);
        if (indexing) {
          setIndexExecutionState(IndexStatuses.progress);
          setIsStopRequested(false);
        }
        runningToolRef.current = tool;

        if (traceNewIndex && indexing)
          traceNewIndex(index?.id ?? null, {
            collection: relevantInputVariables.index_name,
            state: IndexStatuses.progress,
            created_on: Date.now() / 1000,
          });

        executeRunTool({ relevantInputVariables, indexing, tool });
      }
    },
    [
      isCreateIndexMode,
      isValidForm,
      isRunning,
      toolInputVariables,
      index,
      indexConfigOverride,
      traceNewIndex,
      executeRunTool,
    ],
  );

  const onCancelIndexing = useCallback(async () => {
    try {
      const taskId = resolveIndexExecutionTaskId(index?.metadata?.task_id, admittedIndexTaskIdRef.current);
      if (!taskId) throw new Error('The indexing task identifier is unavailable.');

      await stopIndex({
        projectId,
        toolkitId,
        indexName: index.metadata.collection,
        taskId,
      }).unwrap();

      setIsStopRequested(true);
      toastSuccess('Stop requested');
    } catch {
      setIsStopRequested(false);
      toastError('Failed to stop indexing');
    }
  }, [index, projectId, stopIndex, toastError, toastSuccess, toolkitId]);

  const handleIndexData = useCallback(() => run(), [run]);

  const handleRunTool = useCallback(() => run(runTool), [run, runTool]);

  const handleClearChat = useCallback(() => {
    setChatHistory([generateWelcomeMessage(runTool, isTestToolsMode)]);
    setProgressingIndexHistoryRecovered(false);
  }, [runTool, setProgressingIndexHistoryRecovered, isTestToolsMode]);

  const handleClearActiveConversation = useCallback(() => {
    setActiveConversation(null);
    setProgressingIndexHistoryRecovered(false);
  }, [setProgressingIndexHistoryRecovered]);

  const stopRunOnIndexChange = useCallback(() => {
    setIsRunning(false);
    setProgressingIndexHistoryRecovered(false);
  }, [setProgressingIndexHistoryRecovered]);

  return {
    activeConversation,
    chatHistory,
    isIndexing,
    isFullScreenChat,
    isRunning,
    isStoppingIndexing: isStoppingIndexing || isStopRequested,
    handleClearActiveConversation,
    handleClearChat,
    handleIndexData,
    handleRunTool,
    llmSettings,
    modelList,
    onCancelIndexing,
    onSelectModel,
    onSetLLMSettings,
    selectedModel,
    stopRunOnIndexChange,
    toggleFullScreenChat,
  };
};
