import { useCallback } from 'react';

import { ActiveConversationParticipantKey } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export default function useLocalActiveParticipant() {
  const projectId = useSelectedProjectId();

  const getLocalActiveParticipantMap = useCallback(() => {
    const activeParticipantString = localStorage.getItem(ActiveConversationParticipantKey) || '{}';
    return JSON.parse(activeParticipantString);
  }, []);

  const getLocalActiveParticipant = useCallback(
    conversationId => {
      const list = getLocalActiveParticipantMap()[projectId] || [];
      const foundItem = list.find(item => item.cid == conversationId) || {};
      return {
        conversationId: foundItem.cid,
        participantId: foundItem.pid,
      };
    },
    [getLocalActiveParticipantMap, projectId],
  );

  const setLocalActiveParticipant = useCallback(
    (conversationId, participantId) => {
      const map = getLocalActiveParticipantMap();
      const list = map[projectId] || [];
      const foundItem = list.find(item => item.cid == conversationId);
      if (foundItem) {
        localStorage.setItem(
          ActiveConversationParticipantKey,
          JSON.stringify({
            ...map,
            [projectId]: list.map(item =>
              item.cid != conversationId ? item : { cid: conversationId, pid: participantId },
            ),
          }),
        );
      } else {
        localStorage.setItem(
          ActiveConversationParticipantKey,
          JSON.stringify({
            ...map,
            [projectId]: [{ cid: conversationId, pid: participantId }, ...list],
          }),
        );
      }
    },
    [getLocalActiveParticipantMap, projectId],
  );

  const clearLocalActiveParticipant = useCallback(
    conversationId => {
      const map = getLocalActiveParticipantMap();
      const list = map[projectId] || [];
      const leftList = list.filter(item => item.cid != conversationId);
      localStorage.setItem(
        ActiveConversationParticipantKey,
        JSON.stringify({
          ...map,
          [projectId]: leftList,
        }),
      );
    },
    [getLocalActiveParticipantMap, projectId],
  );

  return {
    getLocalActiveParticipant,
    setLocalActiveParticipant,
    clearLocalActiveParticipant,
  };
}
