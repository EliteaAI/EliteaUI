import { memo, useCallback, useEffect, useMemo } from 'react';

import { Box, FormControlLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material';

const MAX_CHARS = 2500;

export const APPLY_MODE = {
  REPLACE: 'replace',
  APPEND: 'append',
};

const APPEND_SEPARATOR = '\n\n';

const GenerateProjectContextReviewForm = memo(props => {
  const { draft, onChange, onValidationChange, hasExistingContent, existingContentLength, applyMode, onApplyModeChange } = props;

  const projectBackground = draft.project_background || '';

  const { effectiveLength, charError, isValid } = useMemo(() => {
    const len =
      hasExistingContent && applyMode === APPLY_MODE.APPEND
        ? existingContentLength + APPEND_SEPARATOR.length + projectBackground.length
        : projectBackground.length;
    const exceeded = len > MAX_CHARS;
    return { effectiveLength: len, charError: exceeded, isValid: projectBackground.trim().length > 0 && !exceeded };
  }, [projectBackground, hasExistingContent, applyMode, existingContentLength]);

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const handleChange = useCallback(
    e => {
      onChange({ ...draft, project_background: e.target.value });
    },
    [draft, onChange],
  );

  const styles = reviewFormStyles();

  return (
    <Box sx={styles.container}>
      <Box sx={styles.field}>
        <Typography sx={styles.label}>Project Background</Typography>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={8}
          maxRows={16}
          value={projectBackground}
          onChange={handleChange}
          slotProps={{ htmlInput: { maxLength: MAX_CHARS } }}
          helperText={
            charError
              ? `Combined content exceeds ${MAX_CHARS} characters.`
              : `${effectiveLength}/${MAX_CHARS}`
          }
          error={charError}
          sx={styles.textField}
        />
      </Box>

      {hasExistingContent && (
        <Box sx={styles.field}>
          <Typography sx={styles.label}>Existing content detected</Typography>
          <RadioGroup
            value={applyMode}
            onChange={e => onApplyModeChange(e.target.value)}
          >
            <FormControlLabel
              value={APPLY_MODE.REPLACE}
              control={<Radio size="small" />}
              label="Replace existing content"
              sx={styles.radio}
            />
            <FormControlLabel
              value={APPLY_MODE.APPEND}
              control={<Radio size="small" />}
              label="Append to existing content"
              sx={styles.radio}
            />
          </RadioGroup>
        </Box>
      )}
    </Box>
  );
});

GenerateProjectContextReviewForm.displayName = 'GenerateProjectContextReviewForm';

const reviewFormStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    color: 'text.primary',
  },
  radio: {
    '& .MuiFormControlLabel-label': {
      fontSize: '0.875rem',
    },
  },
  textField: ({ palette }) => ({
    '& .MuiOutlinedInput-root': {
      backgroundColor: palette.background.userInputBackground,
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      color: palette.text.secondary,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: palette.border.lines,
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: palette.border.lines,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: palette.primary.main,
        borderWidth: '0.0625rem',
      },
    },
    '& .MuiFormHelperText-root': {
      fontSize: '0.625rem',
      margin: '0.125rem 0 0',
      color: palette.text.primary,
      visibility: 'visible',
      lineHeight: '1rem',
      textAlign: 'right',
    },
    '& .MuiFormHelperText-root.Mui-error': {
      visibility: 'visible',
      color: palette.error.main,
    },
  }),
});

export default GenerateProjectContextReviewForm;
