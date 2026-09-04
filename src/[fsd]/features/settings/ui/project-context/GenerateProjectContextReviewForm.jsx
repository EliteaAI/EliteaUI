import { memo, useCallback, useEffect, useMemo } from 'react';

import { Box, TextField, Typography } from '@mui/material';

import {
  PROJECT_CONTEXT_ACTIVATION_DESCRIPTION_MAX_LEN,
  PROJECT_CONTEXT_MAX_LEN,
} from '@/[fsd]/features/settings/lib/constants/projectContext.constants';
import { Input } from '@/[fsd]/shared/ui';
import { INPUT_VARIANTS } from '@/[fsd]/shared/ui/input';

const GenerateProjectContextReviewForm = memo(props => {
  const { draft, onChange, onValidationChange } = props;

  const projectBackground = draft.project_background || '';
  const activationDescription = draft.activation_description || '';

  const { charError, isValid } = useMemo(() => {
    const exceeded = projectBackground.length > PROJECT_CONTEXT_MAX_LEN;
    const activationExceeded = activationDescription.length > PROJECT_CONTEXT_ACTIVATION_DESCRIPTION_MAX_LEN;
    return {
      charError: exceeded,
      isValid:
        projectBackground.trim().length > 0 &&
        activationDescription.trim().length > 0 &&
        !exceeded &&
        !activationExceeded,
    };
  }, [activationDescription, projectBackground]);

  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const handleChange = useCallback(
    e => {
      onChange({ ...draft, project_background: e.target.value });
    },
    [draft, onChange],
  );

  const handleActivationDescriptionChange = useCallback(
    e => {
      onChange({ ...draft, activation_description: e.target.value });
    },
    [draft, onChange],
  );

  const styles = reviewFormStyles();

  return (
    <Box sx={styles.container}>
      <Box sx={styles.field}>
        <Typography sx={styles.label}>When should this context be used?</Typography>
        <Input.InputBase
          variant={INPUT_VARIANTS.outlined}
          fullWidth
          size="small"
          value={activationDescription}
          onChange={handleActivationDescriptionChange}
          inputProps={{ maxLength: PROJECT_CONTEXT_ACTIVATION_DESCRIPTION_MAX_LEN }}
          helperText={`${activationDescription.length}/${PROJECT_CONTEXT_ACTIVATION_DESCRIPTION_MAX_LEN}`}
          error={!activationDescription.trim()}
          sx={styles.textField}
        />
      </Box>
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
          slotProps={{
            htmlInput: {
              maxLength: PROJECT_CONTEXT_MAX_LEN,
              'data-testid': 'generate-project-context-review-background-input',
            },
          }}
          helperText={
            charError
              ? `Content exceeds ${PROJECT_CONTEXT_MAX_LEN} characters.`
              : `${projectBackground.length}/${PROJECT_CONTEXT_MAX_LEN}`
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
