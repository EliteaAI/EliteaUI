import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { buildAttachmentSummary } from '@/[fsd]/entities/attachment/lib';
import { toSpeakableText, translateSpokenPos } from '@/[fsd]/features/chat/lib/helpers';
import { useParticipantEntityIcon, useParticipantName } from '@/[fsd]/features/chat/participants/lib/hooks';
import { ChatAttachment, ChatContinue, ChatHitlActions, ErrorTrace } from '@/[fsd]/features/chat/ui';
import { SubAgentAccordion } from '@/[fsd]/features/chat/ui/sub-agent-section';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import Markdown from '@/[fsd]/shared/ui/markdown';
import MicphoneIcon from '@/assets/megaphone.svg?react';
import {
  CANVAS_ADMIN_USER,
  CANVAS_SYSTEM_USER,
  ChatParticipantType,
  TOOL_ACTION_NAMES,
  TOOL_ACTION_TYPES,
  ToolActionStatus,
  VOICE_FEATURES_ENABLED,
  VOICE_FEATURES_TEMPORARILY_DISABLED,
  WELCOME_MESSAGE_ID,
} from '@/common/constants.js';
import { getToolIcon } from '@/common/toolkitUtils';
import { convertJsonToString, isImageFile, isNullOrUndefined } from '@/common/utils';
import Canvas from '@/components/Canvas';
import ApplicationThinkView from '@/components/Chat/ApplicationThinkView';
import CreatedTimeInfo from '@/components/Chat/CreatedTimeInfo';
import EditingPlaceholder from '@/components/Chat/EditingPlaceholder';
import NormalAttachment from '@/components/Chat/NormalAttachment';
import { Answer, ButtonsContainer, UserMessageContainer } from '@/components/Chat/StyledComponents';
import EntityIcon from '@/components/EntityIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import CopyMoveIcon from '@/components/Icons/CopyMoveIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import EliteAIcon from '@/components/Icons/EliteAIcon';
import RegenerateIcon from '@/components/Icons/RegenerateIcon';
import RotatingMessages from '@/components/RotatingMessages';
import useCopyDownloadHandlers from '@/hooks/chat/useCopyEventHandlers';
import useGetComponentWidth from '@/hooks/useGetComponentWidth';

const COMPACT_VIEW_BREAKPOINT = 340;

export const ALLOW_EDIT_WHOLE_MESSAGE = false;

const ApplicationAnswer = React.forwardRef((props, ref) => {
  const theme = useTheme();

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
    onHitlResume,
    onHitlEditClick,
    hideContinueButton = false,
    onOpenArtifactPreview,
    // Swarm mode props
    isSwarmChild = false,
    swarmAgentName = '',
    // Speaking mode TTS
    isSpeakingMode = false,
    isLastMessage = false,
    onAutoSpeak,
    speakingMessageId,
    speakingSegments,
    spokenRange,
  } = props;

  // Ref for scrolling to message header after clicking continue
  const headerRef = useRef(null);

  const participantName = useParticipantName(participant);
  const entityIcon = useParticipantEntityIcon(participant);

  // Find the single toolAction that requires auth (should only be one)
  const authRequiredAction = useMemo(
    () => toolActions.find(action => action.status === ToolActionStatus.actionRequired),
    [toolActions],
  );

  /** Continue without auth - adds server to ignore list */
  const onContinueWithoutAuth = useCallback(() => {
    onContinueMcpExecution?.(messageId, true);
  }, [onContinueMcpExecution, messageId]);

  /** Continue after successful auth - does NOT add to ignore list */
  const onAuthSuccess = useCallback(() => {
    onContinueMcpExecution?.(messageId, false);
  }, [onContinueMcpExecution, messageId]);

  const onContinueWithConfirmation = useCallback(() => {
    if (onContinueTokenLimitExecution && requiresConfirmation) {
      onContinueTokenLimitExecution(messageId);
      setTimeout(() => {
        headerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [onContinueTokenLimitExecution, messageId, requiresConfirmation]);

  const { onClickCopy } = useCopyDownloadHandlers({
    onCopy,
  });

  const itemToSpeakableText = item => {
    if (item.item_type === 'canvas_message') {
      return item.item_details.latest_version?.canvas_content || '';
    }
    if (item.item_type === 'attachment_message') {
      return '';
    }
    return item.item_details.content;
  };

  const rawAnswer = useMemo(() => {
    if (answer) return answer;
    if (!message_items) return undefined;
    const attachmentItems = message_items.filter(item => item.item_type === 'attachment_message');
    const parts = message_items
      .filter(item => item.item_type !== 'attachment_message')
      .map(itemToSpeakableText);
    const summary = buildAttachmentSummary(attachmentItems);
    if (summary) parts.push(summary);
    return parts.join('\n');
  }, [answer, message_items]);

  const realAnswer = useMemo(() => convertJsonToString(rawAnswer || '', true), [rawAnswer]);
  const hasSpeakableText = useMemo(() => !!toSpeakableText(realAnswer).text, [realAnswer]);

  // Translate the current TTS word range (in stripped-text coordinates) back to
  // original markdown coordinates for word-level highlight.
  // Fine-grained inline segments in speakingSegments ensure 1:1 char mapping
  // within each segment so translateSpokenPos gives word-accurate positions.
  const activeSpokenRange = useMemo(() => {
    if (messageId !== speakingMessageId || !spokenRange) return null;
    if (!speakingSegments?.length) return spokenRange;
    const start = translateSpokenPos(spokenRange.start, speakingSegments);
    const end = translateSpokenPos(spokenRange.end, speakingSegments);
    if (end <= start) return null;
    return { start, end };
  }, [messageId, speakingMessageId, spokenRange, speakingSegments]);

  // Cumulative start offsets of each message_item in the joined realAnswer string
  const messageItemOffsets = useMemo(() => {
    if (!message_items?.length) return {};
    const offsets = {};
    let pos = 0;
    message_items.forEach((item, idx) => {
      const str = String(itemToSpeakableText(item) ?? '');
      if (item.item_type === 'text_message') {
        offsets[item.uuid] = pos;
      }
      pos += str.length;
      if (idx < message_items.length - 1) pos += 1; // newline separator from .join('\n')
    });
    return offsets;
  }, [message_items]);

  // Auto-speak AI response in speaking mode when streaming/loading ends (last message only)
  useEffect(() => {
    if (isSpeakingMode && isLastMessage && !isStreaming && !isLoading && hasSpeakableText) {
      onAutoSpeak?.(realAnswer, messageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, isLoading]);

  // Check if this is an Application participant
  const isApplicationParticipant = participant?.entity_name === ChatParticipantType.Applications;

  // Filter out the final output from thinking steps to prevent duplication
  const filteredToolActions = useMemo(() => {
    if (!toolActions?.length || !realAnswer?.trim()) return toolActions;

    // Find the last action that might be the final output
    // This would typically be the last LLM thinking step that contains the final answer
    const lastActionIndex = toolActions.length - 1;
    const transformedToolActions = toolActions.map((action, index) => {
      if (index !== lastActionIndex) {
        return action;
      } else {
        // If the last action is an LLM thinking step and its content matches the main answer,
        // filter it out to prevent duplication
        if (
          action?.type === TOOL_ACTION_TYPES.Llm &&
          action?.name === TOOL_ACTION_NAMES.Llm &&
          !isStreaming &&
          !isRegenerating
        ) {
          const lastActionContent = action?.content?.trim() || '';
          const lastActionOutput = action?.toolOutputs?.trim() || '';
          const trimmedRealAnswer = realAnswer.trim();

          // Check for exact match or if the thinking step content is substantially similar to the final answer
          if (
            lastActionContent === trimmedRealAnswer ||
            lastActionOutput === trimmedRealAnswer ||
            // Check if the thinking step contains the entire final answer (with some tolerance for whitespace)
            (trimmedRealAnswer.length > 50 && lastActionContent.includes(trimmedRealAnswer)) ||
            (trimmedRealAnswer.length > 50 && lastActionOutput.includes(trimmedRealAnswer))
          ) {
            return {
              ...action,
              content: '',
              toolOutputs: '',
              originalContent: action.content,
            };
          }
        }
        return action;
      }
    });

    return transformedToolActions;
  }, [toolActions, realAnswer, isStreaming, isRegenerating]);

  const isProcessing = isLoading || isRegenerating || isStreaming;

  // Separate SwarmChild actions from other tool actions for rendering below accordion
  // Only do this when not streaming (completed messages from history)
  const { swarmChildActions, nonSwarmChildActions } = useMemo(() => {
    if (isProcessing) {
      // During streaming, let ApplicationThinkView handle all actions
      return { swarmChildActions: [], nonSwarmChildActions: filteredToolActions };
    }
    const swarmChildren = filteredToolActions.filter(action => action.type === TOOL_ACTION_TYPES.SwarmChild);
    const others = filteredToolActions.filter(action => action.type !== TOOL_ACTION_TYPES.SwarmChild);
    return { swarmChildActions: swarmChildren, nonSwarmChildActions: others };
  }, [filteredToolActions, isProcessing]);

  const isEditing = useMemo(
    () =>
      selectedCodeBlockInfo?.selectedMessage?.id === messageId &&
      messageId &&
      !selectedCodeBlockInfo?.isBlock,
    [messageId, selectedCodeBlockInfo?.isBlock, selectedCodeBlockInfo?.selectedMessage?.id],
  );

  const onClickEdit = useCallback(() => {
    onEdit?.({
      rawData: rawAnswer,
      codeBlock: realAnswer,
      language: 'markdown',
      isBlock: false,
      startPos: 0,
      endPos: realAnswer.length,
      canvasId: null,
      blockId: messageId,
    });
  }, [messageId, onEdit, rawAnswer, realAnswer]);

  const { componentRef: actionButtonsWrapperRef, componentWidth: actionButtonsWrapperWidth } =
    useGetComponentWidth();

  const hasCanvasBeingEdited = useMemo(
    () =>
      !!message_items?.find(
        item =>
          item.item_type === 'canvas_message' &&
          item.item_details.editors.filter(
            editor => editor.user_name !== CANVAS_ADMIN_USER && editor.user_name !== CANVAS_SYSTEM_USER,
          ).length,
      ),
    [message_items],
  );

  const { imageAttachments, normalAttachments, nonAttachmentItems } = useMemo(() => {
    const defaultState = { imageAttachments: [], normalAttachments: [], nonAttachmentItems: [] };

    return (
      message_items?.reduce((acc, item) => {
        if (item.item_type !== 'attachment_message') {
          acc.nonAttachmentItems.push(item);
        } else if (isImageFile(item)) {
          acc.imageAttachments.push(item);
        } else {
          acc.normalAttachments.push(item);
        }
        return acc;
      }, defaultState) || defaultState
    );
  }, [message_items]);

  const hasAttachments = useMemo(
    () => imageAttachments.length > 0 || normalAttachments.length > 0,
    [imageAttachments.length, normalAttachments.length],
  );

  const canRenderContent = !exception && !(isLoading || isRegenerating);

  // Normalize to a list: a parallel sub-agent fan-out surfaces one paused
  // child per entry; a single pause is wrapped into a one-element list.
  const effectiveHitlInterrupts = useMemo(() => {
    if (Array.isArray(hitlInterrupts) && hitlInterrupts.length) {
      return hitlInterrupts;
    }
    return hitlInterrupt ? [hitlInterrupt] : [];
  }, [hitlInterrupts, hitlInterrupt]);

  // Group paused approvals by the sub-agent they originated from so a parallel
  // fan-out renders one stacked-card section per sub-agent under a name header
  // (issue #4993). Interrupts with no parent_agent_name (single/coordinator
  // pause) stay ungrouped and the legacy flat list is used. Track 2 fan-out
  // children carry parent_agent_name + their own tool_call_id, so they bucket
  // here exactly like Track 1 aggregates — one bordered accordion per child.
  const hitlBuckets = useMemo(() => {
    const coordinator = [];
    const order = [];
    const byName = new Map();
    effectiveHitlInterrupts.forEach((interrupt, index) => {
      const key = interrupt?.parent_agent_name || '';
      const entry = { interrupt, index };
      if (!key) {
        coordinator.push(entry);
        return;
      }
      if (!byName.has(key)) {
        byName.set(key, []);
        order.push(key);
      }
      byName.get(key).push(entry);
    });
    // Resolve each paused sub-agent's kind (pipeline vs agent) the same way the
    // thinking view does: the conversation participant's authoritative
    // agent_type keyed by display name. Without it the HITL accordion header
    // falls back to the participant `tools` entry, which for a pipeline often
    // lacks agent_type and mis-renders the flow icon as the generic agent grid
    // (issue #4993). Fall back to any agent_type carried on the interrupt.
    const resolveType = (name, entries) => {
      const participantType = subAgentTypeByName?.[name];
      if (participantType === 'pipeline') return 'pipeline';
      if (participantType) return 'application';
      const fromInterrupt = entries.find(e => e?.interrupt?.agent_type || e?.interrupt?.toolMeta?.agent_type);
      const at = fromInterrupt?.interrupt?.agent_type || fromInterrupt?.interrupt?.toolMeta?.agent_type;
      if (at === 'pipeline') return 'pipeline';
      if (at) return 'application';
      return '';
    };
    return {
      coordinator,
      subAgents: order.map(name => ({
        name,
        entries: byName.get(name),
        agentType: resolveType(name, byName.get(name)),
      })),
      hasSubAgents: order.length > 0,
    };
  }, [effectiveHitlInterrupts, subAgentTypeByName]);

  const renderHitlCard = useCallback(
    ({ interrupt, index }) => {
      const toolCallId = interrupt?.tool_call_id || '';
      return (
        <ChatHitlActions
          key={toolCallId || `hitl-${index}`}
          hitlInterrupt={interrupt}
          toolCallId={toolCallId}
          onHitlResume={onHitlResume}
          onHitlEditClick={onHitlEditClick}
          disabled={!onHitlResume || Boolean(interrupt?.decided)}
        />
      );
    },
    [onHitlResume, onHitlEditClick],
  );

  const shouldRenderAnswerBlock = useMemo(() => {
    const hasRenderableMessageItems =
      message_items?.length && canRenderContent && (!!nonAttachmentItems?.length || hasAttachments);

    return (
      !!answer ||
      hasRenderableMessageItems ||
      !!exception ||
      (authRequiredAction && !!onContinueMcpExecution) ||
      (requiresConfirmation && !!onContinueTokenLimitExecution) ||
      effectiveHitlInterrupts.length > 0
    );
  }, [
    answer,
    message_items?.length,
    nonAttachmentItems?.length,
    hasAttachments,
    canRenderContent,
    exception,
    authRequiredAction,
    onContinueMcpExecution,
    requiresConfirmation,
    onContinueTokenLimitExecution,
    effectiveHitlInterrupts.length,
  ]);

  const isWideView = actionButtonsWrapperWidth > COMPACT_VIEW_BREAKPOINT;
  const hasToolActionsOrException = nonSwarmChildActions.length || swarmChildActions.length || exception;
  const styles = applicationAnswerStyles(
    verticalMode,
    minHeight,
    hasToolActionsOrException,
    nonAttachmentItems.length > 0,
    imageAttachments.length,
    isWideView,
  );

  // Swarm child message styles
  const swarmChildStyles = isSwarmChild
    ? {
        marginLeft: '48px',
        // Account for margin in width calculation to prevent overflow
        width: 'calc(100% - 48px)',
        maxWidth: 'calc(100% - 48px)',
        borderLeft: '3px solid',
        borderColor: 'primary.main',
        paddingLeft: 2,
        backgroundColor: 'action.hover',
        borderRadius: '0 8px 8px 0',
      }
    : {};

  return (
    <>
      <UserMessageContainer
        sx={{ ...styles.userMessageContainer, ...swarmChildStyles }}
        ref={ref}
      >
        {/* Swarm child agent header - simplified view with just agent name and time */}
        {isSwarmChild && swarmAgentName ? (
          <Box
            sx={{ ...styles.headerRow, pr: 2 }}
            ref={headerRef}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={swarmAgentName}
                size="small"
                color="primary"
                variant="outlined"
                icon={<SmartToyIcon fontSize="small" />}
              />
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Sub-agent response
              </Typography>
            </Box>
            <Box sx={styles.timeWrapper}>
              <CreatedTimeInfo created_at={created_at} />
            </Box>
          </Box>
        ) : verticalMode ? (
          <Box
            sx={styles.headerRow}
            ref={headerRef}
          >
            <Box sx={styles.headerLeft}>
              <EntityIcon
                forMessage
                icon={entityIcon}
                entityType={
                  participant.entity_settings?.agent_type !== ChatParticipantType.Pipelines
                    ? participant.entity_name
                    : ChatParticipantType.Pipelines
                }
                agentType={participant.entity_settings?.agent_type}
                editable={false}
                sx={styles.entityIcon}
                imageStyle={styles.imageStyle}
                showBackgroundColor={participant.entity_name !== ChatParticipantType.Dummy}
                specifiedFontSize={15}
              />
              <Typography
                variant="bodySmall"
                color="text.secondary"
                sx={styles.participantName}
              >
                {participantName}
              </Typography>
              {messageId !== WELCOME_MESSAGE_ID && (
                <>
                  <Typography variant="bodySmall">to</Typography>
                  <Typography
                    variant="bodySmall"
                    sx={styles.replyToText}
                    onClick={onClickReplyTo}
                  >
                    Message
                  </Typography>
                </>
              )}
            </Box>
            <Box sx={styles.timeWrapper}>
              <CreatedTimeInfo created_at={created_at} />
            </Box>
          </Box>
        ) : (
          <ListItemAvatar sx={styles.listItemAvatar}>
            <EliteAIcon sx={styles.eliteaIcon} />
          </ListItemAvatar>
        )}
        <Box sx={styles.contentWrapper}>
          {/* Live thinking view shows tool-call chips only. HITL approval cards
              (including Track 2 fan-out children) render in the message box below
              via hitlBuckets, so they survive the per-turn StartTask (#4993). */}
          {nonSwarmChildActions?.length > 0 && (
            <ApplicationThinkView
              actions={[...nonSwarmChildActions]}
              originalActions={toolActions.filter(a => a.type !== TOOL_ACTION_TYPES.SwarmChild)}
              isStreaming={isProcessing}
              tools={tools}
              subAgentTypeByName={subAgentTypeByName}
              subAgentErrors={subAgentErrors}
              messageId={messageId}
              onCopy={onCopy}
            />
          )}

          {/* SwarmChild responses - displayed as collapsible accordions below main accordion when not streaming */}
          {!isProcessing && swarmChildActions.length > 0 && (
            <Box sx={styles.swarmChildrenContainer}>
              {swarmChildActions.map((action, idx) => {
                const SwarmIcon = getToolIcon('agent');
                const agentName = action.toolMeta?.agent_name || action.name || 'Sub-agent';
                return (
                  <BasicAccordion
                    key={`swarm-child-accordion-${action.id || idx}`}
                    defaultExpanded={false}
                    uppercase={false}
                    accordionSX={styles.swarmChildAccordion}
                    summarySX={styles.swarmChildSummary}
                    accordionDetailsSX={styles.swarmChildDetails}
                    items={[
                      {
                        title: (
                          <Box sx={styles.swarmChildTitleBox}>
                            <SwarmIcon sx={styles.swarmChildIcon} />
                            <span>{agentName}</span>
                          </Box>
                        ),
                        content: <Markdown>{action.content || action.toolOutputs || ''}</Markdown>,
                      },
                    ]}
                  />
                );
              })}
            </Box>
          )}

          {/* {exception && <AgentException exception={exception} title={!isApplicationParticipant ? 'LLM exception' : undefined} />} */}
          {!isEditing && shouldRenderAnswerBlock && (
            <Answer sx={styles.answerBlock(messageId === speakingMessageId)}>
              {canRenderContent && !isNullOrUndefined(answer) && !message_items?.length && (
                <Markdown
                  interaction_uuid={interaction_uuid}
                  conversation_uuid={conversation_uuid}
                  onEdit={onEdit}
                  selectedCodeBlockInfo={selectedCodeBlockInfo}
                  isStreaming={isStreaming || isRegenerating}
                  spokenRange={activeSpokenRange}
                >
                  {realAnswer ?? ''}
                </Markdown>
              )}

              {canRenderContent &&
                !!nonAttachmentItems?.length &&
                nonAttachmentItems.map(item => {
                  switch (item.item_type) {
                    case 'canvas_message':
                      return (
                        <Canvas
                          key={item.uuid}
                          interaction_uuid={interaction_uuid}
                          conversation_uuid={conversation_uuid}
                          onEdit={onEdit}
                          selectedCodeBlockInfo={selectedCodeBlockInfo}
                          canvasId={item.uuid}
                          isStreaming={isStreaming || isRegenerating}
                          language={item.item_details.latest_version?.code_language || 'markdown'}
                          type={item.item_details.canvas_type}
                          editors={item.item_details.editors}
                          content={
                            convertJsonToString(item.item_details.latest_version?.canvas_content ?? '') || ''
                          }
                        />
                      );
                    case 'text_message': {
                      const itemOffset = messageItemOffsets[item.uuid] ?? 0;
                      const itemEndPos = activeSpokenRange
                        ? Math.max(0, activeSpokenRange.end - itemOffset)
                        : 0;
                      const itemSpokenRange =
                        activeSpokenRange && itemEndPos > 0 ? { start: 0, end: itemEndPos } : null;
                      return (
                        <Markdown
                          key={item.uuid}
                          interaction_uuid={interaction_uuid}
                          conversation_uuid={conversation_uuid}
                          onEdit={onEdit}
                          selectedCodeBlockInfo={selectedCodeBlockInfo}
                          messageItemId={item.id}
                          isStreaming={isStreaming || isRegenerating}
                          spokenRange={itemSpokenRange}
                        >
                          {convertJsonToString(item.item_details.content) || ''}
                        </Markdown>
                      );
                    }

                    default:
                      return null;
                  }
                })}

              {canRenderContent && hasAttachments && (
                <Box sx={styles.attachmentsContainer}>
                  {imageAttachments.length > 0 && (
                    <Box sx={styles.attachmentGrid}>
                      {imageAttachments.map(item => (
                        <ChatAttachment.ImageAttachment
                          key={item.uuid}
                          attachment={item}
                          onRemoveAttachment={onRemoveAttachment}
                        />
                      ))}
                    </Box>
                  )}

                  {normalAttachments.length > 0 && (
                    <Box sx={styles.normalAttachmentsRow}>
                      {normalAttachments.map(item => (
                        <NormalAttachment
                          preview={!!onOpenArtifactPreview}
                          key={item.uuid}
                          attachment={item}
                          onRemoveAttachment={onRemoveAttachment}
                          onOpenArtifactPreview={onOpenArtifactPreview}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              {!!exception && (
                <ErrorTrace
                  headline={realAnswer}
                  trace={exception}
                  messageId={messageId}
                  onCopy={onCopy}
                />
              )}
              {!!authRequiredAction && (
                <ChatContinue
                  message="Token expired for some remote MCP servers. Re-authenticate now or continue without them?"
                  disabled={!onContinueMcpExecution}
                  onContinue={onContinueWithoutAuth}
                  onAuthSuccess={onAuthSuccess}
                  tools={tools}
                  authRequiredAction={authRequiredAction}
                />
              )}
              {/* Agent Requires Confirmation - user needs to confirm to proceed */}
              {!hideContinueButton && !!requiresConfirmation && (
                <ChatContinue
                  message={requiresConfirmation.message}
                  disabled={!onContinueTokenLimitExecution}
                  onContinue={onContinueWithConfirmation}
                />
              )}
              {hitlBuckets.hasSubAgents ? (
                <Box sx={styles.hitlGroupsContainer}>
                  {hitlBuckets.coordinator.map(renderHitlCard)}
                  {hitlBuckets.subAgents.map(bucket => (
                    <SubAgentAccordion
                      key={`hitl-sa-${bucket.name}`}
                      name={bucket.name}
                      tools={tools}
                      agentType={bucket.agentType}
                      paused
                      transparent
                    >
                      {bucket.entries.map(renderHitlCard)}
                    </SubAgentAccordion>
                  ))}
                </Box>
              ) : (
                effectiveHitlInterrupts.map((interrupt, index) => renderHitlCard({ interrupt, index }))
              )}
              {/* Add ref for ApplicationAnswer compatibility */}
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
              <Box
                sx={styles.actionButtonsBox}
                ref={actionButtonsWrapperRef}
              >
                <ButtonsContainer
                  className="actionButtons"
                  sx={styles.buttonsContainer}
                >
                  {onAutoSpeak && hasSpeakableText && VOICE_FEATURES_ENABLED && (
                    <StyledTooltip
                      title={
                        VOICE_FEATURES_TEMPORARILY_DISABLED
                          ? 'Voice features temporarily disabled'
                          : 'Read out'
                      }
                      placement="top"
                    >
                      <Box component="span">
                        <BaseBtn
                          disabled={
                            VOICE_FEATURES_TEMPORARILY_DISABLED ||
                            isProcessing ||
                            !realAnswer ||
                            !!speakingMessageId
                          }
                          sx={styles.iconButton}
                          variant="tertiary"
                          onClick={() => onAutoSpeak(realAnswer, messageId)}
                        >
                          <MicphoneIcon sx={styles.icon} />
                        </BaseBtn>
                      </Box>
                    </StyledTooltip>
                  )}
                  {onCopy && (!!answer || !!message_items?.length || !!exception) && (
                    <StyledTooltip
                      title="Copy to clipboard"
                      placement="top"
                    >
                      <IconButton
                        disabled={isProcessing || !realAnswer}
                        sx={styles.iconButton}
                        variant="elitea"
                        color="tertiary"
                        onClick={onClickCopy}
                      >
                        <CopyIcon sx={styles.icon} />
                      </IconButton>
                    </StyledTooltip>
                  )}
                  {onCopyToMessages && !!answer && !isApplicationParticipant && (
                    <StyledTooltip
                      title="Copy to Messages"
                      placement="top"
                    >
                      <IconButton
                        disabled={isProcessing}
                        sx={styles.iconButton}
                        variant="elitea"
                        color="tertiary"
                        onClick={onCopyToMessages}
                      >
                        <CopyMoveIcon sx={styles.icon} />
                      </IconButton>
                    </StyledTooltip>
                  )}
                  {onRegenerate && (
                    <StyledTooltip
                      title="Regenerate"
                      placement="top"
                    >
                      <Box>
                        <IconButton
                          sx={styles.iconButton}
                          variant="elitea"
                          color="tertiary"
                          disabled={
                            shouldDisableRegenerate ||
                            hasCanvasBeingEdited ||
                            (isApplicationParticipant ? false : isProcessing)
                          }
                          onClick={onRegenerate}
                        >
                          <RegenerateIcon
                            sx={styles.icon}
                            fill={
                              shouldDisableRegenerate || hasCanvasBeingEdited
                                ? theme.palette.icon.fill.disabled
                                : theme.palette.icon.fill.default
                            }
                          />
                        </IconButton>
                      </Box>
                    </StyledTooltip>
                  )}
                  {onEdit && (!!answer || !!message_items?.length) && ALLOW_EDIT_WHOLE_MESSAGE && (
                    <StyledTooltip
                      title="Edit response"
                      placement="top"
                    >
                      <IconButton
                        disabled={isProcessing}
                        sx={styles.iconButton}
                        variant="elitea"
                        color="tertiary"
                        onClick={onClickEdit}
                      >
                        <EditIcon sx={styles.icon} />
                      </IconButton>
                    </StyledTooltip>
                  )}
                  {onDelete && (
                    <StyledTooltip
                      title="Delete"
                      placement="top"
                    >
                      <Box>
                        <IconButton
                          disabled={hasCanvasBeingEdited || (isApplicationParticipant ? false : isProcessing)}
                          sx={styles.iconButton}
                          variant="elitea"
                          color="tertiary"
                          onClick={onDelete}
                        >
                          <DeleteIcon
                            sx={styles.icon}
                            fill={
                              hasCanvasBeingEdited
                                ? theme.palette.icon.fill.disabled
                                : theme.palette.icon.fill.default
                            }
                          />
                        </IconButton>
                      </Box>
                    </StyledTooltip>
                  )}
                </ButtonsContainer>
              </Box>
            </Answer>
          )}
          {(isLoading || isRegenerating) &&
            !answer &&
            !message_items?.length &&
            !exception &&
            !filteredToolActions?.length &&
            // While an approval card is pending (e.g. a fan-out sibling awaiting a
            // decision while another child re-runs after resume) the loading
            // placeholder must not cover the cards (#4993).
            effectiveHitlInterrupts.length === 0 && (
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
});

ApplicationAnswer.displayName = 'ApplicationAnswer';

/** @type {MuiSx} */
const applicationAnswerStyles = (
  verticalMode,
  minHeight,
  hasToolActionsOrException,
  hasNonAttachmentItems,
  imageAttachmentsLength,
  isWideView,
) => ({
  userMessageContainer: verticalMode
    ? {
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.75rem 0 0.75rem 0',
        background: 'transparent',
        '&:hover .actionButtons': {
          visibility: 'visible',
        },
        minHeight,
      }
    : {
        minHeight,
        '&:hover .actionButtons': {
          visibility: 'visible',
        },
      },
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
  attachmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, 16.25rem)',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  attachmentsContainer: {
    width: '100%',
    marginTop: hasNonAttachmentItems ? '0.5rem' : '0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  normalAttachmentsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: '0.5rem',
    width: '100%',
    flexWrap: 'wrap',
    marginTop: imageAttachmentsLength > 0 ? '0.5rem' : '0',
  },
  actionButtonsBox: {
    display: 'flex',
    justifyContent: 'end',
    alignItems: 'center',
    marginTop: '0.5rem',
    gap: isWideView ? '0' : '0.5rem',
  },
  buttonsContainer: {
    position: 'relative',
    top: '0',
    right: '0',
    paddingBottom: '0',
    paddingLeft: isWideView ? '2rem' : '0',
  },
  iconButton: {
    marginLeft: '0',
    minWidth: '1rem',
    width: '1rem',
    height: '1.75rem',
    padding: '0',
  },
  icon: {
    fontSize: '1rem',
  },
  rotatingMessages: {
    fontWeight: '400',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    marginTop: hasToolActionsOrException ? '0.5rem' : '0',
    padding: '0.75rem 1rem',
  },
  // SwarmChild accordion styles
  swarmChildrenContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.5rem',
    width: '100%',
  },
  hitlGroupsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
  },
  swarmChildAccordion: ({ palette }) => ({
    backgroundColor: palette.background.secondary,
    borderRadius: '0.5rem !important',
    border: `1px solid ${palette.border.table}`,
    '&:before': {
      display: 'none',
    },
    '&.Mui-expanded': {
      margin: 0,
    },
  }),
  swarmChildSummary: ({ palette }) => ({
    minHeight: '2.5rem !important',
    padding: '0 0.75rem',
    backgroundColor: palette.background.userInputBackground,
    borderRadius: '0.5rem',
    '&.Mui-expanded': {
      minHeight: '2.5rem !important',
      borderRadius: '0.5rem 0.5rem 0 0',
    },
    '& .MuiAccordionSummary-content': {
      margin: '0.5rem 0',
    },
  }),
  swarmChildTitleBox: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '& span': {
      fontWeight: 600,
      color: palette.text.secondary,
      fontSize: '0.875rem',
    },
  }),
  swarmChildIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    color: palette.primary.main,
  }),
  swarmChildDetails: {
    padding: '0.75rem',
    maxHeight: '400px',
    overflow: 'auto',
    '& p': {
      margin: '0 0 0.5rem 0',
    },
    '& p:last-child': {
      marginBottom: 0,
    },
  },
});

export default memo(ApplicationAnswer);
