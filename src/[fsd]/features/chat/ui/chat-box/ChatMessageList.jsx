import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, Skeleton } from '@mui/material';

import { ScrollableContainer } from '@/[fsd]/shared/ui';
import { ChatParticipantType, ROLES } from '@/common/constants';
import { MessageList } from '@/components/Chat/StyledComponents';
import { actions as chatActions, selectMessageIdToView } from '@/slices/chat';

import ChatMessageWrapper from './ChatMessageWrapper';

const ChatMessageList = memo(props => {
  const {
    sx,
    chat_history,
    activeConversation,
    onSubmitEditedMessage,
    onDeleteAnswer,
    onEditCanvas,
    selectedCodeBlockInfo,
    onRegenerateAnswer,
    onContinueMcpExecution,
    onContinueTokenLimitExecution,
    onHitlResume,
    onHitlEditClick,
    onCopyToClipboard,
    onSelectParticipant,
    onScrollToTop,
    isLoading,
    isStreaming,
    isLoadingMore,
    askingQuestionId,
    questionItemRef,
    externalEndRef,
    onRemoveAttachment,
    hideContinueButton,
    hideHitlActions,
    onOpenArtifactPreview,
    isSpeakingMode = false,
    onAutoSpeak,
    speakingMessageId,
    speakingSegments,
    spokenRange,
  } = props;

  const dispatch = useDispatch();
  const listRef = useRef();
  const listRefs = useRef([]);
  const messagesEndRef = useRef();
  const messageIdToView = useSelector(selectMessageIdToView);

  // Simplified autoscroll: scroll new message to top of viewport
  const [bottomSpacer, setBottomSpacer] = useState(0);
  const { id: userId } = useSelector(state => state.user);

  const canDeleteAllMessage = useMemo(
    () => activeConversation?.author_id === userId,
    [activeConversation?.author_id, userId],
  );

  const lastUserMessageIndex = useMemo(
    () => chat_history.reduce((last, msg, i) => (msg.role === ROLES.User ? i : last), -1),
    [chat_history],
  );

  const onClickSentTo = useCallback(
    participant => {
      if (participant && onSelectParticipant) onSelectParticipant(participant);
    },
    [onSelectParticipant],
  );

  const onClickReplyTo = useCallback(
    replyTo => {
      const index = chat_history.findIndex(
        message => message.id === replyTo?.uuid || message.id === replyTo?.id,
      );
      listRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
      dispatch(
        chatActions.setMessageIdToView({
          messageIdToView: replyTo?.uuid ?? replyTo?.id ?? '',
        }),
      );
    },
    [chat_history, dispatch],
  );

  useEffect(() => {
    const myElement = listRef.current?.getScrollElement();
    const handleScroll = event => {
      const { scrollTop } = event.target;
      // Check if scrolled to top
      if (scrollTop <= 20) {
        const currentScrollHeight = myElement.scrollHeight;
        onScrollToTop &&
          onScrollToTop(() =>
            setTimeout(() => {
              const el = listRef.current?.getScrollElement();
              if (el) el.scrollTop = myElement.scrollHeight - currentScrollHeight;
            }, 0),
          );
      }
    };
    if (myElement) {
      myElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (myElement) {
        myElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [onScrollToTop]);

  useEffect(() => {
    // Only scroll to bottom if we're not auto-scrolling to a specific question
    if (!askingQuestionId) {
      messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [activeConversation?.id, askingQuestionId]);

  useEffect(() => {
    if (!messageIdToView || !chat_history?.length) return;
    const index = chat_history.findIndex(msg => msg.id === messageIdToView || msg.uuid === messageIdToView);
    if (index !== -1) {
      listRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      dispatch(chatActions.setMessageIdToView({ messageIdToView: '' }));
    }
  }, [messageIdToView, chat_history, dispatch]);

  useEffect(() => {
    const scrollEl = listRef.current?.getScrollElement();
    if (!askingQuestionId || !questionItemRef.current || !scrollEl) {
      setBottomSpacer(0);
      return;
    }

    const list = scrollEl;
    const targetEl = questionItemRef.current;

    // Simple approach: try to scroll, add spacer if needed
    const scrollToTop = () => {
      const desired = targetEl.offsetTop;
      const maxScroll = list.scrollHeight - list.clientHeight;

      if (maxScroll >= desired) {
        // Can reach target, scroll to it
        list.scrollTop = desired;
        setBottomSpacer(0);
      } else {
        // Need more space, add spacer
        const spacerHeight = desired - maxScroll + 50;
        setBottomSpacer(spacerHeight);

        // Scroll after spacer is applied
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            const el = listRef.current?.getScrollElement();
            if (el) el.scrollTop = desired;
          });
        }
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToTop, 50);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askingQuestionId]);

  const toolsFromConversation = useMemo(
    () => activeConversation?.participants?.filter(p => p.entity_name === ChatParticipantType.Toolkits) || [],
    [activeConversation?.participants],
  );

  const styles = chatMessageListStyles(bottomSpacer);

  return (
    <ScrollableContainer ref={listRef}>
      <MessageList sx={sx}>
        {/* Loading older messages skeleton */}
        {isLoadingMore && (
          <Box sx={styles.loadingMoreContainer}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                animation="wave"
                variant="rounded"
                sx={styles.loadingSkeleton}
              />
            ))}
          </Box>
        )}
        {/* Messages */}
        {chat_history.map((message, index) => (
          <ChatMessageWrapper
            key={message.id || message.internal_id}
            message={message}
            index={index}
            chat_history={chat_history}
            activeConversation={activeConversation}
            askingQuestionId={askingQuestionId}
            questionItemRef={questionItemRef}
            listRefs={listRefs}
            onClickSentTo={onClickSentTo}
            onCopyToClipboard={onCopyToClipboard}
            canDeleteAllMessage={canDeleteAllMessage}
            userId={userId}
            onDeleteAnswer={onDeleteAnswer}
            getOnSubmit={
              userId === message.user_id && index === lastUserMessageIndex && !isLoading && !isStreaming
                ? onSubmitEditedMessage
                : undefined
            }
            onRemoveAttachment={onRemoveAttachment}
            onClickReplyTo={onClickReplyTo}
            onEditCanvas={onEditCanvas}
            selectedCodeBlockInfo={selectedCodeBlockInfo}
            onRegenerateAnswer={onRegenerateAnswer}
            isLoading={isLoading}
            isStreaming={isStreaming}
            toolsFromConversation={toolsFromConversation}
            onOpenArtifactPreview={onOpenArtifactPreview}
            onContinueMcpExecution={onContinueMcpExecution}
            onContinueTokenLimitExecution={onContinueTokenLimitExecution}
            onHitlResume={onHitlResume}
            onHitlEditClick={onHitlEditClick}
            hideHitlActions={hideHitlActions}
            hideContinueButton={hideContinueButton}
            isSpeakingMode={isSpeakingMode}
            onAutoSpeak={onAutoSpeak}
            speakingMessageId={speakingMessageId}
            speakingSegments={speakingSegments}
            spokenRange={spokenRange}
          />
        ))}
        {/* Spacer placed AFTER messages to create extra scrollable area below target */}
        {bottomSpacer > 0 && (
          <Box
            aria-hidden="true"
            data-testid="chat-bottom-spacer"
            sx={styles.bottomSpacer}
          />
        )}
        <Box ref={messagesEndRef} />
        {externalEndRef && <Box ref={externalEndRef} />}
      </MessageList>
    </ScrollableContainer>
  );
});

ChatMessageList.displayName = 'ChatMessageList';

/** @type {MuiSx} */
const chatMessageListStyles = bottomSpacer => ({
  loadingMoreContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  loadingSkeleton: {
    width: '100%',
    height: '3rem',
  },
  bottomSpacer: {
    height: bottomSpacer,
    width: '0.0625rem',
    margin: 0,
    padding: 0,
    visibility: 'hidden',
  },
});

export default ChatMessageList;
