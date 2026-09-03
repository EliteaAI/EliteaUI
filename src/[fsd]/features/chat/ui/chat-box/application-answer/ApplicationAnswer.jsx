import { forwardRef, memo, useCallback, useMemo } from 'react';

import { Box, List, ListItem, ListItemText } from '@mui/material';

import { useApplicationAnswerState } from '@/[fsd]/features/chat/lib/hooks/useApplicationAnswerState.hooks';
import { ChatContinue, GeneratedEntityChip } from '@/[fsd]/features/chat/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import Markdown from '@/[fsd]/shared/ui/markdown';
import { ChatParticipantType, TOOL_ACTION_TYPES } from '@/common/constants.js';
import ApplicationThinkView from '@/components/Chat/ApplicationThinkView';
import EditingPlaceholder from '@/components/Chat/EditingPlaceholder';
import { Answer, UserMessageContainer } from '@/components/Chat/StyledComponents';
import RotatingMessages from '@/components/RotatingMessages';

import AnswerApprovals from './AnswerApprovals';
import AnswerAttachments from './AnswerAttachments';
import AnswerMessageItems from './AnswerMessageItems';
import ApplicationAnswerActions from './ApplicationAnswerActions';
import ApplicationAnswerHeader from './ApplicationAnswerHeader';
import SwarmChildList from './SwarmChildList';

export const ALLOW_EDIT_WHOLE_MESSAGE = false;

const ApplicationAnswer = memo(
  forwardRef((props, ref) => {
    const {
      answer,
      message_items,
      created_at,
      participant,
      onCopy,
      onCopyToMessages,
      onDelete,
      onEdit,
      selectedCodeBlockInfo,
      onRegenerate,
      shouldDisableRegenerate,
      references = [],
      exception,
      budgetErrorCode,
      continuationError,
      subAgentErrors = null,
      isLoading = false,
      isStreaming,
      verticalMode,
      onClickReplyTo,
      interaction_uuid,
      conversation_uuid,
      isRegenerating,
      messageId,
      minHeight,
      toolActions = [],
      tools,
      subAgentTypeByName,
      onRemoveAttachment,
      onContinueMcpExecution,
      onContinueTokenLimitExecution,
      requiresConfirmation = null,
      hitlInterrupt = null,
      hitlInterrupts = null,
      resumingAgentPaths = [],
      onHitlResume,
      hideContinueButton = false,
      onOpenArtifactPreview,
      isSwarmChild = false,
      swarmAgentName = '',
      isSpeakingMode = false,
      isLastMessage = false,
      onAutoSpeak,
      speakingMessageId,
      speakingSegments,
      spokenRange,
      created_entities = [],
      onEntityCreated,
      onDeleteEntity,
    } = props;

    const {
      headerRef,
      realAnswer,
      hasSpeakableText,
      activeSpokenRange,
      messageItemOffsets,
      authorizationBuckets,
      filteredToolActions,
      swarmChildActions,
      nonSwarmChildActions,
      isEditing,
      isProcessing,
      visibleHitlInterrupts,
      pendingAgentPaths,
      hitlBuckets,
      hasCanvasBeingEdited,
      imageAttachments,
      normalAttachments,
      nonAttachmentItems,
      hasAttachments,
      canRenderContent,
      shouldRenderAnswerBlock,
      onContinueWithoutAuth,
      onAuthSuccess,
      resolveAuthorizationAgentType,
      onContinueWithConfirmation,
      onClickEdit,
      onClickCopy,
    } = useApplicationAnswerState({
      answer,
      message_items,
      toolActions,
      exception,
      messageId,
      speakingMessageId,
      spokenRange,
      speakingSegments,
      isStreaming,
      isRegenerating,
      isLoading,
      isSpeakingMode,
      isLastMessage,
      onAutoSpeak,
      onCopy,
      onEdit,
      onContinueMcpExecution,
      onContinueTokenLimitExecution,
      requiresConfirmation,
      hitlInterrupt,
      hitlInterrupts,
      selectedCodeBlockInfo,
      subAgentTypeByName,
    });

    const isApplicationParticipant = participant?.entity_name === ChatParticipantType.Applications;
    const hasToolActionsOrException = nonSwarmChildActions.length || swarmChildActions.length || exception;

    const styles = useMemo(
      () => applicationAnswerStyles(verticalMode, minHeight, hasToolActionsOrException, isSwarmChild),
      [verticalMode, minHeight, hasToolActionsOrException, isSwarmChild],
    );

    const renderAuthorizationCard = useCallback(
      authRequiredAction => (
        <ChatContinue
          key={authRequiredAction.authorizationRequestId || authRequiredAction.id}
          disabled={!onContinueMcpExecution}
          onContinue={() => onContinueWithoutAuth(authRequiredAction)}
          onAuthSuccess={() => onAuthSuccess(authRequiredAction)}
          authRequiredAction={authRequiredAction}
          continueLabel="Skip"
        />
      ),
      [onAuthSuccess, onContinueMcpExecution, onContinueWithoutAuth],
    );

    return (
      <>
        <UserMessageContainer
          data-testid="chat-message-item"
          sx={[styles.userMessageContainer, styles.swarmChildContainer]}
          ref={ref}
        >
          <ApplicationAnswerHeader
            ref={headerRef}
            participant={participant}
            created_at={created_at}
            isSwarmChild={isSwarmChild}
            swarmAgentName={swarmAgentName}
            verticalMode={verticalMode}
            messageId={messageId}
            onClickReplyTo={onClickReplyTo}
            styles={styles}
          />

          <Box sx={styles.contentWrapper}>
            {nonSwarmChildActions?.length > 0 && (
              <ApplicationThinkView
                actions={[...nonSwarmChildActions]}
                originalActions={toolActions.filter(a => a.type !== TOOL_ACTION_TYPES.SwarmChild)}
                isStreaming={isProcessing}
                tools={tools}
                subAgentTypeByName={subAgentTypeByName}
                pendingAgentPaths={pendingAgentPaths}
                resumingAgentPaths={resumingAgentPaths}
                subAgentErrors={subAgentErrors}
                messageId={messageId}
                onCopy={onCopy}
              />
            )}

            {!isProcessing && <SwarmChildList actions={swarmChildActions} />}

            {!isEditing && shouldRenderAnswerBlock && (
              <Answer
                data-testid={isLastMessage ? 'skill-test-last-response' : 'chat-answer-content'}
                sx={styles.answerBlock(messageId === speakingMessageId)}
              >
                {canRenderContent && (
                  <AnswerMessageItems
                    answer={answer}
                    message_items={message_items}
                    nonAttachmentItems={nonAttachmentItems}
                    interaction_uuid={interaction_uuid}
                    conversation_uuid={conversation_uuid}
                    onEdit={onEdit}
                    selectedCodeBlockInfo={selectedCodeBlockInfo}
                    isStreaming={isStreaming}
                    isRegenerating={isRegenerating}
                    activeSpokenRange={activeSpokenRange}
                    messageItemOffsets={messageItemOffsets}
                    toolActions={toolActions}
                    realAnswer={realAnswer}
                  />
                )}

                {canRenderContent && hasAttachments && (
                  <AnswerAttachments
                    imageAttachments={imageAttachments}
                    normalAttachments={normalAttachments}
                    hasNonAttachmentItems={nonAttachmentItems.length > 0}
                    onRemoveAttachment={onRemoveAttachment}
                    onOpenArtifactPreview={onOpenArtifactPreview}
                  />
                )}

                <AnswerApprovals
                  continuationError={continuationError}
                  exception={exception}
                  messageId={messageId}
                  onCopy={onCopy}
                  budgetErrorCode={budgetErrorCode}
                  realAnswer={realAnswer}
                  authorizationBuckets={authorizationBuckets}
                  tools={tools}
                  resolveAuthorizationAgentType={resolveAuthorizationAgentType}
                  renderAuthorizationCard={renderAuthorizationCard}
                  hideContinueButton={hideContinueButton}
                  requiresConfirmation={requiresConfirmation}
                  onContinueTokenLimitExecution={onContinueTokenLimitExecution}
                  onContinueWithConfirmation={onContinueWithConfirmation}
                  hitlBuckets={hitlBuckets}
                  visibleHitlInterrupts={visibleHitlInterrupts}
                  onHitlResume={onHitlResume}
                />

                {isApplicationParticipant && <Box ref={ref} />}

                {references?.length > 0 && !(isLoading || isRegenerating) && (
                  <BasicAccordion
                    style={{ marginTop: answer ? '0.9375rem' : '2.3125rem' }}
                    items={[
                      {
                        title: 'References',
                        content: (
                          <List dense>
                            {references.map(i => (
                              <ListItem key={i}>
                                <ListItemText primary={<Markdown>{i}</Markdown>} />
                              </ListItem>
                            ))}
                          </List>
                        ),
                      },
                    ]}
                  />
                )}

                {!isStreaming && !isLoading && created_entities?.length > 0 && (
                  <Box sx={createdEntitiesContainerSx}>
                    {created_entities.map((entity, idx) => (
                      <GeneratedEntityChip
                        key={entity.entity_id ?? idx}
                        entityType={entity.entity_type}
                        entityId={entity.entity_id}
                        isMcp={!!entity.is_mcp}
                        label={entity.entity_name}
                        entity={entity}
                        messageId={messageId}
                        onEntityCreated={onEntityCreated}
                        onDeleteEntity={onDeleteEntity}
                      />
                    ))}
                  </Box>
                )}

                <ApplicationAnswerActions
                  answer={answer}
                  message_items={message_items}
                  exception={exception}
                  messageId={messageId}
                  isApplicationParticipant={isApplicationParticipant}
                  isProcessing={isProcessing}
                  realAnswer={realAnswer}
                  hasSpeakableText={hasSpeakableText}
                  speakingMessageId={speakingMessageId}
                  hasCanvasBeingEdited={hasCanvasBeingEdited}
                  shouldDisableRegenerate={shouldDisableRegenerate}
                  visibleHitlInterrupts={visibleHitlInterrupts}
                  onCopy={onCopy}
                  onClickCopy={onClickCopy}
                  onCopyToMessages={onCopyToMessages}
                  onRegenerate={onRegenerate}
                  onEdit={onEdit}
                  onClickEdit={onClickEdit}
                  onDelete={onDelete}
                  onAutoSpeak={onAutoSpeak}
                />
              </Answer>
            )}

            {(isLoading || isRegenerating) &&
              !answer &&
              !message_items?.length &&
              !exception &&
              !filteredToolActions?.length &&
              visibleHitlInterrupts.length === 0 && (
                <RotatingMessages
                  sx={styles.rotatingMessages}
                  duration={2000}
                />
              )}

            {isEditing && <EditingPlaceholder />}
          </Box>
        </UserMessageContainer>
      </>
    );
  }),
);

ApplicationAnswer.displayName = 'ApplicationAnswer';

const createdEntitiesContainerSx = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginTop: '0.75rem',
};

/** @type {MuiSx} */
const applicationAnswerStyles = (verticalMode, minHeight, hasToolActionsOrException, isSwarmChild) => ({
  userMessageContainer: verticalMode
    ? {
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.75rem 0 0.75rem 0',
        background: 'transparent',
        '&:hover .actionButtons': { visibility: 'visible' },
        minHeight,
      }
    : {
        minHeight,
        '&:hover .actionButtons': { visibility: 'visible' },
      },
  swarmChildContainer: isSwarmChild
    ? ({ palette }) => ({
        marginLeft: '3rem',
        width: 'calc(100% - 3rem)',
        maxWidth: 'calc(100% - 3rem)',
        borderLeft: '0.1875rem solid',
        borderColor: palette.primary.main,
        paddingLeft: 2,
        backgroundColor: 'action.hover',
        borderRadius: '0 0.5rem 0.5rem 0',
      })
    : null,
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
    padding: '0 0.25rem 0 0.25rem',
    flexWrap: 'nowrap',
    overflow: 'hidden',
    gap: '0.5rem',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.625rem',
    height: '100%',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  imageStyle: { minWidth: '1.5rem', width: '1.5rem', height: '1.5rem' },
  entityIcon: ({ palette }) => ({
    width: '1.5rem',
    height: '1.5rem',
    minWidth: '1.5rem',
    background: palette.background.aiParticipantIcon,
  }),
  participantName: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '60%',
  },
  replyToText: {
    textDecoration: 'underline',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  timeWrapper: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  listItemAvatar: {
    minWidth: '1.5rem',
    height: '1.5rem',
  },
  eliteaIcon: {
    fontSize: '1.5rem',
  },
  contentWrapper: verticalMode ? { width: '100%' } : { width: 'calc(100% - 2rem)' },
  answerBlock:
    isSpeaking =>
    ({ palette }) => ({
      background: palette.background.aiAnswerBkg,
      width: '100%',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem 0.75rem 1rem',
      position: 'relative',
      boxSizing: 'border-box',
      minHeight: '3rem',
      marginTop: hasToolActionsOrException ? '0.5rem' : '0',
      flex: 1,
      border: 'none',
      borderColor: 'transparent',
      boxShadow: palette.boxShadow.aiAnswer,
      color: isSpeaking ? `${palette.text.primary} !important` : palette.text.secondary,
    }),
  rotatingMessages: {
    fontWeight: '400',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    marginTop: hasToolActionsOrException ? '0.5rem' : '0',
    padding: '0.75rem 1rem',
  },
});

export default ApplicationAnswer;
