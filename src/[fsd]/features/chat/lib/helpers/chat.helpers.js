import { ROLES, WELCOME_MESSAGE_ID } from '@/common/constants';

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
