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

        const convertedMessageGroup = convertToAIAnswer(
          {
            ...message_group,
            question_id: prevConversation.chat_history.find(
              message => message.id == message_group.id || message.id == message_group.uuid,
            )?.question_id,
          },
          prevConversation.chat_history,
          prevConversation.participants,
        );

        const newChatHistory = prevConversation.chat_history.map(message => {
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
