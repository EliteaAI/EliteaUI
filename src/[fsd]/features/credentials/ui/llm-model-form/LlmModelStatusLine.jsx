import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import CheckIcon from '@/components/Icons/CheckIcon';
import ErrorIcon from '@/components/Icons/ErrorIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

import { LlmModelFormConstants } from '../../lib/constants';

const { LLM_MODEL_STATUS_TONES } = LlmModelFormConstants;

const STATUS_ICONS = {
  [LLM_MODEL_STATUS_TONES.success]: CheckIcon,
  [LLM_MODEL_STATUS_TONES.warning]: InfoIcon,
  [LLM_MODEL_STATUS_TONES.error]: ErrorIcon,
};

const LlmModelStatusLine = memo(props => {
  const { status, testId } = props;
  const styles = llmModelStatusLineStyles();
  const tone = STATUS_ICONS[status.tone] ? status.tone : LLM_MODEL_STATUS_TONES.warning;

  return (
    <Typography
      variant="bodySmall"
      role={tone === LLM_MODEL_STATUS_TONES.error ? 'alert' : 'status'}
      sx={[styles.status, styles[tone]]}
      data-testid={testId}
      data-tone={tone}
    >
      <Box
        component={STATUS_ICONS[tone]}
        sx={styles.icon}
        fill="currentColor"
      />
      {status.text}
    </Typography>
  );
});

LlmModelStatusLine.displayName = 'LlmModelStatusLine';

/** @type {MuiSx} */
const llmModelStatusLineStyles = () => ({
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  icon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
  [LLM_MODEL_STATUS_TONES.success]: ({ palette }) => ({
    color: palette.alert.success.text,
  }),
  [LLM_MODEL_STATUS_TONES.warning]: ({ palette }) => ({
    color: palette.text.attention,
  }),
  [LLM_MODEL_STATUS_TONES.error]: ({ palette }) => ({
    color: palette.text.error,
    overflowWrap: 'anywhere',
  }),
});

export default LlmModelStatusLine;
