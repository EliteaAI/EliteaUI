import { useCallback } from 'react';

import { areTheSameConversations } from '@/common/utils';

import { useCanvasContentChangeSocket } from './useCanvasSocket';
import useUpdateConversationTimestamp from './useUpdateConversationTimestamp';

const getNewChatHistory = (chat_history, message_group_uuid, canvas_uuid, content) =>
  chat_history?.map(item =>
    item.id != message_group_uuid
      ? item
      : {
          ...item,
          message_items: item.message_items.map(message_item =>
            message_item.uuid !== canvas_uuid
              ? message_item
              : {
                  ...message_item,
                  item_details: {
                    ...message_item.item_details,
                    latest_version: {
                      ...message_item.item_details.latest_version,
                      canvas_content: content,
                    },
                  },
                },
          ),
        },
  ) || [];

const newGetNewMessageGroups = (message_groups, message_group_uuid, canvas_uuid, content) =>
  message_groups?.map(item =>
    item.uuid != message_group_uuid
      ? item
      : {
          ...item,
          message_items: item.message_items.map(message_item =>
            message_item.uuid !== canvas_uuid
              ? message_item
              : {
                  ...message_item,
                  item_details: {
                    ...message_item.item_details,
                    latest_version: {
                      ...message_item.item_details.latest_version,
                      canvas_content: content,
                    },
                  },
                },
          ),
        },
  ) || [];

const useChatCanvasContentChange = ({
  activeConversation,
  setActiveConversation,
  setConversations,
  setFolders,
}) => {
  const { updateConversationTimestamp } = useUpdateConversationTimestamp();

  const onCanvasContentChange = useCallback(
    async message => {
      const { content, canvas_uuid, message_group_uuid } = message || {};
      if (message_group_uuid && canvas_uuid) {
        const updatedTimestamp = new Date().toISOString();

        setActiveConversation(prevConversation => ({
          ...prevConversation,
          chat_history: [
            ...getNewChatHistory(prevConversation.chat_history, message_group_uuid, canvas_uuid, content),
          ],
          message_groups: [
            ...newGetNewMessageGroups(
              prevConversation.message_groups,
              message_group_uuid,
              canvas_uuid,
              content,
            ),
          ],
          updated_at: updatedTimestamp,
        }));

        setConversations(prev =>
          prev.map(item => {
            if (areTheSameConversations(activeConversation, item)) {
              return {
                ...item,
                chat_history: [
                  ...getNewChatHistory(item.chat_history, message_group_uuid, canvas_uuid, content),
                ],
                message_groups: [
                  ...newGetNewMessageGroups(item.message_groups, message_group_uuid, canvas_uuid, content),
                ],
                updated_at: updatedTimestamp,
              };
            }
            return item;
          }),
        );

        // Update conversations in folders
        if (setFolders) {
          setFolders(prev =>
            prev.map(folder => ({
              ...folder,
              conversations: folder.conversations.map(item => {
                if (areTheSameConversations(activeConversation, item)) {
                  return {
                    ...item,
                    chat_history: [
                      ...getNewChatHistory(item.chat_history, message_group_uuid, canvas_uuid, content),
                    ],
                    message_groups: [
                      ...newGetNewMessageGroups(
                        item.message_groups,
                        message_group_uuid,
                        canvas_uuid,
                        content,
                      ),
                    ],
                    updated_at: updatedTimestamp,
                  };
                }
                return item;
              }),
            })),
          );
        }

        // Update the conversation timestamp on the backend to ensure persistence after page refresh
        updateConversationTimestamp(activeConversation.id);
      }
    },
    [activeConversation, setActiveConversation, setConversations, setFolders, updateConversationTimestamp],
  );

  const { listenCanvasContentChangeEvent, stopListenCanvasContentChangeEvent } = useCanvasContentChangeSocket(
    { onCanvasContentChange },
  );

  return {
    listenCanvasContentChangeEvent,
    stopListenCanvasContentChangeEvent,
  };
};

export default useChatCanvasContentChange;
