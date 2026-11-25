import { ChatParticipantType } from '@/common/constants';

// A pipeline in the chat: an application with agent_type «pipeline» in a saved chat, a «pipeline» participant in a new
// chat (NewConversationView builds entity_name from participantType), as NewChat.jsx › onEditParticipant checks both
export const isPipelineParticipant = p =>
  p?.entity_name === ChatParticipantType.Pipelines ||
  (p?.entity_name === ChatParticipantType.Applications &&
    (p?.entity_settings?.agent_type === 'pipeline' || p?.agent_type === 'pipeline'));

// An MCP in the chat: a toolkit participant flagged by its meta or by its toolkit type
export const isMcpParticipant = p => !!(p?.meta?.mcp || p?.entity_settings?.toolkit_type === 'mcp');
