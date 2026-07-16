import { memo, useCallback, useEffect, useMemo } from 'react';

import { Box, TextField, Typography } from '@mui/material';

import { validateSkillDraft } from '@/[fsd]/features/skill/lib/helpers';
import { MAX_DESCRIPTION_LENGTH, MAX_INSTRUCTIONS_LENGTH } from '@/common/constants.js';

const SKILL_NAME_MAX_LENGTH = 64;

const GenerateSkillReviewForm = memo(props => {
  const { draft, onChange, onValidationChange } = props;

  const styles = generateSkillReviewFormStyles();

  const validationErrors = useMemo(() => validateSkillDraft(draft), [draft]);

  const isValid = useMemo(() => Object.keys(validationErrors).length === 0, [validationErrors]);

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const handleFieldChange = useCallback(
    (field, value) => {
      onChange({ ...draft, [field]: value });
    },
    [draft, onChange],
  );

  return (
    <Box sx={styles.container}>
      <Box sx={styles.field}>
        <Typography sx={styles.label}>Name</Typography>
        <TextField
          fullWidth
          size="small"
          value={draft.name || ''}
          onChange={e => handleFieldChange('name', e.target.value)}
          slotProps={{
            htmlInput: {
              maxLength: SKILL_NAME_MAX_LENGTH,
              'data-testid': 'generate-skill-review-name-input',
            },
          }}
          helperText={validationErrors.name || `${(draft.name || '').length}/${SKILL_NAME_MAX_LENGTH}`}
          error={!!validationErrors.name}
          sx={styles.textField}
        />
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Description</Typography>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={2}
          maxRows={4}
          value={draft.description || ''}
          onChange={e => handleFieldChange('description', e.target.value)}
          slotProps={{
            htmlInput: {
              maxLength: MAX_DESCRIPTION_LENGTH,
              'data-testid': 'generate-skill-review-description-input',
            },
          }}
          helperText={
            validationErrors.description || `${(draft.description || '').length}/${MAX_DESCRIPTION_LENGTH}`
          }
          error={!!validationErrors.description}
          sx={styles.textField}
        />
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Instructions</Typography>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={4}
          maxRows={10}
          value={draft.instructions || ''}
          onChange={e => handleFieldChange('instructions', e.target.value)}
          slotProps={{
            htmlInput: {
              maxLength: MAX_INSTRUCTIONS_LENGTH,
              'data-testid': 'generate-skill-review-instructions-input',
            },
          }}
          helperText={
            validationErrors.instructions || `${(draft.instructions || '').length}/${MAX_INSTRUCTIONS_LENGTH}`
          }
          error={!!validationErrors.instructions}
          sx={styles.textField}
        />
      </Box>
    </Box>
  );
});

GenerateSkillReviewForm.displayName = 'GenerateSkillReviewForm';

const generateSkillReviewFormStyles = () => ({
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
      visibility: 'hidden',
      lineHeight: '1rem',
      textAlign: 'right',
    },
    '&:focus-within .MuiFormHelperText-root': {
      visibility: 'visible',
    },
    '& .MuiFormHelperText-root.Mui-error': {
      visibility: 'visible',
      color: palette.error.main,
    },
  }),
});

export default GenerateSkillReviewForm;
