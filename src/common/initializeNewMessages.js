import { v4 as uuidv4 } from 'uuid';

import { ROLES } from './constants';

const createTextMessageItem = (question, itemUUID) => {
  const timestamp = new Date().getTime();
  return {
    id: timestamp,
    uuid: itemUUID,
    meta: {},
    order_index: 0,
    item_type: 'text_message',
    item_details: {
      content: question,
      id: timestamp,
      item_type: 'text_message',
    },
  };
};

const createUserMessage = ({ question_id, name, avatar, userId, participant, question, itemUUID }) => {
  return {
    id: question_id,
    role: ROLES.User,
    name,
    avatar,
    created_at: new Date().getTime(),
    user_id: userId,
    participant_id: participant?.id,
    sentTo: participant ?? {},
    message_items: [createTextMessageItem(question, itemUUID)],
  };
};

const createAssistantMessage = ({ question_id, participant }) => {
  return {
    internal_id: uuidv4(),
    question_id,
    role: ROLES.Assistant,
    participant_id: participant?.id,
    content: '',
    isLoading: true,
    created_at: new Date().getTime(),
  };
};

export const initializeNewMessages = ({
  question,
  question_id,
  participant,
  userId,
  name,
  avatar,
  isSendingToUser,
}) => {
  const isUserToUserMessage = isSendingToUser || participant?.entity_name === 'user';
  const userMessage = createUserMessage({
    question_id,
    name,
    avatar,
    userId,
    participant,
    question,
    itemUUID: isUserToUserMessage ? question_id : uuidv4(),
  });

  if (isUserToUserMessage) {
    return [userMessage];
  }

  return [userMessage, createAssistantMessage({ question_id, participant })];
};
