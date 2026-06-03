import { memo, useCallback, useMemo } from 'react';

import * as ChatHelpers from '@/[fsd]/features/chat/lib/helpers/chat.helpers';
import { ApplicationAnswer, UserMessage } from '@/[fsd]/features/chat/ui/chat-box';
import { ROLES, WELCOME_MESSAGE_ID } from '@/common/constants';
import { isParticipantStillActive } from '@/hooks/chat/useParticipantName';

const ChatMessageWrapper = memo(props => {
  const {
    message,
    index,
    chat_history,
    activeConversation,
    askingQuestionId,
    questionItemRef,
    listRefs,
    onClickSentTo,
    onCopyToClipboard,
    canDeleteAllMessage,
    userId,
    onDeleteAnswer,
    getOnSubmit,
    onRemoveAttachment,
    onClickReplyTo,
    onEditCanvas,
    selectedCodeBlockInfo,
    onRegenerateAnswer,
    isLoading,
    isStreaming,
    toolsFromConversation,
    onOpenArtifactPreview,
    onContinueMcpExecution,
    onContinueTokenLimitExecution,
    onHitlResume,
    onHitlEditClick,
    hideHitlActions,
    hideContinueButton,
    isSpeakingMode,
    onAutoSpeak,
    speakingMessageId,
    speakingSegments,
    spokenRange,
  } = props;

  const isLastMessage = chat_history.length - 1 === index;

  const messageParticipant = useMemo(
    () =>
      message.role !== ROLES.User
        ? ChatHelpers.getParticipantById(activeConversation, message.participant_id)
        : { entity_meta: {}, meta: {} },
    [activeConversation, message.participant_id, message.role],
  );

  const shouldDisableRegenerate = useMemo(
    () =>
      isLoading ||
      isStreaming ||
      Boolean(message.isLoading) ||
      !messageParticipant?.entity_name ||
      message.id === WELCOME_MESSAGE_ID,
    [isLoading, isStreaming, message?.isLoading, messageParticipant?.entity_name, message?.id],
  );

  const onCopy = useCallback(() => {
    onCopyToClipboard(message.id);
  }, [message?.id, onCopyToClipboard]);

  const onSendToClick = useCallback(() => {
    onClickSentTo(message.sentTo);
  }, [message?.sentTo, onClickSentTo]);

  const onDelete = useCallback(() => {
    onDeleteAnswer(message.id);
  }, [message?.id, onDeleteAnswer]);

  const onReplyTo = useCallback(() => {
    onClickReplyTo(message.replyTo);
  }, [message?.replyTo, onClickReplyTo]);

  const onRegenerate = useCallback(() => {
    onRegenerateAnswer(message.id, messageParticipant);
  }, [message?.id, messageParticipant, onRegenerateAnswer]);

  const onCanvasEdit = useCallback(
    data => {
      onEditCanvas?.(message, data);
    },
    [message, onEditCanvas],
  );

  if (message.role === ROLES.User)
    return (
      <UserMessage
        verticalMode
        ref={ref => {
          if (message.id === askingQuestionId) questionItemRef.current = ref;

          listRefs.current[index] = ref;
        }}
        messageId={message.id}
        name={message.name}
        avatar={message.avatar}
        content={message.content}
        message_items={message.message_items}
        created_at={message.created_at}
        sentTo={message.sentTo}
        onClickSentTo={onSendToClick}
        onCopy={onCopyToClipboard ? onCopy : undefined}
        onDelete={
          isLastMessage && (canDeleteAllMessage || message.user_id === userId) && onDeleteAnswer
            ? onDelete
            : undefined
        }
        onSubmit={getOnSubmit}
        onRemoveAttachment={onRemoveAttachment}
      />
    );

  return (
    <ApplicationAnswer
      verticalMode
      ref={ref => (listRefs.current[index] = ref)}
      answer={message.content}
      message_items={message.message_items}
      created_at={message.created_at}
      participant={messageParticipant}
      onClickReplyTo={onReplyTo}
      onCopy={onCopyToClipboard ? onCopy : undefined}
      onDelete={
        isLastMessage &&
        !message.archivedFromHitl &&
        !message.isSummarized &&
        message.id !== WELCOME_MESSAGE_ID &&
        (canDeleteAllMessage || ChatHelpers.canDeleteThisAIMessage(chat_history, message, userId)) &&
        onDeleteAnswer
          ? onDelete
          : undefined
      }
      onEdit={onCanvasEdit}
      selectedCodeBlockInfo={
        selectedCodeBlockInfo?.selectedMessage?.id === message.id ? selectedCodeBlockInfo : undefined
      }
      onRegenerate={
        !message.archivedFromHitl &&
        !message.isSummarized &&
        isLastMessage &&
        isParticipantStillActive(messageParticipant) &&
        !message.isLoading &&
        !message.isRegenerating &&
        ChatHelpers.canDeleteThisAIMessage(chat_history, message, userId)
          ? onRegenerate
          : undefined
      }
      isRegenerating={message.isRegenerating}
      shouldDisableRegenerate={shouldDisableRegenerate}
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
      onContinueMcpExecution={isLastMessage && onContinueMcpExecution ? onContinueMcpExecution : undefined}
      onContinueTokenLimitExecution={
        isLastMessage && onContinueTokenLimitExecution ? onContinueTokenLimitExecution : undefined
      }
      requiresConfirmation={message.requiresConfirmation}
      hitlInterrupt={hideHitlActions ? null : message.hitlInterrupt}
      onHitlResume={!hideHitlActions && isLastMessage && onHitlResume ? onHitlResume : undefined}
      onHitlEditClick={!hideHitlActions && isLastMessage && onHitlEditClick ? onHitlEditClick : undefined}
      hideContinueButton={hideContinueButton}
      // Swarm mode props
      isSwarmChild={message.isSwarmChild}
      swarmAgentName={message.swarmAgentName}
      parentMessageId={message.parentMessageId}
      // Speaking mode TTS
      isSpeakingMode={isSpeakingMode}
      isLastMessage={isLastMessage}
      onAutoSpeak={onAutoSpeak}
      speakingMessageId={speakingMessageId}
      speakingSegments={speakingSegments}
      spokenRange={spokenRange}
    />
  );
});

ChatMessageWrapper.displayName = 'ChatMessageWrapper';

export default ChatMessageWrapper;
