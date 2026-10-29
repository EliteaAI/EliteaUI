import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { handleConvertToNumberChange } from '@/[fsd]/shared/lib/helpers';
import { Input, Switch } from '@/[fsd]/shared/ui';
import { CONTEXT_MESSAGES } from '@/[fsd]/widgets/context-budget/lib/constants';

/**
 * Automatic summarization settings shared by Settings → Memory and the Context Management modal.
 * Preserve Recent Messages, Target Summary Tokens and the instructions belong to the toggle.
 */
const SummarizationSettings = memo(props => {
  const { onCommit } = props;
  const { values, errors, setFieldValue } = useFormikContext();
  const styles = summarizationSettingsStyles();
  const isDisabled = !values.enable_summarization;

  const handleToggleChange = useCallback(
    (_event, checkedValue) => {
      setFieldValue('enable_summarization', checkedValue);
      onCommit?.();
    },
    [setFieldValue, onCommit],
  );

  const handlePreserveChange = useCallback(
    event =>
      handleConvertToNumberChange(event?.target?.value ?? '', 'preserve_recent_messages', setFieldValue),
    [setFieldValue],
  );

  const handleMaxTokensChange = useCallback(
    event =>
      handleConvertToNumberChange(
        event?.target?.value ?? '',
        'summary_llm_settings.max_tokens',
        setFieldValue,
      ),
    [setFieldValue],
  );

  const handleInstructionsChange = useCallback(
    event => setFieldValue('summary_llm_settings.instructions', event.target.value),
    [setFieldValue],
  );

  return (
    <Box
      sx={styles.container}
      data-testid="summarization-settings"
    >
      <Box sx={styles.toggleSection}>
        <Box sx={styles.toggleContent}>
          <Typography
            variant="headingSmall"
            sx={styles.toggleTitle}
          >
            Automatic Summarization
          </Typography>
          <Typography variant="bodySmall">
            Compact older history at 90% of usable input, retaining recent messages and authoritative
            instructions.
          </Typography>
        </Box>
        <Switch.BaseSwitch
          data-testid="automatic-summarization-toggle"
          checked={!!values.enable_summarization}
          onChange={handleToggleChange}
        />
      </Box>

      <Box sx={styles.fieldsRow}>
        <Input.StyledInputEnhancer
          label="Preserve Recent Messages"
          tooltipDescription="Number of most recent messages to always keep in context"
          type="text"
          inputMode="numeric"
          value={values.preserve_recent_messages ?? ''}
          onChange={handlePreserveChange}
          error={!!errors.preserve_recent_messages}
          helperText={errors.preserve_recent_messages}
          disabled={isDisabled}
          enableAutoBlur={false}
          containerProps={styles.inputContainer}
          inputProps={{
            pattern: '[1-9][0-9]*',
            'data-testid': 'preserve-recent-messages-input',
          }}
        />
        <Input.StyledInputEnhancer
          label="Target Summary Tokens"
          tooltipDescription="Target length for summary generation"
          type="text"
          inputMode="numeric"
          value={values.summary_llm_settings?.max_tokens ?? ''}
          onChange={handleMaxTokensChange}
          error={!!errors.summary_llm_settings?.max_tokens}
          helperText={errors.summary_llm_settings?.max_tokens}
          disabled={isDisabled}
          enableAutoBlur={false}
          containerProps={styles.inputContainer}
          inputProps={{
            pattern: '[1-9][0-9]*',
            'data-testid': 'target-summary-tokens-input',
          }}
        />
      </Box>

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
        disabled={isDisabled}
        placeholder={CONTEXT_MESSAGES.DEFAULT_SUMMARY_INSTRUCTION}
        hasActionsToolBar
        showCopyAction
        showExpandAction={false}
        fieldName="Summarization Instructions"
        containerProps={styles.inputContainer}
        inputProps={{
          'data-testid': 'summarization-instructions-textarea',
        }}
      />
    </Box>
  );
});

SummarizationSettings.displayName = 'SummarizationSettings';

/** @type {MuiSx} */
const summarizationSettingsStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  toggleSection: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.75rem 1rem',
    backgroundColor: palette.background.surface.interactive.default,
    borderRadius: '0.75rem',
  }),
  toggleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  toggleTitle: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  fieldsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '1rem',
  },
  inputContainer: {
    padding: '0rem',
    margin: '0rem',
  },
});

export default SummarizationSettings;
