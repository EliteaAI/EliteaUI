import { useCallback, useEffect } from 'react';

import { useDispatch, useSelector, useStore } from 'react-redux';

import { useSocket } from '@/[fsd]/features/auth/lib/hooks';
import {
  runStatusActions,
  selectConversationRunStatus,
  selectOpenConversationUuid,
} from '@/[fsd]/features/chat/model';
import { sioEvents } from '@/common/constants';

// App-wide: the list must learn about runs of chats that are not open (EL-7385)
export const useChatRunStatusSocket = () => {
  const dispatch = useDispatch();
  // Read lazily: subscribing would re-render the layout on every chat switch
  const store = useStore();

  const handleRunStatus = useCallback(
    frame => {
      if (!frame?.project_id || !frame?.conversation_uuid || !frame?.status) return;
      dispatch(
        runStatusActions.applyRunStatus({
          projectId: frame.project_id,
          conversationUuid: frame.conversation_uuid,
          messageGroupUuid: frame.message_group_uuid,
          status: frame.status,
          openConversationUuid: selectOpenConversationUuid(store.getState()),
        }),
      );
    },
    [dispatch, store],
  );

  useSocket(sioEvents.chat_run_status, handleRunStatus);
};

// The open chat's notice is read as soon as it is on screen
export const useMarkConversationRunSeen = (projectId, conversationUuid) => {
  const dispatch = useDispatch();
  const { unread } = useSelector(selectConversationRunStatus(projectId, conversationUuid));

  useEffect(() => {
    if (projectId && conversationUuid && unread) {
      dispatch(runStatusActions.markSeen({ projectId, conversationUuid }));
    }
  }, [conversationUuid, dispatch, projectId, unread]);
};

export const useConversationRunStatus = (projectId, conversation) => {
  const entry = useSelector(selectConversationRunStatus(projectId, conversation?.uuid));
  // Before any socket frame, the list row's own field is the answer
  const isRunning = entry.isRunning ?? !!conversation?.has_running_task;
  return { isRunning, unread: isRunning ? null : entry.unread || null };
};
