import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { v4 as uuidv4 } from 'uuid';

import { Box, Grid } from '@mui/material';

import { ChatButton } from '@/[fsd]/features/chat/ui';
import { IndexesToolsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { useLazyGetIndexesListQuery } from '@/api';
import { useListModelsQuery } from '@/api/configurations.js';
import {
  ChatParticipantType,
  ROLES,
  SocketMessageType,
  ToolActionStatus,
  WELCOME_MESSAGE_ID,
} from '@/common/constants.js';
import { convertJsonToString } from '@/common/utils';
import ChatMessageList from '@/components/Chat/ChatMessageList';
import FullScreenToggle from '@/components/Chat/FullScreenToggle';
import { ChatBodyContainer } from '@/components/Chat/StyledComponents';
import useChatCopyToClipboard from '@/hooks/chat/useChatCopyToClipboard';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSocket from '@/hooks/useSocket';
import { ContentContainer } from '@/pages/Common/Components';
import TestSettings from '@/pages/Toolkits/TestSettings.jsx';
import { useTheme } from '@emotion/react';

const ToolkitRightContent = memo(props => {
  const { showAdvancedSettings, isFullScreenChat, setIsFullScreenChat, toolkitId } = props;
  const { values: formValues } = useFormikContext();
  const projectId = useSelectedProjectId();
  const theme = useTheme();
  const boxRef = useRef();
  const [chatHistory, setChatHistory] = useState([]);

  // Generate styles based on current state
  const styles = useMemo(
    () =>
      createStyles({
        showAdvancedSettings,
      }),
    [showAdvancedSettings],
  );
  const [isRunning, setIsRunning] = useState(false);
  const { data: modelsData = { items: [], total: 0 }, isSuccess: modelsFetchSuccess } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: !projectId },
  );
  const modelList = useMemo(() => modelsData?.items || [], [modelsData.items]);
  const defaultModel = useMemo(() => {
    return modelsData.items.find(model => model.default) || modelsData.items[0] || null;
  }, [modelsData.items]);

  const [refetchIndexes] = useLazyGetIndexesListQuery();

  const [llmSettings, selLlmSettings] = useState({
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
    reasoning_effort: DEFAULT_REASONING_EFFORT,
  });

  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolInputVariables, setToolInputVariables] = useState([]);

  const onSelectModel = useCallback(model => {
    setSelectedModel(model);
    selLlmSettings(prev => ({
      ...prev,
      max_tokens: DEFAULT_MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
      reasoning_effort: DEFAULT_REASONING_EFFORT,
    }));
  }, []);

  // Model selection handler
  const onSetLLMSettings = useCallback(values => {
    selLlmSettings(prev => ({
      ...prev,
      ...values,
    }));
  }, []);

  useEffect(() => {
    modelsFetchSuccess && selectedModel === null && setSelectedModel(defaultModel);
  }, [modelsFetchSuccess, defaultModel, selectedModel]);

  // Handle socket response for test_toolkit_tool
  const handleToolkitTestResponse = useCallback(
    message => {
      const { message_id, type: socketMessageType, response_metadata } = message;
      const { task_id } = message.content instanceof Object ? message.content : {};

      setChatHistory(prev => {
        const updatedHistory = [...prev];

        switch (socketMessageType) {
          case SocketMessageType.StartTask: {
            // Add loading message when task starts
            const loadingMessage = {
              id: message_id,
              role: ROLES.Assistant,
              content: `🔄 Testing tool...`,
              isLoading: true,
              isStreaming: true,
              task_id,
              toolActions: [],
              created_at: new Date().getTime(),
              participant_id: 'system',
            };
            return [...updatedHistory, loadingMessage];
          }

          case SocketMessageType.AgentToolStart: {
            // Find message and add tool action
            const msgIndex = updatedHistory.findIndex(msg => msg.id === message_id);
            if (msgIndex >= 0) {
              const msg = updatedHistory[msgIndex];
              if (!msg.toolActions) msg.toolActions = [];

              // Check if tool action already exists to prevent duplicates
              const existingAction = msg.toolActions.find(t => t.id === response_metadata?.tool_run_id);
              if (!existingAction) {
                // Extract and merge metadata from both sources
                // response_metadata.metadata contains toolkit_name and other metadata
                // response_metadata.tool_meta.metadata can contain additional tool-specific metadata
                const mergedMetadata = {
                  ...(response_metadata?.tool_meta || {}),
                  ...(response_metadata?.metadata || {}),
                  ...(response_metadata?.tool_meta?.metadata || {}),
                };

                // Extract toolkit_name from description if not in metadata
                if (!mergedMetadata.toolkit_name && response_metadata?.tool_meta?.description) {
                  const desc = response_metadata.tool_meta.description;
                  // Try pattern: "Toolkit: name" in description
                  const descMatch = desc.match(/(?:^|\n)Toolkit:\s*([^\n]+)/);
                  if (descMatch) {
                    mergedMetadata.toolkit_name = descMatch[1].trim();
                  }
                }

                msg.toolActions.push({
                  name: response_metadata?.tool_name,
                  id: response_metadata?.tool_run_id,
                  status: ToolActionStatus.processing,
                  toolInputs: response_metadata?.tool_inputs,
                  toolMeta: mergedMetadata,
                  created_at: response_metadata?.timestamp_start || message.created_at,
                  type: 'tool',
                });
              }
            }
            return updatedHistory;
          }

          case SocketMessageType.AgentToolEnd: {
            // Find and update tool action
            const toolMsgIndex = updatedHistory.findIndex(msg => msg.id === message_id);
            if (toolMsgIndex >= 0) {
              const msg = updatedHistory[toolMsgIndex];
              const toolAction = msg.toolActions?.find(t => t.id === response_metadata?.tool_run_id);
              if (toolAction) {
                toolAction.status = ToolActionStatus.complete;
                toolAction.toolOutputs = response_metadata?.tool_output;
                toolAction.content = convertJsonToString(message?.content ?? '');
                toolAction.ended_at = response_metadata?.timestamp_finish || message.created_at;

                // Calculate execution time if available
                if (toolAction.created_at && toolAction.ended_at) {
                  const startTime = new Date(toolAction.created_at).getTime();
                  const endTime = new Date(toolAction.ended_at).getTime();
                  toolAction.execution_time_seconds = (endTime - startTime) / 1000;
                }
              }
            }
            return updatedHistory;
          }

          case SocketMessageType.AgentThinkingStepUpdate:
          case SocketMessageType.AgentThinkingStep:
          case SocketMessageType.AgentResponse:
          case SocketMessageType.Chunk:
          case SocketMessageType.AIMessageChunk: {
            // Update main message content
            const responseMsgIndex = updatedHistory.findIndex(msg => msg.id === message_id);
            if (responseMsgIndex >= 0) {
              const msg = updatedHistory[responseMsgIndex];
              // Check content_type to determine if we should wrap in JSON code block
              const contentType = response_metadata?.content_type;
              const shouldWrapInBlock = contentType === 'json';
              msg.content = convertJsonToString(
                message.content || response_metadata.message,
                shouldWrapInBlock,
              );
              msg.isLoading = false;

              if (response_metadata?.finish_reason) {
                msg.isStreaming = false;
                setIsRunning(false);

                if ([IndexesToolsEnum.indexData, IndexesToolsEnum.removeIndex].includes(selectedTool))
                  refetchIndexes({ toolkitId, projectId });

                // Enrich final message with execution time and status
                // NOTE: This formatting is specific to toolkit testing page only
                const toolExecutionSummary =
                  msg.toolActions
                    ?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Sort by creation time
                    ?.map(action => {
                      const status = [ToolActionStatus.cancelled, ToolActionStatus.error].includes(
                        action.status,
                      )
                        ? '❌'
                        : '✅';
                      const execTime = action.execution_time_seconds
                        ? ` (${action.execution_time_seconds.toFixed(3)}s)`
                        : '';

                      return `${status} \`${action.name}\`${execTime}`;
                    })
                    .join('  \n') || '';

                if (toolExecutionSummary) {
                  // Just prepend the summary - convertJsonToString already handled JSON wrapping if needed
                  // Add extra newline to ensure content starts on a new line
                  msg.content = `${toolExecutionSummary}\n\n\n${msg.content}`;
                }
              }
            }
            return updatedHistory;
          }

          case SocketMessageType.AgentToolError: {
            // Handle tool errors
            const errorMsgIndex = updatedHistory.findIndex(msg => msg.id === message_id);
            if (errorMsgIndex >= 0) {
              const msg = updatedHistory[errorMsgIndex];
              const toolAction = msg.toolActions?.find(t => t.id === response_metadata?.tool_run_id);
              if (toolAction) {
                toolAction.status = ToolActionStatus.error;
                toolAction.content = convertJsonToString(message?.content ?? '');
                toolAction.ended_at = message.created_at;
              }
              msg.isLoading = false;
              msg.isStreaming = false;
              setIsRunning(false);
            }
            return updatedHistory;
          }

          case SocketMessageType.Error:
          case SocketMessageType.AgentException: {
            // Handle general errors
            const finalMsgIndex = updatedHistory.findIndex(msg => msg.id === message_id);
            if (finalMsgIndex >= 0) {
              const msg = updatedHistory[finalMsgIndex];
              msg.isLoading = false;
              msg.isStreaming = false;
              msg.exception = message.content;
              setIsRunning(false);
            } else {
              // Add new error message if no existing message found
              const errorMessage = {
                id: uuidv4(),
                role: ROLES.Assistant,
                content: `❌ Error occurred during tool testing:\n\n**Error:** ${convertJsonToString(message.content)}`,
                created_at: new Date().getTime(),
                participant_id: 'toolkit',
              };
              return [...updatedHistory, errorMessage];
            }
            return updatedHistory;
          }

          default:
            return updatedHistory;
        }
      });
    },
    [selectedTool, refetchIndexes, projectId, toolkitId],
  );

  // Setup socket for test_toolkit_tool event with automatic subscription
  const { emit: socketEmit } = useSocket('test_toolkit_tool', handleToolkitTestResponse);

  // Create welcome message
  const welcomeMessage = useMemo(
    () => ({
      id: WELCOME_MESSAGE_ID,
      role: ROLES.Assistant,
      content:
        "Welcome! Select a tool from the Test Settings panel and click 'RUN TOOL' to see the results here.",
      created_at: new Date().getTime(),
      participant_id: 'system',
    }),
    [],
  );

  // Initialize chat with welcome message
  useEffect(() => {
    setChatHistory([welcomeMessage]);
  }, [welcomeMessage]);

  // Simple tool change handler
  const onChangeTool = useCallback(value => {
    setSelectedTool(value || null);
    setToolInputVariables([]);
  }, []);

  // Handler for updating tool input variables
  const onChangeInputVariables = useCallback(inputVariables => {
    setToolInputVariables(inputVariables);
  }, []);

  // Tool execution handler - adds messages to chat
  const onRunTool = useCallback(async () => {
    // Set running state
    setIsRunning(true);

    // Create user message showing tool execution request
    const userMessage = {
      id: uuidv4(),
      role: ROLES.Assistant, // Use Assistant role so it renders with AIAnswer (supports markdown)
      content: `Running tool: ${typeof selectedTool === 'string' ? selectedTool : JSON.stringify(selectedTool, null, 2)}\n\nParameters:\n\n\`\`\`json\n${JSON.stringify(toolInputVariables, null, 2)}\n\`\`\``,
      created_at: new Date().getTime(),
      participant_id: 'user',
    };

    // Add user message immediately
    setChatHistory(prev => [...prev.filter(msg => msg.id !== WELCOME_MESSAGE_ID), userMessage]);

    try {
      // Emit socket event for test_toolkit_tool using the manual socket
      const payload = {
        project_id: projectId,
        toolkit_config: {
          type: formValues.type, // The toolkit type (e.g., "github")
          toolkit_name: formValues.toolkit_name || formValues.type, // Use the actual toolkit_name from form data
          toolkit_id: formValues.id, // Add toolkit_id inside toolkit_config
          settings: formValues.settings || {}, // Use the toolkit settings from form
        },
        tool_name: selectedTool,
        tool_params:
          toolInputVariables && typeof toolInputVariables === 'object' && !Array.isArray(toolInputVariables)
            ? toolInputVariables
            : {},
        llm_model: selectedModel?.name || 'gpt-4o-mini', // Use selected model
        llm_settings: {
          ...llmSettings,
          model_name: selectedModel?.name || 'gpt-4o-mini',
          model_project_id: selectedModel?.project_id,
        },
      };

      // Emit the socket event using the manual socket which handles test_toolkit_tool messages
      socketEmit(payload);
    } catch (error) {
      // Reset running state
      setIsRunning(false);

      // Better error message extraction
      let errorMessage;
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error);
      }

      const errorChatMessage = {
        id: uuidv4(),
        role: ROLES.Assistant,
        content: `❌ Failed to execute tool "${selectedTool}"\n\n**Error:** ${errorMessage}\n\nPlease check your toolkit configuration and try again.`,
        created_at: new Date().getTime(),
        participant_id: 'toolkit',
      };

      // Add error message to chat
      setChatHistory(prev => [...prev, errorChatMessage]);
    }
  }, [
    selectedTool,
    toolInputVariables,
    projectId,
    formValues.type,
    formValues.toolkit_name,
    formValues.id,
    formValues.settings,
    selectedModel?.name,
    selectedModel?.project_id,
    llmSettings,
    socketEmit,
  ]);

  const onClearChat = useCallback(() => {
    setChatHistory([welcomeMessage]);
  }, [welcomeMessage]);

  const onCopyToClipboard = useChatCopyToClipboard(chatHistory);

  // Mock conversation object for ChatMessageList
  const mockConversation = useMemo(
    () => ({
      id: 'toolkit-test',
      uuid: 'toolkit-test-uuid',
      participants: [
        {
          id: 'user',
          entity_name: ChatParticipantType.Users,
          entity_meta: {},
          meta: {
            user_name: 'User',
          },
        },
        {
          id: 'toolkit',
          entity_name: ChatParticipantType.Applications, // Use Applications type since it handles meta.name
          entity_meta: {},
          meta: {
            name: 'Toolkit',
          },
        },
      ],
      chat_history: chatHistory,
    }),
    [chatHistory],
  );

  // Expose methods via ref for compatibility
  useEffect(() => {
    boxRef.current = {
      onClear: onClearChat,
      addMessage: message => setChatHistory(prev => [...prev, message]),
      addMessages: messages => setChatHistory(prev => [...prev, ...messages]),
    };
  }, [onClearChat]);

  return (
    <>
      <Grid
        size={{ md: 12, lg: 8 }}
        sx={styles.chatGrid}
      >
        <ContentContainer sx={styles.chatContainer}>
          <Box sx={styles.chatContent}>
            {/* Chat Controls */}
            <Box sx={styles.chatControls}>
              <Box sx={styles.controlButtons}>
                <FullScreenToggle
                  isFullScreenChat={isFullScreenChat}
                  setIsFullScreenChat={setIsFullScreenChat}
                />
                <ChatButton.ClearChatButton onClear={onClearChat} />
              </Box>
            </Box>

            {/* Chat Component */}
            <ChatBodyContainer
              sx={{
                [theme.breakpoints.up('lg')]: styles.chatBodyContainer,
                [theme.breakpoints.down('lg')]: styles.chatBodyContainerResponsive,
              }}
            >
              <ChatMessageList
                chat_history={chatHistory}
                activeConversation={mockConversation}
                isLoading={false}
                isStreaming={false}
                isLoadingMore={false}
                interaction_uuid="toolkit-test"
                askingQuestionId=""
                lastResponseMinHeight={0}
                questionItemRef={useRef()}
                onCopyToClipboard={onCopyToClipboard}
              />
            </ChatBodyContainer>
          </Box>
        </ContentContainer>
      </Grid>
      <Grid
        size={{ md: 12, lg: 4 }}
        container
        sx={{
          ...styles.settingsGrid,
          [theme.breakpoints.down('lg')]: styles.settingsGridResponsive,
        }}
      >
        <TestSettings
          selectedTool={selectedTool}
          onChangeTool={onChangeTool}
          toolInputVariables={toolInputVariables}
          onChangeInputVariables={onChangeInputVariables}
          isRunning={isRunning}
          onRunTool={onRunTool}
          modelList={modelList}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          llmSettings={llmSettings}
          onSetLLMSettings={onSetLLMSettings}
        />
      </Grid>
    </>
  );
});

ToolkitRightContent.displayName = 'ToolkitRightContent';

export default ToolkitRightContent;

/**
 * Creates styles object based on component state
 * @param {Object} params - State parameters for styling
 * @param {boolean} params.showAdvancedSettings - Whether advanced settings are shown
 * @returns {import('@mui/material').SxProps}
 */
const createStyles = ({ showAdvancedSettings }) => ({
  chatGrid: theme => ({
    height: '100%',
    [theme.breakpoints.down('lg')]: {
      height: '100vh !important',
      minHeight: '120vh !important',
      marginBottom: '24px',
    },
  }),
  chatContainer: {
    height: '100%',
  },
  chatContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    gap: '14px',
    overflow: 'auto',
  },
  chatControls: theme => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    [theme.breakpoints.down('lg')]: {
      marginBottom: showAdvancedSettings ? '0px' : '24px',
    },
  }),
  controlButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  chatBodyContainer: {
    height: 'calc(100vh - 160px)',
  },
  chatBodyContainerResponsive: {
    height: '100vh !important',
    minHeight: '100vh !important',
    marginBottom: '24px',
  },
  settingsGrid: {
    maxHeight: '100%',
  },
  settingsGridResponsive: {
    height: '100vh !important',
    minHeight: '100vh !important',
    paddingBottom: '24px',
  },
});
