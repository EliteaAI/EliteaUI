import { useEffect, useRef } from 'react';

import { useSelector } from 'react-redux';

import { useLazyConversationDetailsQuery, useLazyMessageTracesQuery } from '@/[fsd]/features/chat/api';
import { sioEvents } from '@/common/constants';
import {
  buildTraceListParams,
  convertConversationToChatHistory,
} from '@/common/convertChatConversationMessages';
import { useManualSocket } from '@/hooks/useSocket';

export const useChatSocketReconnect = ({ activeConversation, projectId, setActiveConversation }) => {
  const { emit: emitEnterRoom } = useManualSocket(sioEvents.chat_enter_room);
  const [getConversationDetail] = useLazyConversationDetailsQuery();
  const [getMessageTraces] = useLazyMessageTracesQuery();

  const socketConnected = useSelector(state => state.settings.socketConnected);
  // null = initial mount (no reconnect yet), true = was disconnected, false = normal connected state
  const wasDisconnectedRef = useRef(null);

  useEffect(() => {
    if (!socketConnected) {
      if (activeConversation?.uuid) {
        wasDisconnectedRef.current = true;
      }
      return;
    }

    if (wasDisconnectedRef.current !== true) {
      wasDisconnectedRef.current = false;
      return;
    }

    wasDisconnectedRef.current = false;

    const uuid = activeConversation?.uuid;
    const convId = activeConversation?.id;
    if (!uuid || !convId) return;
    emitEnterRoom({ conversation_id: convId, conversation_uuid: uuid, project_id: projectId });

    (async () => {
      const result = await getConversationDetail({ projectId, id: convId });
      if (!result.data) return;
      const tracesResult = await getMessageTraces({
        projectId,
        conversationId: convId,
        params: buildTraceListParams(result.data.message_groups),
      });
      setActiveConversation(prev => {
        if (!prev || prev.id !== convId) return prev;
        return {
          ...prev,
          ...result.data,
          chat_history: convertConversationToChatHistory(result.data, tracesResult.data),
        };
      });
    })();
  }, [
    socketConnected,
    activeConversation?.uuid,
    activeConversation?.id,
    projectId,
    emitEnterRoom,
    getConversationDetail,
    getMessageTraces,
    setActiveConversation,
  ]);
};
