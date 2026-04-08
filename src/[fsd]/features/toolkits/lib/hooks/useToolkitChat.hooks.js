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
  generateMockMessageTemplate,
  generateWelcomeMessage,
} from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { useIndexHistory } from '@/[fsd]/features/toolkits/indexes/lib/hooks';
import { ToolkitChatModesEnum } from '@/[fsd]/features/toolkits/lib/constants';
import { ToolkitsHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import {
  createToolkitConversationWithParticipant,
  findToolkitParticipant,
} from '@/[fsd]/features/toolkits/lib/helpers/toolkitConversation.helpers';
import { generateLLMSettings } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import { useListModelsQuery, useStopIndexingItemMutation } from '@/api';
import { useAddParticipantIntoConversationMutation, useConversationCreateMutation } from '@/api/chat';
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
    index,
    traceNewIndex,
    refetchIndexesList,
    cancelIndexingCallback,
    values,
    modes,
    onMcpAuthRequired,
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

  // Action state
  const [isRunning, setIsRunning] = useState(false);
  const isIndexing = useMemo(() => index?.metadata?.state === IndexStatuses.progress, [index]);

  const shouldRecoverHistory = useMemo(
    () =>
      !isCreateIndexMode &&
      index?.metadata?.state === IndexStatuses.progress &&
      index?.metadata?.conversation_id,
    [isCreateIndexMode, index?.metadata],
  );

  const { conversationDetails, needGenerateProgressingIndexHistory, setProgressingIndexHistoryRecovered } =
    useIndexHistory({
      shouldRecover: shouldRecoverHistory,
      conversationId: index?.metadata?.conversation_id,
    });

  useEffect(() => {
    if (needGenerateProgressingIndexHistory) {
      const currentConversationMessages = convertConversationToChatHistory(conversationDetails);
      const prettifiedMessages = ToolkitsHelpers.prettifyToolkitConversation(currentConversationMessages);

      setChatHistory(prettifiedMessages);
      setProgressingIndexHistoryRecovered(true);
      setIsRunning(true);
    }
  }, [
    shouldRecoverHistory,
    conversationDetails,
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
    setLLmSettings(generateLLMSettings(model));
  }, []);

  const onRunFinish = useCallback(
    state => {
      if (isTestToolsMode) return setIsRunning(false);

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

  useEffect(() => {
    if (!conversationDetails?.id || !conversationDetails?.uuid) return;

    const payload = {
      conversation_id: conversationDetails.id,
      conversation_uuid: conversationDetails.uuid,
      project_id: projectId,
    };

    if (isIndexing || isRunning) emitEnterRoom(payload);
    else emitLeaveRoom(payload);
  }, [conversationDetails, emitEnterRoom, emitLeaveRoom, isIndexing, isRunning, projectId]);

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

          if (traceNewIndex)
            traceNewIndex(index?.id ?? null, {
              conversation_id: currentConversation.id,
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
        relevantInputVariables = index.metadata.index_configuration || {};

      if (canProceed) {
        setIsRunning(true);
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
    [isCreateIndexMode, isValidForm, isRunning, toolInputVariables, index, traceNewIndex, executeRunTool],
  );

  const onCancelIndexing = useCallback(async () => {
    try {
      await stopIndex({
        projectId,
        toolkitId,
        indexName: index.metadata.collection,
        taskId: index.metadata.task_id,
      }).unwrap();

      toastSuccess('Indexing stopped successfully');
      setIsRunning(false);

      if (cancelIndexingCallback) cancelIndexingCallback(EditViewTabsEnum.configuration);
    } catch {
      toastError('Failed to stop indexing');
    }
  }, [index, projectId, cancelIndexingCallback, stopIndex, toastError, toastSuccess, toolkitId]);

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
    isStoppingIndexing,
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
