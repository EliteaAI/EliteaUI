import { memo, useCallback, useId, useMemo, useState } from 'react';

import { Box, Collapse, Typography } from '@mui/material';

import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import EditIcon from '@/assets/edit.svg?react';
import RejectIcon from '@/assets/reject.svg?react';

const SENSITIVE_PARAM_MASK = '***';

const SensitiveToolParams = memo(props => {
  const { toolArgs } = props;
  const [expanded, setExpanded] = useState(true);
  const contentId = useId();

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleExpanded();
      }
    },
    [toggleExpanded],
  );

  const paramEntries = useMemo(() => {
    if (!toolArgs || typeof toolArgs !== 'object') return [];
    return Object.entries(toolArgs);
  }, [toolArgs]);

  if (paramEntries.length === 0) return null;

  return (
    <Box sx={sensitiveToolParamsStyles.wrapper}>
      <Box
        sx={sensitiveToolParamsStyles.header}
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        <Typography
          variant="labelSmall"
          sx={sensitiveToolParamsStyles.headerText}
        >
          Parameters {expanded ? '▾' : '▸'}
        </Typography>
      </Box>
      <Collapse
        in={expanded}
        id={contentId}
      >
        <Box sx={sensitiveToolParamsStyles.paramList}>
          {paramEntries.map(([key, value]) => (
            <Box
              key={key}
              sx={sensitiveToolParamsStyles.paramRow}
            >
              <Typography
                variant="labelSmall"
                sx={sensitiveToolParamsStyles.paramKey}
              >
                {key}:
              </Typography>
              <Typography
                variant="labelSmall"
                sx={sensitiveToolParamsStyles.paramValue}
              >
                {value === SENSITIVE_PARAM_MASK
                  ? SENSITIVE_PARAM_MASK
                  : String(typeof value === 'object' ? JSON.stringify(value) : value)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
});
SensitiveToolParams.displayName = 'SensitiveToolParams';

const ChatHitlActions = memo(props => {
  const { hitlInterrupt, onHitlResume, onHitlEditClick, disabled } = props;
  const { available_actions = [], guardrail_type } = hitlInterrupt || {};
  const isSensitiveTool = guardrail_type === 'sensitive_tool';
  const styles = getStyles();

  const handleApprove = useCallback(() => {
    onHitlResume?.({ action: 'approve' });
  }, [onHitlResume]);

  const handleReject = useCallback(() => {
    onHitlResume?.({ action: 'reject' });
  }, [onHitlResume]);

  const handleEditClick = useCallback(() => {
    onHitlEditClick?.();
  }, [onHitlEditClick]);

  if (!hitlInterrupt) return null;

  if (isSensitiveTool) {
    return (
      <Box sx={styles.sensitiveContainer}>
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
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        Here are some results. Choose the action to proceed.
      </Typography>
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
          <BaseBtn
            variant="neutral"
            startIcon={<EditIcon />}
            onClick={handleEditClick}
            disabled={disabled}
            sx={styles.buttonIcon}
          >
            Edit
          </BaseBtn>
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
      </Box>
    </Box>
  );
});

/** @type {MuiSx} */
const sensitiveToolParamsStyles = {
  wrapper: ({ palette }) => ({
    width: '100%',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border?.lines || palette.divider}`,
    overflow: 'hidden',
  }),
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.375rem 0.625rem',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    '&:hover': {
      backgroundColor: palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    },
  }),
  headerText: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: palette.text.secondary,
  }),
  paramList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    padding: '0.375rem 0.625rem',
  },
  paramRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
  paramKey: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: palette.text.secondary,
    flexShrink: 0,
  }),
  paramValue: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 400,
    color: palette.text.primary,
    wordBreak: 'break-word',
  }),
};

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
    padding: '0.875rem 1rem 0.9375rem',
    gap: '0.625rem',
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

ChatHitlActions.displayName = 'ChatHitlActions';

export default ChatHitlActions;
