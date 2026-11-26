import { ChatParticipantType } from '@/common/constants';

export const CHAT_INPUT_PLACEHOLDER = 'Type your message… # for assistants';

// `placeholder` is what the host passes (a skill's argument hint), else ''
export const getChatInputPlaceholder = ({ placeholder, activeParticipant, activeParticipantDetails }) => {
  if (placeholder) return placeholder;
  if (!activeParticipant || activeParticipant.entity_name === ChatParticipantType.Users) {
    return CHAT_INPUT_PLACEHOLDER;
  }
  // A chat participant has no `name`: its details or its meta carry it
  const name = activeParticipantDetails?.name || activeParticipant.meta?.name || activeParticipant.name;
  return name ? `Reply to ${name}…` : CHAT_INPUT_PLACEHOLDER;
};
