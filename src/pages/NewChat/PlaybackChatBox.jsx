import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { ROLES } from '@/common/constants';
import { ChatBodyContainer, ChatBoxContainer } from '@/components/Chat/StyledComponents';
import useLoadPlaybackMessages from '@/hooks/chat/useLoadPlaybackMessages';

import ChatMessageList from '../../components/Chat/ChatMessageList';
import PlaybackToolBar from './PlaybackToolBar';

const PlaybackChatBox = forwardRef((props, ref) => {
  const messagesEndRef = useRef();
  const { messageListSX, conversation, toastError } = props;
  const [chatHistory, setChatHistory] = useState(
    [{ isStart: true }, ...(conversation?.chat_history || []), { isEnd: true }],
    [],
  );
  useEffect(() => {
    setChatHistory([{ isStart: true }, ...(conversation?.chat_history || []), { isEnd: true }]);
  }, [conversation?.chat_history]);

  const [messageList, setMessageList] = useState([]);
  const messageListRef = useRef(messageList);
  useEffect(() => {
    messageListRef.current = messageList;
  }, [messageList]);
  const chatHistoryRef = useRef([...chatHistory]);
  useEffect(() => {
    chatHistoryRef.current = [...chatHistory];
  }, [chatHistory]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState(undefined);
  const [isMockingThinking, setIsMockingThinking] = useState(false);
  const { onLoadMoreMessages, isLoadingMore, setPage } = useLoadPlaybackMessages({
    conversation,
    toastError,
  });
  const user = useSelector(state => state.user);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setChatHistory([]);
      setMessageList([]);
      setCurrentIndex(0);
      setMessage(undefined);
      setIsMockingThinking(false);
      setPage(1);
    },
  }));

  const onBackward = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (message) {
      setMessage(null);
      setCurrentIndex(prev => prev - 1);
    } else {
      if (chatHistoryRef.current[currentIndex].isEnd) {
        if (chatHistoryRef.current[prevIndex]?.role === ROLES.User) {
          chatHistoryRef.current[prevIndex]?.name === user.name &&
            setMessage(chatHistoryRef.current[prevIndex]);
          setMessageList(prev => {
            const newMessages = [...prev];
            newMessages.pop();
            return newMessages;
          });
          setCurrentIndex(prev => prev - 1);
        } else {
          if (chatHistoryRef.current[prevIndex - 1]?.role === ROLES.User) {
            chatHistoryRef.current[prevIndex - 1]?.name === user.name &&
              setMessage(chatHistoryRef.current[prevIndex - 1]);
            setMessageList(prev => {
              const newMessages = [...prev];
              newMessages.pop();
              newMessages.pop();
              return newMessages;
            });
            setCurrentIndex(prev => prev - 1);
          } else {
            setMessage(null);
            setMessageList(prev => {
              const newMessages = [...prev];
              newMessages.pop();
              return newMessages;
            });
            setCurrentIndex(prev => prev - 1);
          }
        }
      } else if (chatHistoryRef.current[currentIndex].isStart) {
        //Reach the start
        setMessage(null);
        setMessageList([]);
        setCurrentIndex(0);
      } else if (chatHistoryRef.current[currentIndex]?.role === ROLES.User) {
        chatHistoryRef.current[currentIndex]?.name === user.name &&
          setMessage(chatHistoryRef.current[currentIndex]);
        setMessageList(prev => {
          const newMessages = [...prev];
          newMessages.pop();
          return newMessages;
        });
      } else if (chatHistoryRef.current[currentIndex]?.role === ROLES.Assistant) {
        if (chatHistoryRef.current[prevIndex]?.role === ROLES.User) {
          chatHistoryRef.current[prevIndex]?.name === user.name &&
            setMessage(chatHistoryRef.current[prevIndex]);
          setMessageList(prev => {
            const newMessages = [...prev];
            newMessages.pop();
            newMessages.pop();
            return newMessages;
          });
        } else {
          setMessage(null);
          setMessageList(prev => {
            const newMessages = [...prev];
            newMessages.pop();
            return newMessages;
          });
        }
        setCurrentIndex(prev => prev - 1);
      } else {
        // console.log('wtf is else?')
      }
    }
  }, [currentIndex, message, user?.name]);

  const onForward = useCallback(async () => {
    const nextIndex = currentIndex + 1;
    const currentMessage = chatHistoryRef.current[currentIndex];
    let nextMessage = chatHistoryRef.current[nextIndex];
    if (currentMessage?.isStart) {
      setMessageList([]);
      setMessage(chatHistoryRef.current[nextIndex]);
    } else {
      if (
        chatHistoryRef.current.length < conversation.messages_count + 2 &&
        chatHistoryRef.current[nextIndex]?.isEnd
      ) {
        //Load more
        const moreMessages = await onLoadMoreMessages();
        if (moreMessages) {
          const filteredMessages = moreMessages.filter(
            msg => !chatHistoryRef.current.find(item => item.id === msg.id),
          );
          Array.prototype.splice.apply(chatHistoryRef.current, [nextIndex, 0].concat(filteredMessages));
          setChatHistory([...chatHistoryRef.current]);
          nextMessage = chatHistoryRef.current[nextIndex];
        }
      }

      if (nextMessage.role === ROLES.User) {
        nextMessage.name === user.name && setMessage(nextMessage);
        if (currentMessage.role === ROLES.User) {
          setMessageList(prev => [...prev, { ...currentMessage, created_at: new Date().getTime() }]);
        }
      } else if (nextMessage.role === ROLES.Assistant) {
        setMessage(null);
        const newMessages =
          currentMessage.role === ROLES.User
            ? [
                ...messageList,
                { ...currentMessage, created_at: new Date().getTime() },
                {
                  ...nextMessage,
                  isLoading: true,
                  content: '',
                  created_at: new Date().getTime(),
                },
              ]
            : [
                ...messageList,
                { ...nextMessage, isLoading: true, content: '', created_at: new Date().getTime() },
              ];
        const lastMessageIndex = newMessages.length - 1;
        const chatIndex = nextIndex;
        setIsMockingThinking(true);
        setTimeout(() => {
          if (messageListRef.current.length > lastMessageIndex) {
            setMessageList(prev => {
              const modifiedMessages = [...prev];
              modifiedMessages[lastMessageIndex].isLoading = false;
              modifiedMessages[lastMessageIndex].content = chatHistoryRef.current[chatIndex].content;
              modifiedMessages[lastMessageIndex].created_at = new Date().getTime();
              return modifiedMessages;
            });
          }
          setIsMockingThinking(false);
        }, 1000);
        setMessageList(newMessages);
      } else {
        // Reaching the End
        setMessage(null);
        setMessageList(prev => [...prev, { ...currentMessage, created_at: new Date().getTime() }]);
      }
    }
    setCurrentIndex(prev => prev + 1);
  }, [conversation.messages_count, currentIndex, messageList, onLoadMoreMessages, user?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messageList]);

  if (props.hidden) return null;

  return (
    <>
      <ChatBoxContainer
        role="presentation"
        sx={styles.chatBoxContainer}
      >
        <ChatBodyContainer sx={styles.chatBodyContainer}>
          <ChatMessageList
            sx={messageListSX}
            chat_history={messageList}
            activeConversation={conversation}
            externalEndRef={messagesEndRef}
          />
          <PlaybackToolBar
            onForward={onForward}
            onBackward={onBackward}
            disableBackward={!currentIndex}
            disableForward={
              currentIndex >=
              conversation.messages_count +
                (chatHistoryRef.current[conversation.messages_count]?.role === ROLES.User ? 1 : 0)
            }
            message={message}
            sx={styles.playbackToolbar}
            isMockingThinking={isMockingThinking || isLoadingMore}
          />
        </ChatBodyContainer>
      </ChatBoxContainer>
    </>
  );
});

const styles = {
  chatBoxContainer: { paddingBottom: '0px' },
  chatBodyContainer: theme => ({
    [theme.breakpoints.up('lg')]: {
      height: 'calc(100vh - 160px)',
    },
    [theme.breakpoints.down('lg')]: {
      height: '500px',
    },
  }),
  playbackToolbar: { gap: '8px', alignItems: 'center' },
};

PlaybackChatBox.displayName = 'PlaybackChatBox';

PlaybackChatBox.propTypes = {};

export default PlaybackChatBox;
