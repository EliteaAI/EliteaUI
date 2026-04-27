import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, Skeleton } from '@mui/material';

import { ChatHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { ChatParticipantType, ROLES, WELCOME_MESSAGE_ID } from '@/common/constants';
import ApplicationAnswer from '@/components/Chat/ApplicationAnswer';
import { MessageList } from '@/components/Chat/StyledComponents';
import UserMessage from '@/components/Chat/UserMessage';
import { isParticipantStillActive } from '@/hooks/chat/useParticipantName';
import { actions as chatActions } from '@/slices/chat';

const isEditAPIReady = false;

const ChatMessageList = ({
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
}) => {
  const dispatch = useDispatch();
  const listRef = useRef();
  const listRefs = useRef([]);
  const messagesEndRef = useRef();
  const { id: userId } = useSelector(state => state.user);
  const canDeleteAllMessage = useMemo(
    () => activeConversation?.author_id === userId,
    [activeConversation?.author_id, userId],
  );
  const onClickSentTo = useCallback(
    participant => () => {
      if (participant && onSelectParticipant) {
        onSelectParticipant(participant);
      }
    },
    [onSelectParticipant],
  );

  const onClickReplyTo = useCallback(
    replyTo => () => {
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
    const myElement = listRef.current;
    const handleScroll = event => {
      const { scrollTop } = event.target;
      // Check if scrolled to top
      if (scrollTop <= 20) {
        const currentScrollHeight = myElement.scrollHeight;
        onScrollToTop &&
          onScrollToTop(() =>
            setTimeout(() => {
              listRef.current.scrollTop = myElement.scrollHeight - currentScrollHeight;
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

  // Simplified autoscroll: scroll new message to top of viewport
  const [bottomSpacer, setBottomSpacer] = useState(0);

  useEffect(() => {
    if (!askingQuestionId || !questionItemRef.current || !listRef.current) {
      setBottomSpacer(0);
      return;
    }

    const list = listRef.current;
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
            list.scrollTop = desired;
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

  return (
    <MessageList
      ref={listRef}
      sx={sx}
    >
      {/* Loading older messages skeleton */}
      {isLoadingMore && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              animation="wave"
              variant="rounded"
              width="100%"
              height="48px"
            />
          ))}
        </Box>
      )}
      {/* Messages */}
      {chat_history.map((message, index) => {
        const messageParticipant =
          message.role !== ROLES.User
            ? ChatHelpers.getParticipantById(activeConversation, message.participant_id)
            : { entity_meta: {}, meta: {} };
        return message.role === ROLES.User ? (
          <UserMessage
            verticalMode
            key={message.internal_id || message.id}
            messageId={message.id}
            name={message.name}
            avatar={message.avatar}
            ref={ref => {
              if (message.id === askingQuestionId) {
                questionItemRef.current = ref;
              }
              listRefs.current[index] = ref;
            }}
            content={message.content}
            message_items={message.message_items}
            created_at={message.created_at}
            sentTo={message.sentTo}
            onClickSentTo={onClickSentTo(message.sentTo)}
            onCopy={onCopyToClipboard ? onCopyToClipboard(message.id) : undefined}
            onDelete={
              index === chat_history.length - 1 &&
              (canDeleteAllMessage || message.user_id === userId) &&
              onDeleteAnswer
                ? onDeleteAnswer(message.id)
                : undefined
            }
            onSubmit={isEditAPIReady && userId === message.user_id ? onSubmitEditedMessage : undefined}
            onRemoveAttachment={onRemoveAttachment}
          />
        ) : (
          <ApplicationAnswer
            key={message.internal_id || message.id}
            verticalMode
            ref={ref => (listRefs.current[index] = ref)}
            answer={message.content}
            message_items={message.message_items}
            created_at={message.created_at}
            participant={messageParticipant}
            onClickReplyTo={onClickReplyTo(message.replyTo)}
            onCopy={onCopyToClipboard ? onCopyToClipboard(message.id) : undefined}
            onDelete={
              index === chat_history.length - 1 &&
              !message.archivedFromHitl &&
              !message.isSummarized &&
              message.id !== WELCOME_MESSAGE_ID &&
              (canDeleteAllMessage || ChatHelpers.canDeleteThisAIMessage(chat_history, message, userId)) &&
              onDeleteAnswer
                ? onDeleteAnswer(message.id)
                : undefined
            }
            onEdit={onEditCanvas?.(message)}
            selectedCodeBlockInfo={
              selectedCodeBlockInfo?.selectedMessage?.id === message.id ? selectedCodeBlockInfo : undefined
            }
            onRegenerate={
              !message.archivedFromHitl &&
              !message.isSummarized &&
              chat_history.length - 1 === index &&
              isParticipantStillActive(messageParticipant) &&
              !message.isLoading &&
              !message.isRegenerating &&
              onRegenerateAnswer &&
              ChatHelpers.canDeleteThisAIMessage(chat_history, message, userId)
                ? onRegenerateAnswer(message.id, messageParticipant)
                : undefined
            }
            isRegenerating={message.isRegenerating}
            shouldDisableRegenerate={
              isLoading ||
              isStreaming ||
              Boolean(message.isLoading) ||
              !messageParticipant?.entity_name ||
              message.id === WELCOME_MESSAGE_ID
            }
            references={message.references}
            exception={message.exception}
            toolActions={message.toolActions || []}
            tools={messageParticipant?.meta?.tools || toolsFromConversation}
            isLoading={Boolean(message.isLoading)}
            isStreaming={message.isStreaming}
            userId={userId}
            messageId={message.id}
            likes={message.likes}
            interaction_uuid={message.internal_id}
            conversation_uuid={activeConversation?.uuid}
            onRemoveAttachment={onRemoveAttachment}
            onOpenArtifactPreview={onOpenArtifactPreview}
            onContinueMcpExecution={
              chat_history.length - 1 === index && onContinueMcpExecution ? onContinueMcpExecution : undefined
            }
            onContinueTokenLimitExecution={
              chat_history.length - 1 === index && onContinueTokenLimitExecution
                ? onContinueTokenLimitExecution
                : undefined
            }
            requiresConfirmation={message.requiresConfirmation}
            hitlInterrupt={hideHitlActions ? null : message.hitlInterrupt}
            onHitlResume={
              !hideHitlActions && chat_history.length - 1 === index && onHitlResume ? onHitlResume : undefined
            }
            onHitlEditClick={
              !hideHitlActions && chat_history.length - 1 === index && onHitlEditClick
                ? onHitlEditClick
                : undefined
            }
            hideContinueButton={hideContinueButton}
            // Swarm mode props
            isSwarmChild={message.isSwarmChild}
            swarmAgentName={message.swarmAgentName}
            parentMessageId={message.parentMessageId}
          />
        );
      })}
      {/* Spacer placed AFTER messages to create extra scrollable area below target */}
      {bottomSpacer > 0 && (
        <div
          aria-hidden="true"
          data-testid="chat-bottom-spacer"
          style={{ height: bottomSpacer, width: 1, margin: 0, padding: 0, visibility: 'hidden' }}
        />
      )}
      <div ref={messagesEndRef} />
      {externalEndRef && <div ref={externalEndRef} />}
    </MessageList>
  );
};

export default ChatMessageList;
