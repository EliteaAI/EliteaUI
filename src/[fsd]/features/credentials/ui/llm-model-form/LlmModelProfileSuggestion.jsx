import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';

import { LlmModelFormConstants } from '../../lib/constants';
import { getEffortLevelLabel } from '../../lib/helpers/llmModelProfiles.helpers.js';

const {
  LLM_MODEL_APPLY_PROFILE_LABEL,
  LLM_MODEL_PROFILE_SUGGESTION_TEXT,
  LLM_MODEL_REASONING_NOT_CONFIGURED_NOTE,
  LLM_MODEL_THINKING_TYPE_FIXED_LABELS,
} = LlmModelFormConstants;

const LlmModelProfileSuggestion = memo(props => {
  const { profile, onApplyProfile } = props;
  const styles = llmModelProfileSuggestionStyles();
  const thinkingMode = profile.thinking_type
    ? `${LLM_MODEL_THINKING_TYPE_FIXED_LABELS[profile.thinking_type]} · `
    : '';

  return (
    <Box
      sx={styles.root}
      data-testid="llm-model-profile-suggestion"
    >
      <Typography
        variant="bodySmall"
        sx={styles.note}
      >
        {LLM_MODEL_REASONING_NOT_CONFIGURED_NOTE}
      </Typography>
      <Typography variant="bodyMedium">
        {LLM_MODEL_PROFILE_SUGGESTION_TEXT(profile.label)} {thinkingMode}
        {profile.supported_efforts.map(getEffortLevelLabel).join(', ')} · default{' '}
        {getEffortLevelLabel(profile.default_effort)}
      </Typography>
      <Button.BaseBtn
        variant={Button.BUTTON_VARIANTS.secondary}
        onClick={onApplyProfile}
        data-testid="llm-model-apply-profile"
        sx={styles.applyButton}
      >
        {LLM_MODEL_APPLY_PROFILE_LABEL}
      </Button.BaseBtn>
    </Box>
  );
});

LlmModelProfileSuggestion.displayName = 'LlmModelProfileSuggestion';

/** @type {MuiSx} */
const llmModelProfileSuggestionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
  note: ({ palette }) => ({
    color: palette.text.primary,
  }),
  applyButton: {
    marginTop: '0.25rem',
  },
});

export default LlmModelProfileSuggestion;
