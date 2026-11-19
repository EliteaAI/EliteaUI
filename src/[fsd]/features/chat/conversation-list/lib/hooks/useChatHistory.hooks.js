import { useContext } from 'react';

import {
  ChatHistoryActionsContext,
  ChatHistoryDataContext,
} from '@/[fsd]/features/chat/conversation-list/lib/context';

export const useChatHistoryData = () => {
  const value = useContext(ChatHistoryDataContext);
  if (!value) throw new Error('useChatHistoryData must be used inside ChatHistoryProvider');
  return value;
};

export const useChatHistoryActions = () => {
  const value = useContext(ChatHistoryActionsContext);
  if (!value) throw new Error('useChatHistoryActions must be used inside ChatHistoryProvider');
  return value;
};
