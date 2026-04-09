import { memo, useCallback, useEffect, useState } from 'react';

import { Box, FormControlLabel, RadioGroup } from '@mui/material';

import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MAX_TOKENS_CUSTOM,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { Checkbox, Label } from '@/[fsd]/shared/ui';
import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';

const MaxTokensSection = memo(props => {
  const {
    value,
    onChange,
    onBlur,
    onFocus,
    maxOutputTokens,
    error,
    helperText,
    showRemainingTokens = true,
  } = props;

  const [mode, setMode] = useState(value === DEFAULT_MAX_TOKENS ? 'auto' : 'custom');

  // Sync mode when value prop changes from outside (e.g., when dialog reopens)
  useEffect(() => {
    setMode(value === DEFAULT_MAX_TOKENS ? 'auto' : 'custom');
  }, [value]);

  const handleModeChange = useCallback(
    event => {
      const newMode = event.target.value;
      setMode(newMode);

      if (newMode === 'auto') {
        onChange?.(DEFAULT_MAX_TOKENS);
      } else if (newMode === 'custom' && value === DEFAULT_MAX_TOKENS) {
        // When switching from auto to custom, set the default custom value
        onChange?.(DEFAULT_MAX_TOKENS_CUSTOM);
      }
    },
    [onChange, value],
  );

  const handleInputChange = useCallback(
    event => {
      if (mode === 'custom') {
        onChange?.(event);
      }
    },
    [mode, onChange],
  );

  return (
    <Box sx={styles.container}>
      <Label.InfoLabelWithTooltip
        label="Max Completion Tokens"
        tooltip="Limits the maximum length of AI responses measured in tokens (roughly 4 characters per token)."
        variant="subtitle"
        sx={styles.label}
      />

      <RadioGroup
        value={mode}
        onChange={handleModeChange}
        sx={styles.radioGroup}
      >
        <FormControlLabel
          value="auto"
          control={<Checkbox.BaseCheckbox mode="radio" />}
          label={
            <Label.InfoLabelWithTooltip
              label="Auto"
              tooltip="System automatically sets the best token limit for this model."
              variant="bodyMedium"
              sx={styles.radioLabel}
            />
          }
        />
        <FormControlLabel
          value="custom"
          control={<Checkbox.BaseCheckbox mode="radio" />}
          label={
            <Label.InfoLabelWithTooltip
              label="Custom"
              tooltip="Manually set a specific token limit for responses."
              variant="bodyMedium"
              sx={styles.radioLabel}
            />
          }
        />
      </RadioGroup>

      {/* Custom input - only shown when Custom is selected */}
      <Box sx={styles.inputsRowAnimated(mode)}>
        <Box sx={styles.inputColumn}>
          <Label.InfoLabelWithTooltip
            label="Max Tokens"
            tooltip="Enter the maximum number of tokens for completion"
            sx={styles.fieldLabel}
          />
          <StyledInputEnhancer
            onBlur={onBlur}
            onFocus={onFocus}
            onInput={handleInputChange}
            value={value || ''}
            id="max_tokens"
            type="number"
            variant="standard"
            placeholder="Input maximum length here"
            fullWidth
            error={error}
            helperText={helperText}
            sx={styles.formInput}
          />
        </Box>

        {/* Remaining Tokens - read-only field */}
        {showRemainingTokens && (
          <Box sx={styles.inputColumn}>
            <Label.InfoLabelWithTooltip
              label="Remaining Tokens"
              tooltip="Tokens remaining after max completion tokens are used"
              sx={styles.fieldLabel}
            />
            <StyledInputEnhancer
              value={
                maxOutputTokens != null && value != null
                  ? Math.max(maxOutputTokens - parseInt(value || 0), 0)
                  : ''
              }
              id="remaining_tokens"
              type="text"
              variant="standard"
              fullWidth
              editswitcher
              disabled
              placeholder=""
              sx={styles.formInput}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
});

MaxTokensSection.displayName = 'MaxTokensSection';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.75rem',
    lineHeight: '0.9375rem',
    textTransform: 'uppercase',
    paddingLeft: '0.5rem',
  }),
  radioGroup: {
    flexDirection: 'row',
    gap: '1rem',
    paddingLeft: '0.5rem',
  },
  radioLabel: ({ palette }) => ({
    marginRight: 0,
    color: `${palette.text.secondary} !important`,

    '& .MuiTypography-root': {
      color: `${palette.text.secondary} !important`,
      fontWeight: 400,
    },
  }),
  inputsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    width: '100%',
  },
  inputsRowAnimated: mode => ({
    display: mode === 'custom' ? 'flex' : 'none',
    flexDirection: 'row',
    gap: '1rem',
    width: '100%',
    maxHeight: mode === 'custom' ? '10rem' : 0,
    opacity: mode === 'custom' ? 1 : 0,
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
  }),
  inputColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  fieldLabel: {
    paddingLeft: '0.75rem',
  },
  formInput: {
    padding: '0rem',
    margin: '0rem',
  },
};

export default MaxTokensSection;
