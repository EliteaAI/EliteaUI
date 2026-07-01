import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
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
  allowLLMSettingsOverride = false, // Whether to allow unsavedLLMSettings to override agent's configured model
  conversationMeta = undefined, // Conversation-level meta (e.g. steps_limit)
}) => {
  // Determine entity_name from whichever source has it (prefer participant, fallback to activeParticipant)
  const entityName = participant?.entity_name || activeParticipant?.entity_name;
  // Keep participant_id from the passed participant if available
  const participantId = participant?.id || activeParticipant?.id;
  const mcpTokens = McpAuthHelpers.getAllTokens();

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
  sessionDeclinedMcpServers = [], // Servers user declined this session (NOT from localStorage)
}) => {
  // Get MCP server URLs from toolkit participants to check for valid tokens
  const mcpServerUrls = getMcpServerUrlsFromParticipants(participants);

  const allTokens = McpAuthHelpers.getAllTokens();

  // Only servers missing valid tokens (does NOT read localStorage)
  const noTokenServers = McpAuthHelpers.getServersWithoutTokens(mcpServerUrls);

  // Merge: no-token servers + session-declined servers (deduplicated)
  // Only remove a server from the ignore list if the user has authenticated it (valid access_token).
  // An entry with {access_token: null, refresh_token: "..."} means the token is expired but
  // refreshable — it is NOT a valid token, so the server must remain ignored.
  const allIgnored = [
    ...new Set([...noTokenServers, ...sessionDeclinedMcpServers.map(s => s.server_url)]),
  ].filter(s => !allTokens[s]);

  // Exclude servers from user_declined_mcp_servers that now have a valid access_token
  const effectiveDeclinedServers = sessionDeclinedMcpServers.filter(
    s => !allTokens[s.server_url]?.access_token,
  );

  return {
    project_id: projectId,
    conversation_uuid,
    message_id,
    thread_id,
    mcp_tokens: allTokens,
    ignored_mcp_servers: allIgnored,
    user_declined_mcp_servers: effectiveDeclinedServers,
    user_input: question,
  };
};

export const generateMcpContinuePayload = payload => generateChatContinuePayload(payload);
