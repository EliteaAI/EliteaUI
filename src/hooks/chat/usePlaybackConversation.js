import { useCallback, useEffect } from 'react';

import { useSelector } from 'react-redux';

import { useConversationNavigation } from '@/[fsd]/features/chat/lib/hooks';
import { useLazyConversationDetailsQuery, useLazyMessageListQuery } from '@/api/chat';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { convertMessagesToChatHistory } from '../../common/convertChatConversationMessages';

export const PLAYBACK_PAGE_SIZE = 100;

const usePlaybackConversation = ({
  setActiveConversation,
  setConversations,
  setFolders,
  toastError,
  playbackChatBoxRef,
  activeConversation,
}) => {
  const projectId = useSelectedProjectId();
  const user = useSelector(state => state.user);
  const { clearUrlConversation } = useConversationNavigation();

  const [getMessageList, { isError, error }] = useLazyMessageListQuery();
  const [getConversationDetail, { isError: isQueryDetailError, error: queryDetailError }] =
    useLazyConversationDetailsQuery();

  const onPlaybackConversation = useCallback(
    async conversation => {
      // Avoid resetting playback if it's already active
      if (conversation.id === activeConversation?.id && activeConversation.isPlayback) {
        return;
      }

      playbackChatBoxRef.current?.reset();
      const result = await getConversationDetail({
        projectId,
        id: conversation.id,
      });

      if (result.data) {
        const { data: messages } = await getMessageList({
          projectId,
          conversationId: result.data.id,
          page: 0,
          pageSize: PLAYBACK_PAGE_SIZE,
          params: {
            sort_by: 'created_at',
            sort_order: 'asc',
          },
        });

        const userParticipantsIds = (result.data.participants ?? [])
          .filter(p => p.entity_name === 'user')
          .map(i => i.id);
        const firstUserMessage = messages.rows.find(i =>
          userParticipantsIds.includes(i.author_participant_id),
        );
        const chatHistory = convertMessagesToChatHistory(messages.rows, result.data.participants, {
          user,
          firstUserMessage,
        });

        const newParticipants = (result.data.participants ?? []).filter(
          participant => participant.id !== firstUserMessage?.author_participant_id,
        );
        const newPlaybackConversation = {
          ...conversation,
          ...result.data,
          participants: newParticipants,
          chat_history: chatHistory,
          isPlayback: true,
          messages_count: messages.total,
          name: `[Playback] ${conversation.name}`,
        };

        setActiveConversation(newPlaybackConversation);

        if (conversation.folder_id) {
          // Conversation belongs to a folder
          setFolders(prevFolders =>
            prevFolders.map(folder => {
              if (folder.id === conversation.folder_id) {
                return {
                  ...folder,
                  conversations: [
                    newPlaybackConversation, // Add new playback conversation at the beginning
                    ...folder.conversations,
                  ],
                };
              }
              return folder; // Return folder unchanged
            }),
          );
        } else {
          // Conversation is ungrouped
          setConversations(prev => {
            const filteredItems = prev.filter(
              item => !item.isNew && (item.id !== newPlaybackConversation.id || !item.isPlayback),
            );
            return [newPlaybackConversation, ...filteredItems];
          });
        }

        clearUrlConversation();
      }
    },
    [
      user,
      playbackChatBoxRef,
      getConversationDetail,
      projectId,
      setActiveConversation,
      setConversations,
      setFolders,
      clearUrlConversation,
      getMessageList,
      activeConversation,
    ],
  );

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  useEffect(() => {
    if (isQueryDetailError) {
      toastError(buildErrorMessage(queryDetailError));
    }
  }, [queryDetailError, isQueryDetailError, toastError]);

  return {
    onPlaybackConversation,
  };
};

export default usePlaybackConversation;
