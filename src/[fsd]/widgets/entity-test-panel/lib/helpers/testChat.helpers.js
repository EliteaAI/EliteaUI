import { WELCOME_MESSAGE_ID } from '@/common/constants';

// Nothing to clear while answering, or when the chat holds no messages besides the welcome message
export const isTestChatClearDisabled = (chatHistory, isStreaming) =>
  !chatHistory?.length ||
  Boolean(isStreaming) ||
  (chatHistory.length === 1 && chatHistory[0].id === WELCOME_MESSAGE_ID);
