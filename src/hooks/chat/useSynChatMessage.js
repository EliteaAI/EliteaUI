import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { eliteaApi } from '@/api/eliteaApi';
import { TAG_TYPE_CONVERSATION_DETAILS } from '@/api/chat';
import { ChatParticipantType, TOOL_ACTION_TYPES } from '@/common/constants';
import {
  convertToAIAnswer,
  convertToUserQuestion,
  isUserMessage,
} from '@/common/convertChatConversationMessages';
import { areTheSameConversations } from '@/common/utils';
import useUpdateConversationTimestamp from '@/hooks/chat/useUpdateConversationTimestamp';

function convertLengthsToPositions(lengths) {
  const positions = [];
  let currentPos = 0;

  for (const length of lengths) {
    const startPos = currentPos;
    const endPos = startPos + length;
    positions.push({ startPos, endPos });
    currentPos = endPos; // Update current position for the next sentence
  }

  return positions;
}

const useSynChatMessage = ({
  activeConversation,
  setActiveConversation,
  setConversations,
  setFolders,
  setSelectedCodeBlockInfo,
}) => {
  const dispatch = useDispatch();
  const { updateConversationTimestamp } = useUpdateConversationTimestamp();

  const onRemoteChatMessageSync = useCallback(
    async message_group => {
      if (message_group.is_streaming) {
        // Update the conversation timestamp on the backend to ensure persistence after page refresh
        return;
      }

      setSelectedCodeBlockInfo(prevBlockInfo => {
        if (prevBlockInfo?.selectedMessage.id === message_group.uuid) {
          const itemPositionInfo = convertLengthsToPositions(
            message_group.message_items.map(item =>
              item.item_type === 'canvas_message'
                ? item.item_details.latest_version.canvas_content.length
                : item.item_details.content.length,
            ),
          );

          const foundNewCanvas = message_group.message_items.find(
            (item, index) =>
              item.item_type === 'canvas_message' &&
              itemPositionInfo[index]?.startPos == prevBlockInfo.startPos &&
              itemPositionInfo[index]?.endPos == prevBlockInfo.endPos,
          );
          if (foundNewCanvas) {
            return {
              ...prevBlockInfo,
              isCreatingCanvas: undefined,
              canvasId: foundNewCanvas.uuid,
              messageItemId: foundNewCanvas.id,
            };
          }
        }
        return prevBlockInfo;
      });
      let newChatHistory = [];
      let newMessageGroups = [];
      let messageWasFound = false;
      // Update active conversation
      setActiveConversation(prev => {
        // Check if this sync message matches any message in chat_history
        // If not, this is likely a swarm child message sync - return prev unchanged
        // to prevent React batching from overwriting concurrent SwarmChild additions
        const messageExists = prev.chat_history?.some(
          message => message.id == message_group.id || message.id == message_group.uuid,
        );

        if (!messageExists) {
          // This sync is for a message we don't have (e.g., swarm child message)
          // Don't create a new state object - return prev unchanged to preserve
          // any concurrent updates (like SwarmChild actions being added)
          return prev;
        }

        messageWasFound = true;
        const { author_participant_id, sent_to_id, reply_to_id, sent_to } = message_group;
        const users = prev?.participants?.filter(p => p.entity_name === ChatParticipantType.Users) || [];
        const forUser = isUserMessage(
          author_participant_id,
          sent_to_id,
          users.map(user => user.id),
          reply_to_id,
          sent_to,
        );
        const convertedMessageGroup = !forUser
          ? convertToAIAnswer(
              {
                ...message_group,
                question_id: prev.chat_history.find(
                  message => message.id == message_group.id || message.id == message_group.uuid,
                )?.question_id,
              },
              prev.chat_history,
              prev.participants,
            )
          : convertToUserQuestion(message_group, users, prev.participants);
        newChatHistory = prev.chat_history?.map(message => {
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
        newMessageGroups =
          prev.message_groups?.map(message =>
            message.id != message_group.id && message.id != message_group.uuid
              ? message
              : { ...message, ...convertedMessageGroup },
          ) || [];
        return {
          ...prev,
          chat_history: [...newChatHistory],
          message_groups: [...newMessageGroups],
          updated_at: new Date().toISOString(),
          // Preserve isNamingPending - it should only be cleared by the automatic naming system
          isNamingPending: prev.isNamingPending,
        };
      });

      // Only update conversations and folders if the message was found in chat_history
      // This prevents unnecessary state updates for swarm child message syncs
      if (!messageWasFound) {
        if (message_group.context_analytics && activeConversation?.id) {
          dispatch(
            eliteaApi.util.invalidateTags([
              { type: TAG_TYPE_CONVERSATION_DETAILS, id: activeConversation.id },
            ]),
          );
        }
        return;
      }

      // Update conversations in ungrouped conversations
      setConversations(prev => {
        return prev?.map(item =>
          areTheSameConversations(activeConversation, item)
            ? {
                ...activeConversation,
                chat_history: [...newChatHistory],
                message_groups: [...newMessageGroups],
                updated_at: new Date().toISOString(),
                // Preserve isNamingPending - it should only be cleared by the automatic naming system
                isNamingPending: activeConversation.isNamingPending,
              }
            : item,
        );
      });

      // Update conversations in folders
      if (setFolders) {
        setFolders(prev => {
          return prev?.map(folder => ({
            ...folder,
            conversations: folder.conversations.map(item =>
              areTheSameConversations(activeConversation, item)
                ? {
                    ...activeConversation,
                    chat_history: [...newChatHistory],
                    message_groups: [...newMessageGroups],
                    updated_at: new Date().toISOString(),
                    // Preserve isNamingPending - it should only be cleared by the automatic naming system
                    isNamingPending: activeConversation.isNamingPending,
                  }
                : item,
            ),
          }));
        });
      }
      updateConversationTimestamp(activeConversation.id);

      if (message_group.context_analytics) {
        dispatch(
          eliteaApi.util.invalidateTags([{ type: TAG_TYPE_CONVERSATION_DETAILS, id: activeConversation.id }]),
        );
      }
    },
    [
      activeConversation,
      dispatch,
      setActiveConversation,
      setConversations,
      setFolders,
      setSelectedCodeBlockInfo,
      updateConversationTimestamp,
    ],
  );

  return {
    onRemoteChatMessageSync,
  };
};

export default useSynChatMessage;
