import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { Input, Switch } from '@/[fsd]/shared/ui';
import { CONTEXT_MESSAGES } from '@/[fsd]/widgets/context-budget/lib/constants';
import { handleConvertToNumberChange } from '@/[fsd]/widgets/context-budget/lib/validation';

const ProfileSummarization = memo(() => {
  const { values, errors, setFieldValue } = useFormikContext();

  const styles = profileSummarizationStyles();

  const isSummarizationDisabled = !values.context_enabled || !values.enable_summarization;

  const handleSummarizationEnabledChange = useCallback(
    (event, checkedValue) => {
      setFieldValue('enable_summarization', checkedValue);
    },
    [setFieldValue],
  );

  const handleInstructionsChange = useCallback(
    e => setFieldValue('summary_llm_settings.instructions', e.target.value),
    [setFieldValue],
  );

  const handleMaxTokensChange = useCallback(
    e => {
      const value = e?.target?.value;
      handleConvertToNumberChange(value, 'summary_llm_settings.max_tokens', setFieldValue);
    },
    [setFieldValue],
  );

  return (
    <Box sx={styles.container}>
      {/* Enable Toggle */}
      <Box sx={styles.toggleSection}>
        <Typography
          variant="headingSmall"
          sx={{ color: 'text.secondary' }}
        >
          Automatic Summarization
        </Typography>
        <Switch.BaseSwitch
          checked={values.enable_summarization}
          onChange={handleSummarizationEnabledChange}
          disabled={!values.context_enabled}
        />
      </Box>

      {/* Summarization Instructions */}
      <Box sx={styles.section}>
        <Input.StyledInputEnhancer
          label="Summarization instructions"
          tooltipDescription="Custom instructions for how summaries should be generated"
          autoComplete="off"
          variantInput="outlined"
          fullWidth
          multiline
          value={values.summary_llm_settings?.instructions || ''}
          onChange={handleInstructionsChange}
          enableAutoBlur={false}
          error={!!errors.summary_llm_settings?.instructions}
          helperText={errors.summary_llm_settings?.instructions}
          disabled={isSummarizationDisabled}
          placeholder={CONTEXT_MESSAGES.DEFAULT_SUMMARY_INSTRUCTION}
          hasActionsToolBar
          showCopyAction={false}
          showExpandAction={false}
          fieldName="Summarization Instructions"
          containerProps={styles.inputContainer}
        />
      </Box>

      {/* Target Summary Tokens */}
      <Box sx={styles.halfWidthSection}>
        <Input.StyledInputEnhancer
          label="Target Summary Tokens"
          tooltipDescription="Target length for summary generation"
          type="text"
          inputMode="numeric"
          value={values.summary_llm_settings?.max_tokens || ''}
          onChange={handleMaxTokensChange}
          error={!!errors.summary_llm_settings?.max_tokens}
          helperText={errors.summary_llm_settings?.max_tokens}
          disabled={isSummarizationDisabled}
          enableAutoBlur={false}
          containerProps={styles.inputContainer}
          inputProps={{
            pattern: '[1-9][0-9]*',
          }}
        />
      </Box>
    </Box>
  );
});

ProfileSummarization.displayName = 'ProfileSummarization';

/** @type {MuiSx} */
const profileSummarizationStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  toggleSection: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    backgroundColor: palette.background.userInputBackground,
    borderRadius: '0.75rem',
  }),
  section: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  halfWidthSection: {
    display: 'flex',
    flexDirection: 'column',
    width: '48%',
  },
  label: {
    paddingLeft: '0.75rem',
  },
  inputContainer: {
    padding: '0rem',
    margin: '0rem',
  },
});

export default ProfileSummarization;
