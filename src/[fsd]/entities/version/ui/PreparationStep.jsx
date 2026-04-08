import { memo, useCallback } from 'react';

import { Box, FormControlLabel, TextField, Typography } from '@mui/material';

import { Checkbox } from '@/[fsd]/shared/ui';

import PublishingTerms from './PublishingTerms';

const VERSION_NAME_REGEX = /^[a-zA-Z0-9._-]*$/;
const VERSION_NAME_MAX_LENGTH = 50;

const PreparationStep = memo(({ versionName, onVersionNameChange, agreed, onAgreedChange, error }) => {
  const handleVersionNameChange = useCallback(
    e => {
      const value = e.target.value;
      if (VERSION_NAME_REGEX.test(value)) {
        onVersionNameChange(value);
      }
    },
    [onVersionNameChange],
  );

  const handleAgreedChange = useCallback(
    (_, checked) => {
      onAgreedChange(checked);
    },
    [onAgreedChange],
  );

  return (
    <Box sx={styles.root}>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Enter a version name and accept the Publishing Terms to continue.
      </Typography>

      <TextField
        fullWidth
        variant="standard"
        label="Version name"
        autoComplete="off"
        value={versionName}
        onChange={handleVersionNameChange}
        error={!!error}
        helperText={error || 'Only letters, numbers, dots, hyphens and underscores allowed.'}
        inputProps={{ maxLength: VERSION_NAME_MAX_LENGTH }}
        sx={styles.textField}
      />

      <Box sx={styles.termsContainer}>
        <Typography
          variant="labelSmall"
          color="text.secondary"
          sx={{ fontWeight: 600, marginBottom: '0.5rem' }}
        >
          Publishing Terms
        </Typography>
        <PublishingTerms />
      </Box>

      <FormControlLabel
        control={
          <Checkbox.BaseCheckbox
            checked={agreed}
            onChange={handleAgreedChange}
          />
        }
        label={
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            I agree with the Publishing Terms.
          </Typography>
        }
        sx={styles.checkbox}
      />
    </Box>
  );
});

PreparationStep.displayName = 'PreparationStep';

/** @type {MuiSx} */
const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  textField: {
    '& .MuiFormHelperText-root': {
      fontSize: '0.75rem',
    },
  },
  termsContainer: {
    maxHeight: '15rem',
    overflowY: 'auto',
  },
  checkbox: {
    marginLeft: 0,
    alignItems: 'center',
  },
};

export default PreparationStep;
