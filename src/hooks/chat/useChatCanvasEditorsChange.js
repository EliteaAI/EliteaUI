import { useCallback } from 'react';

import { areTheSameConversations } from '@/common/utils';

import { useCanvasEditorsChangeSocket } from './useCanvasSocket';
import useUpdateConversationTimestamp from './useUpdateConversationTimestamp';

const getNewChatHistory = (chat_history, message_group_uuid, canvas_uuid, editors) =>
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
                    editors: [...editors],
                  },
                },
          ),
        },
  ) || [];

const newGetNewMessageGroups = (message_groups, message_group_uuid, canvas_uuid, editors) =>
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
                    editors: [...editors],
                  },
                },
          ),
        },
  ) || [];

const useChatCanvasEditorsChange = ({
  activeConversation,
  setActiveConversation,
  setConversations,
  setFolders,
}) => {
  const { updateConversationTimestamp } = useUpdateConversationTimestamp();

  const onCanvasEditorsChange = useCallback(
    async message => {
      const { editors, canvas_uuid, message_group_uuid } = message || {};
      // console.log('onCanvasEditorsChange=========>', message, editors, canvas_uuid, message_group_uuid)
      if (message_group_uuid && canvas_uuid) {
        const updatedTimestamp = new Date().toISOString();

        setActiveConversation(prevConversation => ({
          ...prevConversation,
          chat_history: [
            ...getNewChatHistory(prevConversation.chat_history, message_group_uuid, canvas_uuid, editors),
          ],
          message_groups: [
            ...newGetNewMessageGroups(
              prevConversation.message_groups,
              message_group_uuid,
              canvas_uuid,
              editors,
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
                  ...getNewChatHistory(item.chat_history, message_group_uuid, canvas_uuid, editors),
                ],
                message_groups: [
                  ...newGetNewMessageGroups(item.message_groups, message_group_uuid, canvas_uuid, editors),
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
                      ...getNewChatHistory(item.chat_history, message_group_uuid, canvas_uuid, editors),
                    ],
                    message_groups: [
                      ...newGetNewMessageGroups(
                        item.message_groups,
                        message_group_uuid,
                        canvas_uuid,
                        editors,
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

  const { listenCanvasEditorsChangeEvent, stopListenCanvasEditorsChangeEvent } = useCanvasEditorsChangeSocket(
    { onCanvasEditorsChange },
  );

  return {
    listenCanvasEditorsChangeEvent,
    stopListenCanvasEditorsChangeEvent,
  };
};

export default useChatCanvasEditorsChange;
