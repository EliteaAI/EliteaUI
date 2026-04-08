import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { filterReasoningEffortFromSettings } from '@/[fsd]/shared/lib/utils/llmSettings.utils';
import { ChatParticipantType } from '@/common/constants';

const getMcpServerUrlsFromParticipants = participants => {
  if (!participants || !Array.isArray(participants)) return [];
  return participants
    .filter(
      p =>
        p.entity_name === ChatParticipantType.Toolkits &&
        p.entity_settings?.toolkit_type === 'mcp' &&
        p.entity_settings?.url,
    )
    .map(p => p.entity_settings.url);
};

const getMcpServerUrlsFromTools = tools => {
  if (!tools || !Array.isArray(tools)) return [];
  return tools.filter(tool => tool.type === 'mcp' && tool.settings?.url).map(tool => tool.settings.url);
};

export const generateMessagePayload = ({
  question,
  question_id,
  participant,
  conversation_uuid,
  activeParticipant,
  interaction_uuid,
  projectId,
  selectedModel = { name: null, project_id: null },
  isSendingToUser = false,
  userIds = [],
  attachmentList = [],
  unsavedLLMSettings = undefined,
  participants = [], // Add participants to extract MCP toolkit URLs
  allowLLMSettingsOverride = false, // Whether to allow unsavedLLMSettings to override agent's configured model
  conversationMeta = undefined, // Conversation-level meta (e.g. steps_limit)
}) => {
  // Determine entity_name from whichever source has it (prefer participant, fallback to activeParticipant)
  const entityName = participant?.entity_name || activeParticipant?.entity_name;
  // Keep participant_id from the passed participant if available
  const participantId = participant?.id || activeParticipant?.id;
  const mcpTokens = McpAuthHelpers.getAllTokens();
  // Get ignored servers: explicitly ignored + MCP servers without valid tokens
  const ignoredMcpServers = McpAuthHelpers.getFilteredIgnoredServers(
    getMcpServerUrlsFromParticipants(participants),
  );

  switch (entityName) {
    case ChatParticipantType.Applications:
    case ChatParticipantType.Pipelines:
      return {
        payload: {
          user_input: question,
        },
        project_id: projectId,
        participant_id: participantId,
        conversation_uuid,
        question_id,
        interaction_uuid,
        attachments_info: attachmentList
          ?.filter(item => item.filepath)
          ?.map(item => ({
            filepath: item.filepath,
          })),
        // Only send llm_settings when override is explicitly allowed (e.g., agents page).
        // Otherwise, agent's configured model (from entity_settings) should be used.
        // When override is allowed, fall back to selectedModel if unsavedLLMSettings is not set.
        // Strip steps_limit — it is a top-level field, not part of llm_settings.
        llm_settings: allowLLMSettingsOverride
          ? unsavedLLMSettings
            ? Object.fromEntries(
                Object.entries(filterReasoningEffortFromSettings(unsavedLLMSettings, selectedModel)).filter(
                  ([key]) => key !== 'steps_limit',
                ),
              )
            : { model_name: selectedModel.name, model_project_id: selectedModel.project_id }
          : undefined,
        mcp_tokens: mcpTokens,
        ignored_mcp_servers: ignoredMcpServers,
      };
    default: {
      // For default case (regular chat), prefer unsavedLLMSettings if available, else use selectedModel
      const stepsLimit = unsavedLLMSettings?.steps_limit ?? conversationMeta?.steps_limit;
      const defaultLlmSettings = !isSendingToUser
        ? unsavedLLMSettings
          ? Object.fromEntries(
              Object.entries(filterReasoningEffortFromSettings(unsavedLLMSettings, selectedModel)).filter(
                ([key]) => key !== 'steps_limit',
              ),
            )
          : {
              model_name: selectedModel.name,
              model_project_id: selectedModel.project_id,
            }
        : undefined;
      return {
        user_input: question,
        llm_settings: defaultLlmSettings,
        ...(stepsLimit !== undefined ? { step_limit: stepsLimit } : {}),
        project_id: projectId,
        participant_id: participantId,
        conversation_uuid,
        question_id,
        interaction_uuid,
        user_ids: isSendingToUser ? userIds : undefined,
        attachments_info: attachmentList
          .filter(item => item.filepath)
          .map(item => ({
            filepath: item.filepath,
          })),
        mcp_tokens: mcpTokens,
        ignored_mcp_servers: ignoredMcpServers,
      };
    }
  }
};

const generateApplicationPayload = ({
  projectId,
  application_id,
  instructions,
  llm_settings,
  variables,
  tools,
  name,
  currentVersionId,
  question_id,
}) => ({
  application_id,
  user_name: name,
  project_id: projectId,
  version_id: currentVersionId,
  instructions,
  llm_settings,
  variables: variables
    ? variables.map(item => {
        const { key, name: variableName, value } = item;
        return {
          name: variableName || key,
          value,
        };
      })
    : [],
  tools,
  question_id,
  mcp_tokens: McpAuthHelpers.getAllTokens(),
  // Get MCP server URLs from application tools to check for valid tokens
  ignored_mcp_servers: McpAuthHelpers.getFilteredIgnoredServers(getMcpServerUrlsFromTools(tools)),
});

export const generateApplicationStreamingPayload = ({
  projectId,
  application_id,
  instructions,
  llm_settings,
  variables,
  question,
  tools,
  chatHistory,
  name,
  currentVersionId,
  question_id,
  interaction_uuid,
  resetSession,
  attachmentList = [],
}) => {
  const payload = generateApplicationPayload({
    projectId,
    application_id,
    instructions,
    llm_settings,
    variables,
    tools,
    name,
    currentVersionId,
    question_id,
  });
  payload.thread_id = resetSession ? undefined : chatHistory?.at(-1)?.threadId;
  payload.chat_history = chatHistory
    ? chatHistory.map(message => {
        const { role, content, name: userName } = message;
        if (userName) {
          return { role, content, name: userName };
        } else {
          return { role, content };
        }
      })
    : [];
  payload.user_input = question;
  payload.question_id = question_id;
  payload.interaction_uuid = interaction_uuid;
  payload.attachments_info = attachmentList
    ?.filter(item => item.filepath)
    ?.map(item => ({
      filepath: item.filepath,
    }));
  return payload;
};

/**
 * Generate payload for continuing execution in main chat after an interruption.
 * Used for MCP auth resumes, HITL resumes, and generic checkpoint continues.
 */
export const generateChatContinuePayload = ({
  conversation_uuid,
  projectId,
  message_id,
  thread_id,
  participants = [], // Extract MCP toolkit URLs
  question,
}) => {
  // Get MCP server URLs from toolkit participants to check for valid tokens
  const mcpServerUrls = getMcpServerUrlsFromParticipants(participants);
  return {
    project_id: projectId,
    conversation_uuid,
    message_id,
    thread_id,
    mcp_tokens: McpAuthHelpers.getAllTokens(),
    // Get ignored servers: explicitly ignored + MCP servers without valid tokens
    ignored_mcp_servers: McpAuthHelpers.getFilteredIgnoredServers(mcpServerUrls),
    user_input: question,
  };
};

export const generateMcpContinuePayload = payload => generateChatContinuePayload(payload);

export const generateApplicationContinuePayload = ({
  conversation_uuid,
  projectId,
  message_id,
  thread_id,
  participant_id,
  question_id,
  question,
  type = 'chat',
  // Pass the entire conversation to resolve participant internally
  conversation,
  // For fallback LLM settings when participant doesn't have them
  selectedModel,
  conversationLlmSettings,
  // Conversation-level meta (e.g. steps_limit)
  conversationMeta = undefined,
}) => {
  // Resolve participant from conversation
  const participant = conversation?.participants.find(({ id }) => id === participant_id) || {};
  // Get LLM settings from participant (if it's an Application)
  let llm_settings = {};
  if (participant.entity_name === ChatParticipantType.Applications) {
    llm_settings = participant.entity_settings?.llm_settings || {};
  }

  // Generate fallback settings if participant doesn't have llm_settings
  if (!llm_settings || Object.keys(llm_settings).length === 0) {
    const baseSettings = {
      model_name: selectedModel?.name || conversationLlmSettings?.model_name,
      model_project_id: selectedModel?.project_id || conversationLlmSettings?.model_project_id,
      temperature: conversationLlmSettings?.temperature || DEFAULT_TEMPERATURE,
      max_tokens: conversationLlmSettings?.max_tokens || DEFAULT_MAX_TOKENS,
    };

    // Only include reasoning_effort if the model supports it
    const model = selectedModel || { name: conversationLlmSettings?.model_name, supports_reasoning: false };
    if (model?.supports_reasoning) {
      baseSettings.reasoning_effort = conversationLlmSettings?.reasoning_effort || DEFAULT_REASONING_EFFORT;
    }

    llm_settings = baseSettings;
  }
  return {
    should_continue: true,
    project_id: projectId,
    conversation_uuid,
    message_id,
    thread_id,
    participant_id,
    question_id,
    application_id: participant?.entity_meta?.id,
    version_id: participant?.entity_settings?.version_id,
    type,
    llm_settings,
    variables: participant?.entity_settings?.variables || [],
    format_response: true,
    user_input: question,
    mcp_tokens: McpAuthHelpers.getAllTokens(),
    ...(conversationMeta?.steps_limit !== undefined ? { step_limit: conversationMeta.steps_limit } : {}),
  };
};
