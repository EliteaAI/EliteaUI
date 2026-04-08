import { useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useMatch } from 'react-router-dom';

import RouteDefinitions from '@/routes';
import { actions as chatActions } from '@/slices/chat';

const HIGHLIGHT_DURATION = 2000;

const useHighlightUserMessage = messageId => {
  const dispatch = useDispatch();
  const messageIdToView = useSelector(state => state.chat.messageIdToView);
  const [highLightMe, setHighLightMe] = useState(false);
  const isChatPage = useMatch({ path: RouteDefinitions.ChatConversation });

  useEffect(() => {
    if (isChatPage && messageIdToView === messageId) {
      setHighLightMe(true);
      setTimeout(() => {
        setHighLightMe(false);
        dispatch(
          chatActions.setMessageIdToView({
            messageIdToView: '',
          }),
        );
      }, HIGHLIGHT_DURATION);
    }
  }, [dispatch, isChatPage, messageId, messageIdToView]);

  return {
    highLightMe,
  };
};

export default useHighlightUserMessage;
