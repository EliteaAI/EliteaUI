import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import Markdown from '@/[fsd]/shared/ui/markdown';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import RejectIcon from '@/assets/reject.svg?react';

import BlockWithCommentControl from './BlockWithCommentControl';
import ClarifyingQuestionControl from './ClarifyingQuestionControl';
import EditControl from './EditControl';
import SensitiveToolParams from './SensitiveToolParams';

const BLOCK_WITH_COMMENT_ACTION = 'block_with_comment';
const DEFAULT_HITL_MESSAGE = 'Here are some results. Choose the action to proceed.';

const ChatHitlActions = memo(props => {
  const { hitlInterrupt, onHitlResume, disabled, toolCallId, interruptId } = props;
  const { available_actions = [], guardrail_type, message, questions } = hitlInterrupt || {};
  const isSensitiveTool =
    guardrail_type === 'sensitive_tool' || guardrail_type === 'parallel_sensitive_tools';
  const isClarifyingQuestion = guardrail_type === 'clarifying_question';
  const styles = getStyles();

  const handleClarifyingSubmit = useCallback(
    value => {
      onHitlResume?.({ action: 'answer', value, toolCallId, interruptId });
    },
    [interruptId, onHitlResume, toolCallId],
  );

  const handleApprove = useCallback(() => {
    onHitlResume?.({ action: 'approve', toolCallId, interruptId });
  }, [interruptId, onHitlResume, toolCallId]);

  const handleReject = useCallback(() => {
    onHitlResume?.({ action: 'reject', toolCallId, interruptId });
  }, [interruptId, onHitlResume, toolCallId]);

  const handleBlockWithComment = useCallback(
    comment => {
      onHitlResume?.({ action: BLOCK_WITH_COMMENT_ACTION, value: comment, toolCallId, interruptId });
    },
    [interruptId, onHitlResume, toolCallId],
  );

  const canBlockWithComment = available_actions.includes(BLOCK_WITH_COMMENT_ACTION);

  const handleEditSubmit = useCallback(
    value => {
      onHitlResume?.({ action: 'edit', value, toolCallId, interruptId });
    },
    [interruptId, onHitlResume, toolCallId],
  );

  if (!hitlInterrupt) return null;

  if (isClarifyingQuestion) {
    return (
      <Box sx={styles.container}>
        {message?.trim() && (
          <Box sx={styles.message}>
            <Markdown>{message}</Markdown>
          </Box>
        )}
        <ClarifyingQuestionControl
          questions={questions}
          onSubmit={handleClarifyingSubmit}
          disabled={disabled}
        />
      </Box>
    );
  }

  if (isSensitiveTool) {
    return (
      <Box
        data-testid="sensitive-action-panel"
        sx={styles.sensitiveContainer}
      >
        <Typography
          variant="labelMedium"
          sx={styles.sensitiveTitle}
        >
          ⚠️ Sensitive Action Authorization Required
        </Typography>
        <Box sx={styles.sensitiveActionBlock}>
          <Typography
            variant="labelMedium"
            sx={styles.sensitiveActionLabel}
          >
            Agent is about to perform:
          </Typography>
          <Typography
            variant="labelMedium"
            sx={styles.sensitiveActionName}
          >
            {hitlInterrupt.action_label || hitlInterrupt.tool_name || 'Unknown action'}
          </Typography>
        </Box>
        {hitlInterrupt.tool_args && <SensitiveToolParams toolArgs={hitlInterrupt.tool_args} />}
        {hitlInterrupt.policy_message && (
          <Typography
            variant="labelMedium"
            sx={styles.sensitivePolicy}
          >
            {hitlInterrupt.policy_message}
          </Typography>
        )}
        <Box sx={styles.buttonContainer}>
          <BaseBtn
            data-testid="sensitive-action-authorize-button"
            variant="positive"
            startIcon={<CheckedIcon />}
            onClick={handleApprove}
            disabled={disabled}
            sx={styles.buttonIcon}
          >
            Authorize
          </BaseBtn>
          <BaseBtn
            variant="alarm"
            startIcon={<RejectIcon />}
            onClick={handleReject}
            disabled={disabled}
            sx={styles.buttonIcon}
          >
            Block
          </BaseBtn>
          {canBlockWithComment && (
            <BlockWithCommentControl
              onSubmit={handleBlockWithComment}
              disabled={disabled}
            />
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <Box sx={styles.message}>
        <Markdown>{message?.trim() ? message : DEFAULT_HITL_MESSAGE}</Markdown>
      </Box>
      <Box sx={styles.buttonContainer}>
        {available_actions.includes('approve') && (
          <BaseBtn
            variant="positive"
            startIcon={<CheckedIcon />}
            onClick={handleApprove}
            disabled={disabled}
            sx={styles.buttonIcon}
          >
            Approve
          </BaseBtn>
        )}
        {available_actions.includes('edit') && (
          <EditControl
            onSubmit={handleEditSubmit}
            disabled={disabled}
          />
        )}
        {available_actions.includes('reject') && (
          <BaseBtn
            variant="alarm"
            startIcon={<RejectIcon />}
            onClick={handleReject}
            disabled={disabled}
            sx={styles.buttonIcon}
          >
            Reject
          </BaseBtn>
        )}
        {canBlockWithComment && (
          <BlockWithCommentControl
            onSubmit={handleBlockWithComment}
            disabled={disabled}
          />
        )}
      </Box>
    </Box>
  );
});

ChatHitlActions.displayName = 'ChatHitlActions';

/** @type {MuiSx} */
const getStyles = () => ({
  container: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0.875rem 1rem 0.9375rem',
    gap: '0.75rem',
    borderRadius: '0.625rem',
    background: palette.background.userInputBackgroundActive,
    alignItems: 'flex-start',
  }),
  sensitiveContainer: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0.625rem 0.75rem',
    gap: '0.375rem',
    borderRadius: '0.625rem',
    background: palette.background.userInputBackgroundActive,
    border: `0.0625rem solid ${palette.warning.main}`,
    alignItems: 'flex-start',
  }),
  sensitiveTitle: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: '1.25rem',
    color: palette.warning.main,
  }),
  sensitiveActionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  sensitiveActionLabel: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 400,
    color: palette.text.secondary,
  }),
  sensitiveActionName: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    color: palette.text.primary,
  }),
  sensitivePolicy: ({ palette }) => ({
    fontSize: '0.8125rem',
    fontWeight: 400,
    lineHeight: '1.25rem',
    color: palette.text.secondary,
    fontStyle: 'italic',
  }),
  message: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.25rem',
    color: palette.text.secondary,
  }),
  buttonContainer: {
    display: 'flex',
    gap: '0.625rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  buttonIcon: {
    '& .MuiButton-startIcon': {
      color: 'white',
    },
  },
});

export default ChatHitlActions;
