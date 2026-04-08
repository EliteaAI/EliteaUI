import { v4 as uuidv4 } from 'uuid';

import {
  IndexStatuses,
  IndexesToolsEnum,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import {
  ChatParticipantType,
  ROLES,
  SocketMessageType,
  ToolActionStatus,
  WELCOME_MESSAGE_ID,
} from '@/common/constants';
import { convertJsonToString } from '@/common/utils';

export const getMockToolkitIndexConversation = chatHistory => ({
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
});

export const generateWelcomeMessage = (tool = IndexesToolsEnum.indexData, isTestTools = false) => {
  let content = 'Configure index parameters and start indexing or reindexing';

  if (isTestTools) {
    content =
      "Welcome! Select a tool from the Test Settings panel and click 'RUN TOOL' to see the results here.";
  } else {
    switch (tool) {
      case IndexesToolsEnum.searchIndexData:
        content = 'Welcome! Configure search parameters and start searching the index';
        break;
      case IndexesToolsEnum.stepbackSearchIndex:
        content = 'Welcome! Configure stepback search parameters and start searching the index';
        break;
      case IndexesToolsEnum.stepbackSummaryIndex:
        content = 'Welcome! Configure stepback summary parameters and start summarizing the index';
        break;
      default:
        break;
    }
  }

  return {
    id: WELCOME_MESSAGE_ID,
    role: ROLES.Assistant,
    content,
    created_at: new Date().getTime(),
    participant_id: 'system',
  };
};

export const generateIndexDataPayload = ({
  projectId,
  values,
  toolInputVariables,
  selectedModel,
  llmSettings,
  tool,
}) => ({
  project_id: projectId,
  toolkit_config: {
    type: values.type, // The toolkit type (e.g., "github")
    toolkit_name: values.toolkit_name || values.type, // Use the actual toolkit_name from form data
    toolkit_id: values.id, // Add toolkit_id inside toolkit_config
    settings: values.settings || {}, // Use the toolkit settings from form
  },
  tool_name: tool,
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
});

export const generateMockMessageTemplate = (content, participantId) => ({
  id: uuidv4(),
  role: ROLES.Assistant, // Use Assistant role so it renders with AIAnswer (supports markdown)
  content,
  created_at: new Date().getTime(),
  participant_id: participantId,
});

export const generateChatMessageBasedOnResponse = ({ message, chatHistory, onFinish, onStartTask }) => {
  const { message_id, type: socketMessageType, response_metadata } = message;
  const { task_id } = message.content instanceof Object ? message.content : {};

  const updatedHistory = [...chatHistory];

  switch (socketMessageType) {
    case SocketMessageType.StartTask: {
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

      if (onStartTask) onStartTask(task_id);

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
        msg.content = convertJsonToString(message.content || response_metadata.message, shouldWrapInBlock);
        msg.isLoading = false;

        if (response_metadata?.finish_reason) {
          msg.isStreaming = false;
          onFinish(IndexStatuses.success);

          // Enrich final message with execution time and status
          // NOTE: This formatting is specific to toolkit testing page only
          const toolExecutionSummary =
            msg.toolActions
              ?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Sort by creation time
              ?.map(action => {
                const status = [ToolActionStatus.cancelled, ToolActionStatus.error].includes(action.status)
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

        onFinish(IndexStatuses.fail);
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

        onFinish(IndexStatuses.fail);
      } else {
        // Add new error message if no existing message found
        const errorMessage = generateMockMessageTemplate(
          `❌ Error occurred during tool testing:\n\n**Error:** ${convertJsonToString(message.content)}`,
          'toolkit',
        );

        return [...updatedHistory, errorMessage];
      }

      return updatedHistory;
    }

    default:
      return updatedHistory;
  }
};

const deepMerge = (target, source) => {
  if (typeof target !== 'object' || target === null) return structuredClone(source);

  const output = structuredClone(target);

  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = deepMerge(output[key] ?? {}, value);
    } else {
      output[key] = value;
    }
  }

  return output;
};

export const adjustIndexDataSchema = (schema, adjustments = {}) => {
  if (!schema || typeof schema !== 'object' || !schema.properties) {
    // eslint-disable-next-line no-console
    console.warn('Invalid schema object provided:', schema);
    return schema;
  }

  const newSchema = structuredClone(schema);

  for (const [propName, updates] of Object.entries(adjustments)) {
    // Only adjust properties that exist in the original schema
    if (newSchema.properties[propName]) {
      const current = newSchema.properties[propName];
      newSchema.properties[propName] = deepMerge(current, updates);
    }
  }

  return newSchema;
};
