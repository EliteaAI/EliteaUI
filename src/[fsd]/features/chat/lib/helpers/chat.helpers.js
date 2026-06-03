import { v4 as uuidv4 } from 'uuid';

import * as NewConversationHelpers from '@/[fsd]/features/chat/lib/helpers/newConversation.helpers';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { ChatParticipantType, ROLES, WELCOME_MESSAGE_ID } from '@/common/constants';

export const getWelcomeMessage = (welcomeMessage, participantId = null) => ({
  id: WELCOME_MESSAGE_ID,
  role: ROLES.Assistant,
  content: welcomeMessage,
  isLoading: false,
  isStreaming: false,
  created_at: new Date().getTime(),
  ...(participantId ? { participant_id: participantId } : {}),
});

export const getInitialChatHistory = (welcomeMessage, participantId = null) => {
  if (welcomeMessage) {
    return [getWelcomeMessage(welcomeMessage, participantId)];
  }
  return [];
};

export const calculateDuration = (startTime, endTime) => {
  // Create Date objects for start and end times
  const start = new Date(startTime ?? undefined);
  const end = new Date(endTime ?? undefined);

  // Calculate the difference in milliseconds
  const durationMs = end - start;

  // Convert milliseconds to hours, minutes, and seconds
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor(durationMs / (1000 * 60 * 60));

  if (hours) {
    return `${hours} h ${minutes} min and ${seconds} sec`;
  } else if (minutes) {
    return `${minutes} min and ${seconds} sec`;
  } else {
    return seconds > 1 ? `${seconds} secs` : seconds > 0 ? '1 sec' : 'less than a second';
  }
};

export const getParticipantById = (conversation, participantId) => {
  return (
    conversation?.participants.find(({ id }) => id && id === participantId) || { entity_meta: {}, meta: {} }
  );
};

export const canDeleteThisAIMessage = (chat_history, message, userId) => {
  const { question_id } = message;
  const foundQuestion = chat_history.find(item => item.id === question_id);
  return foundQuestion?.user_id === userId;
};

// Use explicit original_name (lazy-loading wrapper) when present.
// Otherwise, extract the agent/pipeline name from checkpoint_ns
// (format: "{AgentName}:{uuid}") for tools called within a named node.
// Skip generic LangGraph node names like "main_agent" which are not meaningful.
export const getToolActionOriginalName = metadata =>
  metadata?.toolkit_type !== 'internal'
    ? metadata?.original_name ||
      (() => {
        const ns = metadata?.checkpoint_ns;
        if (!ns) return null;
        const name = ns.split(':')[0];
        return name && name !== 'main_agent' && name !== 'agent' ? name : null;
      })()
    : null;

export const createHitlEditUserMessage = props => {
  const { question, participant, userId, name, avatar } = props;

  const messageId = uuidv4();
  const itemId = new Date().getTime();

  return {
    id: messageId,
    role: ROLES.User,
    name,
    avatar,
    content: question,
    created_at: new Date().getTime(),
    user_id: userId,
    participant_id: participant?.id,
    sentTo: participant ?? {},
    message_items: [
      {
        id: itemId,
        uuid: messageId,
        meta: {},
        order_index: 0,
        item_type: 'text_message',
        item_details: {
          content: question,
          id: itemId,
          item_type: 'text_message',
        },
      },
    ],
  };
};

/**
 * Get the selected model for a conversation based on user settings
 * @param {Object} conversation - The conversation object
 * @param {Array} availableModels - List of available models
 * @param {string} userId - The user ID
 * @returns {Object|null} The selected model or null if not found
 */
export const getSelectedConversationModel = (conversation, availableModels, userId) => {
  const userSettings = NewConversationHelpers.getChatUserSettings(conversation, userId);

  if (!userSettings?.model_name || !availableModels?.length) return null;

  // First try to find the model with exact project_id match
  let model = availableModels.find(
    m => m.name === userSettings.model_name && m.project_id === userSettings.model_project_id,
  );

  // If not found, try to find by name only (for shared models)
  if (!model) model = availableModels.find(m => m.name === userSettings.model_name);

  return model || null;
};

export const getModelSettings = participant => {
  if (participant.entity_name === ChatParticipantType.Applications) {
    const {
      max_tokens = DEFAULT_MAX_TOKENS,
      temperature = DEFAULT_TEMPERATURE,
      reasoning_effort, // Don't provide default here - let cleanLLMSettings handle it
      model_project_id,
      model_name,
    } = participant.entity_settings.llm_settings || {};

    const settings = {
      max_tokens,
      temperature,
      model_name,
      model_project_id,
    };

    // Only include reasoning_effort if it was explicitly set
    if (reasoning_effort !== undefined) settings.reasoning_effort = reasoning_effort;

    return settings;
  }
  return {};
};

export const createArchivedHitlAssistantMessage = assistantMessage => ({
  ...assistantMessage,
  id: `archived-hitl-${uuidv4()}`,
  question_id: undefined,
  hitlInterrupt: undefined,
  requiresConfirmation: undefined,
  isLoading: false,
  isStreaming: false,
  isRegenerating: false,
  archivedFromHitl: true,
});
