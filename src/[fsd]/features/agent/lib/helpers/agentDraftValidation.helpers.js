import {
  MAX_CONVERSATION_STARTERS,
  MAX_CONVERSATION_STARTER_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_WELCOME_MESSAGE_LENGTH,
} from '@/common/constants.js';

export const validateAgentDraft = draft => {
  const errors = {};
  const name = (draft.name || '').trim();
  if (!name) errors.name = 'Name is required';
  else if (name.length > MAX_NAME_LENGTH) errors.name = `Name must be ${MAX_NAME_LENGTH} characters or less`;

  const description = (draft.description || '').trim();
  if (!description) errors.description = 'Description is required';
  else if (description.length > MAX_DESCRIPTION_LENGTH)
    errors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;

  const welcomeMessage = draft.welcome_message || '';
  if (welcomeMessage.length > MAX_WELCOME_MESSAGE_LENGTH)
    errors.welcome_message = `Welcome message must be ${MAX_WELCOME_MESSAGE_LENGTH} characters or less`;

  const starters = draft.conversation_starters || [];
  if (starters.length > MAX_CONVERSATION_STARTERS)
    errors.conversation_starters = `Maximum ${MAX_CONVERSATION_STARTERS} conversation starters allowed`;
  if (starters.some(s => s && s.length > MAX_CONVERSATION_STARTER_LENGTH))
    errors.conversation_starters_length = `Each starter must be ${MAX_CONVERSATION_STARTER_LENGTH} characters or less`;

  return errors;
};
