import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { InputGuardrailConstants } from '@/[fsd]/shared/lib/constants';
import AttentionIcon from '@/assets/attention-icon.svg?react';
import ErrorIcon from '@/assets/error-icon.svg?react';
import { BORDER_RADIUS } from '@/common/designTokens';

const {
  INPUT_GUARDRAIL_ACTIONS,
  INPUT_GUARDRAIL_BLOCK_MESSAGES,
  INPUT_GUARDRAIL_REDACT_MESSAGE,
  INPUT_GUARDRAIL_WARN_MESSAGE,
} = InputGuardrailConstants;

const getNoticeText = guardrail => {
  switch (guardrail?.action) {
    case INPUT_GUARDRAIL_ACTIONS.BLOCK:
      return INPUT_GUARDRAIL_BLOCK_MESSAGES[guardrail.message_key] || guardrail.message || '';
    case INPUT_GUARDRAIL_ACTIONS.REDACT:
      return INPUT_GUARDRAIL_REDACT_MESSAGE;
    case INPUT_GUARDRAIL_ACTIONS.WARN:
      return INPUT_GUARDRAIL_WARN_MESSAGE;
    default:
      return '';
  }
};

// A guardrail outcome is a policy result, not a platform failure: a block gets a plain
// explanation instead of an error trace, a redaction or warning a quieter notice.
// `record` is silent by design, so it renders nothing.
const InputGuardrailNotice = memo(props => {
  const { guardrail, sx = {} } = props;

  const text = getNoticeText(guardrail);
  const isBlocked = guardrail?.action === INPUT_GUARDRAIL_ACTIONS.BLOCK;
  const styles = inputGuardrailNoticeStyles(isBlocked);

  if (!text) return null;

  return (
    <Box
      data-testid={isBlocked ? 'input-guardrail-blocked' : 'input-guardrail-notice'}
      sx={[styles.container, sx]}
    >
      <Box
        component={isBlocked ? ErrorIcon : AttentionIcon}
        sx={styles.icon}
      />
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        {text}
      </Typography>
    </Box>
  );
});

InputGuardrailNotice.displayName = 'InputGuardrailNotice';

/** @type {MuiSx} */
const inputGuardrailNoticeStyles = isBlocked => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '.75rem 1rem',
    marginTop: '0.5rem',
    backgroundColor: isBlocked ? palette.alert.error.background : palette.alert.warning.background,
    border: `0.0625rem solid ${isBlocked ? palette.alert.error.border : palette.alert.warning.border}`,
    borderRadius: BORDER_RADIUS.MD,
  }),
  icon: ({ palette }) => ({
    fontSize: '1rem',
    color: isBlocked ? palette.icon.error : palette.icon.warning,
    flexShrink: 0,
    marginTop: '0.1rem',
  }),
  text: ({ palette }) => ({
    flex: 1,
    color: isBlocked ? palette.alert.error.text : palette.status.warningText,
    wordBreak: 'break-word',
  }),
});

export default InputGuardrailNotice;
