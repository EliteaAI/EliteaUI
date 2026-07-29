import { memo, useCallback, useEffect, useMemo } from 'react';

import { Box, TextField, Typography } from '@mui/material';

const MAX_CHARS = 2500;

const GenerateProjectContextReviewForm = memo(props => {
  const { draft, onChange, onValidationChange } = props;

  const projectBackground = draft.project_background || '';

  const { charError, isValid } = useMemo(() => {
    const exceeded = projectBackground.length > MAX_CHARS;
    return {
      charError: exceeded,
      isValid: projectBackground.trim().length > 0 && !exceeded,
    };
  }, [projectBackground]);

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
              ? `Content exceeds ${MAX_CHARS} characters.`
              : `${projectBackground.length}/${MAX_CHARS}`
          }
          error={charError}
          sx={styles.textField}
        />
      </Box>
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
