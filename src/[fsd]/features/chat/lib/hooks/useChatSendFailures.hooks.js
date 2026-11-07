import { useCallback, useEffect, useRef } from 'react';

import { useDispatch, useSelector, useStore } from 'react-redux';

import { SessionConstants } from '@/[fsd]/features/auth/lib/constants';
import { useSocket } from '@/[fsd]/features/auth/lib/hooks';
import { applySendFailures } from '@/[fsd]/features/chat/lib/helpers/sendFailures.helpers';
import {
  selectConversationSendFailures,
  sendFailuresActions,
  sendFailuresName,
} from '@/[fsd]/features/chat/model';
import { sioEvents } from '@/common/constants';

const { SEND_NO_RESPONSE_CODE } = SessionConstants;

// App-wide, so it keeps listening after the user left the chat a message was sent from
export const useChatSendOutcomeTracker = () => {
  const dispatch = useDispatch();
  // Read lazily in the handlers: subscribing would re-render the layout on every send
  const store = useStore();

  const getState = useCallback(() => store.getState()[sendFailuresName] || {}, [store]);

  const handleChatFrame = useCallback(
    frame => {
      const questionId = frame?.question_id || frame?.content?.question_id;
      if (!questionId || !getState().pendingSends?.[questionId]) return;
      dispatch(sendFailuresActions.settleSend({ questionId }));
    },
    [dispatch, getState],
  );

  const handleRefusal = useCallback(
    frame => {
      const questionId = frame?.message_id;
      const { pendingSends, openConversationUuid } = getState();
      const pending = questionId && pendingSends?.[questionId];
      if (!pending) return;
      // The open chat shows its own failures; "no response" is expected once the user left the chat's room
      if (pending.conversationUuid === openConversationUuid || frame.code === SEND_NO_RESPONSE_CODE) {
        dispatch(sendFailuresActions.settleSend({ questionId }));
        return;
      }
      dispatch(
        sendFailuresActions.recordFailure({
          questionId,
          conversationUuid: pending.conversationUuid,
          error: frame.content,
        }),
      );
    },
    [dispatch, getState],
  );

  useSocket(sioEvents.chat_predict, handleChatFrame);
  useSocket(sioEvents.socket_validation_error, handleRefusal);
};

export const useApplyChatSendFailures = props => {
  const { conversationUuid, isLoaded, chatHistory, setChatHistory } = props;
  const dispatch = useDispatch();
  const failures = useSelector(selectConversationSendFailures(conversationUuid));
  const setChatHistoryRef = useRef(setChatHistory);

  useEffect(() => {
    setChatHistoryRef.current = setChatHistory;
  }, [setChatHistory]);

  // No chat counts as open while one is loading: the REST load would drop a failure shown in it
  useEffect(() => {
    dispatch(
      sendFailuresActions.setOpenConversation({ conversationUuid: isLoaded ? conversationUuid : null }),
    );
  }, [conversationUuid, dispatch, isLoaded]);

  useEffect(() => {
    return () => {
      dispatch(sendFailuresActions.setOpenConversation({ conversationUuid: null }));
    };
  }, [dispatch]);

  useEffect(() => {
    if (!conversationUuid || !isLoaded || !Object.keys(failures).length) return;
    // Failures that can't be placed yet stay kept for a later history update
    const { appliedQuestionIds } = applySendFailures(chatHistory, failures);
    if (!appliedQuestionIds.length) return;
    const applied = Object.fromEntries(appliedQuestionIds.map(id => [id, failures[id]]));
    setChatHistoryRef.current?.(prev => applySendFailures(prev, applied).chatHistory);
    dispatch(sendFailuresActions.clearFailures({ conversationUuid, questionIds: appliedQuestionIds }));
  }, [chatHistory, conversationUuid, dispatch, failures, isLoaded]);
};
