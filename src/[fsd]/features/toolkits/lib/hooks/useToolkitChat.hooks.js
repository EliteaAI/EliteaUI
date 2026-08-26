import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

import {
  IndexStatuses,
  IndexesToolsEnum,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  generateChatMessageBasedOnResponse,
  generateMockMessageTemplate,
  generateWelcomeMessage,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { useIndexHistory } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { ToolkitChatModesEnum } from '@/[fsd]/features/toolkits/lib/constants';
import { ToolkitChatHelpers, ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import {
  createToolkitConversationWithParticipant,
  findToolkitParticipant,
} from '@/[fsd]/features/toolkits/lib/helpers/toolkitConversation.helpers';
import { useToolkitSocketContext } from '@/[fsd]/shared/lib/context';
import { generateLLMSettings, resetLLMSettingsForModel } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import {
  useAddParticipantIntoConversationMutation,
  useConversationCreateMutation,
  useListModelsQuery,
  useStopIndexingItemMutation,
} from '@/api';
import { SocketMessageType, sioEvents } from '@/common/constants';
import { convertConversationToChatHistory } from '@/common/convertChatConversationMessages';
import { generateMessagePayload } from '@/common/messagePayloadUtils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSocket, { useManualSocket } from '@/hooks/useSocket';
import useToast from '@/hooks/useToast';

export const useToolkitChat = props => {
  const runningToolRef = useRef(null);
  const { toastSuccess, toastError } = useToast();
  const projectId = useSelectedProjectId();

  // Get toolkit socket context to check if auth check is in progress
  const { isAuthCheckSession } = useToolkitSocketContext();

  const {
    toolkitId,
    runTool,
    isValidForm,
    toolInputVariables,
    toolSchema,
    index,
    indexConfigOverride,
    traceNewIndex,
    refetchIndexesList,
    cancelIndexingCallback,
    values,
    modes,
    onMcpAuthRequired,
    initialConversation,
    isCreating,
  } = props;

  // Keep callback ref updated
  const onMcpAuthRequiredRef = useRef(onMcpAuthRequired);
  useEffect(() => {
    onMcpAuthRequiredRef.current = onMcpAuthRequired;
  }, [onMcpAuthRequired]);

  const isTestToolsMode = useMemo(() => modes.includes(ToolkitChatModesEnum.testTools), [modes]);
  const isCreateIndexMode = useMemo(() => modes.includes(ToolkitChatModesEnum.createIndex), [modes]);

  // Indexes API and data fetching
  const [stopIndex, { isLoading: isStoppingIndexing }] = useStopIndexingItemMutation();

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
  const conversationGenerationRef = useRef(0);

  // Action state
  const [isRunning, setIsRunning] = useState(false);
  const runGenerationRef = useRef(0);
  const [activeTaskId, setActiveTaskId] = useState(index?.metadata?.task_id ?? null);
  const seededIndexIdRef = useRef(index?.id ?? null);
  const [isWaitingForTaskStart, setIsWaitingForTaskStart] = useState(false);
  const isIndexing = useMemo(() => index?.metadata?.state === IndexStatuses.progress, [index]);
  const canStopIndexing = useMemo(
    () => Boolean(activeTaskId) && !isWaitingForTaskStart,
    [activeTaskId, isWaitingForTaskStart],
  );

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
      if (isTestToolsMode) return setIsRunning(false);

      if (runningToolRef.current === IndexesToolsEnum.indexData) {
        setIsWaitingForTaskStart(false);
      }

      setTimeout(() => {
        if (runningToolRef.current && runningToolRef.current !== IndexesToolsEnum.indexData) return;

        if (traceNewIndex)
          traceNewIndex(index?.id ?? null, {
            state,
          });

        refetchIndexesList();
      }, 500);

      setIsRunning(false);
    },
    [refetchIndexesList, isTestToolsMode, index, traceNewIndex],
  );

  const onStartTask = useCallback(
    taskId => {
      if (isTestToolsMode) return;

      if (taskId) setActiveTaskId(taskId);

      if (runningToolRef.current === IndexesToolsEnum.indexData) {
        setIsWaitingForTaskStart(false);
      }

      traceNewIndex(index?.id ?? null, {
        task_id: taskId,
      });
    },
    [index?.id, isTestToolsMode, traceNewIndex],
  );

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
        // Reset running state so the retry triggered by onSuccess can proceed; nothing
        // else clears the waiting flag on an aborted start, and it gates Delete.
        setIsRunning(false);
        setIsWaitingForTaskStart(false);
        if (onMcpAuthRequiredRef.current) {
          onMcpAuthRequiredRef.current(message);
        }
        return;
      }

      // Call onStartTask here (outside the setChatHistory updater) so that
      // traceNewIndex → setReindexRunning (parent state) is never called from
      // inside a React state-updater function, which would trigger the
      // "Cannot update a component while rendering" warning.
      if (message.type === SocketMessageType.StartTask) {
        const { task_id } = message.content instanceof Object ? message.content : {};
        onStartTask(task_id);
      }

      setChatHistory(prev =>
        generateChatMessageBasedOnResponse({
          message,
          chatHistory: prev,
          onFinish: onRunFinish,
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

  useEffect(() => {
    const indexChanged = seededIndexIdRef.current !== (index?.id ?? null);
    seededIndexIdRef.current = index?.id ?? null;
    // A refetch can return the row with task_id wiped mid-run (lost update on the
    // shared blob) — a null row value must not clobber the socket-provided id.
    const rowTaskId = index?.metadata?.task_id ?? null;
    if (indexChanged || rowTaskId) {
      setActiveTaskId(rowTaskId);
    }

    if (index?.metadata?.state !== IndexStatuses.progress || index?.metadata?.task_id) {
      setIsWaitingForTaskStart(false);
    }
  }, [index?.id, index?.metadata?.task_id, index?.metadata?.state]);

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
      const requestGeneration = conversationGenerationRef.current;
      const runGeneration = runGenerationRef.current;

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

        const isCurrentGeneration = conversationGenerationRef.current === requestGeneration;

        if (conversation && isCurrentGeneration) {
          setActiveConversation(conversation);
        }

        return conversation;
      } catch {
        if (runGenerationRef.current === runGeneration) {
          setIsRunning(false);
          setIsWaitingForTaskStart(false);
        }

        return null;
      }
    },
    [createConversation, addParticipant, toolkitId, projectId, values, llmSettings, selectedModel],
  );

  const executeRunTool = useCallback(
    async ({ relevantInputVariables, indexing, tool }) => {
      const runGeneration = runGenerationRef.current;

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

          if (traceNewIndex)
            traceNewIndex(index?.id ?? null, {
              conversation_id: currentConversation.id,
              conversation_uuid: currentConversation.uuid,
            });
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

        const rawToolParams =
          typeof relevantInputVariables === 'object' && !Array.isArray(relevantInputVariables)
            ? relevantInputVariables
            : {};

        // Strip optional params left empty by the user so they're omitted from the call
        // rather than sent as null/'' — matching how an agent invokes the same tool (#6263).
        const toolParams = toolSchema
          ? ToolkitChatHelpers.sanitizeToolParams(toolSchema, rawToolParams)
          : rawToolParams;

        const specificToolkitPayload = {
          ...commonPayload,
          tool_call_input: {
            tool_name: tool,
            tool_params: toolParams,
          },
        };

        socketEmit(specificToolkitPayload);
      } catch (error) {
        if (runGenerationRef.current !== runGeneration) return;

        setIsRunning(false);
        setIsWaitingForTaskStart(false);

        if (traceNewIndex && indexing)
          traceNewIndex(index?.id ?? null, {
            collection: relevantInputVariables.index_name,
            state: IndexStatuses.fail,
          });

        let errorMessage;

        if (error?.message) errorMessage = error.message;
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
      toolSchema,
      setProgressingIndexHistoryRecovered,
      createToolkitConversation,
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
        runGenerationRef.current += 1;
        setIsRunning(true);
        runningToolRef.current = tool;

        if (indexing) {
          setActiveTaskId(null);
          setIsWaitingForTaskStart(true);
        }

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
      if (!canStopIndexing) {
        return;
      }

      const resolvedTaskId = activeTaskId;

      const result = await stopIndex({
        projectId,
        toolkitId,
        indexName: index.metadata.collection,
        taskId: resolvedTaskId,
      }).unwrap();

      // The row can be gone entirely (deleted from another tab) — the caller's goal is
      // met, so clean up as a stop but say what actually happened.
      if (result?.reason === 'not_found') {
        setActiveTaskId(null);
        toastSuccess('Index no longer exists');
        setIsRunning(false);
        setChatHistory(prev => prev.map(msg => ({ ...msg, isStreaming: false, isLoading: false })));
        if (cancelIndexingCallback) cancelIndexingCallback();
        return;
      }

      // A stale task id is a no-op server-side — pretending it stopped would hide a
      // still-running index behind a success toast.
      if (result?.cancelled === false) {
        toastError('Indexing could not be stopped — refresh the page and try again');
        return;
      }

      setActiveTaskId(null);
      toastSuccess('Indexing stopped successfully');
      setIsRunning(false);
      setChatHistory(prev => prev.map(msg => ({ ...msg, isStreaming: false, isLoading: false })));

      if (cancelIndexingCallback) cancelIndexingCallback();
    } catch {
      toastError('Failed to stop indexing');
    }
  }, [
    activeTaskId,
    canStopIndexing,
    index,
    projectId,
    cancelIndexingCallback,
    stopIndex,
    toastError,
    toastSuccess,
    toolkitId,
  ]);

  const handleIndexData = useCallback(() => run(), [run]);

  const handleRunTool = useCallback(() => run(runTool), [run, runTool]);

  const retryLastRun = useCallback(() => {
    if (runningToolRef.current) {
      run(runningToolRef.current);
    } else if (isCreating) {
      run(IndexesToolsEnum.indexData);
    }
  }, [run, isCreating]);

  const handleClearChat = useCallback(() => {
    setChatHistory([generateWelcomeMessage(runTool, isTestToolsMode)]);
    setProgressingIndexHistoryRecovered(false);
  }, [runTool, setProgressingIndexHistoryRecovered, isTestToolsMode]);

  const handleClearActiveConversation = useCallback(() => {
    conversationGenerationRef.current += 1;
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
    isStoppingIndexing,
    isWaitingForTaskStart,
    canStopIndexing,
    handleClearActiveConversation,
    handleClearChat,
    handleIndexData,
    handleRunTool,
    retryLastRun,
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
