import { useCallback } from 'react';

import { TOOL_ACTION_TYPES } from '@/common/constants';
import { convertToAIAnswer } from '@/common/convertChatConversationMessages';

const useSynAgentChatMessage = ({ setActiveConversation }) => {
  const onRemoteChatMessageSync = useCallback(
    async message_group => {
      if (message_group.is_streaming) {
        // Update the conversation timestamp on the backend to ensure persistence after page refresh
        return;
      }
      // Use functional update to get the ACTUAL current state (avoids stale closure issue)
      // This is critical because SwarmChild actions are added via socket events and may not
      // be reflected in the closure-captured activeConversation when this callback runs
      setActiveConversation(prevConversation => {
        if (!prevConversation) return prevConversation;

        const existingMessage = prevConversation.chat_history.find(
          message => message.id == message_group.id || message.id == message_group.uuid,
        );

        const convertedMessageGroup = convertToAIAnswer(
          {
            ...message_group,
            question_id: existingMessage?.question_id,
          },
          prevConversation.chat_history,
          prevConversation.participants,
        );

        let newChatHistory = prevConversation.chat_history.map(message => {
          if (message.id != message_group.id && message.id != message_group.uuid) {
            return message;
          }
          // Preserve SwarmChild actions added via socket (server doesn't include them in sync)
          // Deduplicate by agent_name + content to handle same agent responding multiple times
          const existingSwarmChildren = (message.toolActions || []).filter(
            a => a.type === TOOL_ACTION_TYPES.SwarmChild,
          );
          const newSwarmChildren = (convertedMessageGroup.toolActions || []).filter(
            a => a.type === TOOL_ACTION_TYPES.SwarmChild,
          );
          const preservedSwarmChildren = existingSwarmChildren.filter(
            existing =>
              !newSwarmChildren.some(
                newOne =>
                  newOne.toolMeta?.agent_name === existing.toolMeta?.agent_name &&
                  newOne.content === existing.content,
              ),
          );
          const mergedToolActions = [...(convertedMessageGroup.toolActions || []), ...preservedSwarmChildren];
          return { ...message, ...convertedMessageGroup, toolActions: mergedToolActions };
        });

        const { reply_to_first_message_item_uuid } = message_group;

        if (reply_to_first_message_item_uuid && existingMessage?.question_id) {
          newChatHistory = newChatHistory.map(message => {
            if (message.id !== existingMessage.question_id || !message.message_items) return message;

            const updatedItems = message.message_items.map(item =>
              item.item_type === 'text_message' ? { ...item, uuid: reply_to_first_message_item_uuid } : item,
            );
            return { ...message, message_items: updatedItems };
          });
        }

        return {
          ...prevConversation,
          chat_history: newChatHistory,
          updated_at: new Date().toISOString(),
        };
      });
    },
    [setActiveConversation],
  );

  return {
    onRemoteChatMessageSync,
  };
};

export default useSynAgentChatMessage;
