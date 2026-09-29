import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { LlmModelFormConstants } from '../../lib/constants';
import LlmModelLegacyTag from './LlmModelLegacyTag';

const { LLM_MODEL_THINKING_TYPES, LLM_MODEL_THINKING_TYPE_FIXED_LABELS } = LlmModelFormConstants;

const LlmModelThinkingModeValue = memo(props => {
  const { thinkingType } = props;
  const styles = llmModelThinkingModeValueStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="llm-model-thinking-type-fixed"
    >
      <Typography variant="bodyMedium">{LLM_MODEL_THINKING_TYPE_FIXED_LABELS[thinkingType]}</Typography>
      {thinkingType === LLM_MODEL_THINKING_TYPES.enabled && <LlmModelLegacyTag />}
    </Box>
  );
});

LlmModelThinkingModeValue.displayName = 'LlmModelThinkingModeValue';

/** @type {MuiSx} */
const llmModelThinkingModeValueStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default LlmModelThinkingModeValue;
