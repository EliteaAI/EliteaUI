import { memo, useCallback } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { Checkbox, Input } from '@/[fsd]/shared/ui';

import { VERSION_NAME_MAX_LENGTH, VERSION_NAME_REGEX } from '../lib/constants/version.constants';
import PublishingTerms from './PublishingTerms';

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
        variant="headingSmall"
        color="text.secondary"
        sx={{ textAlign: 'center' }}
      >
        Enter a version name and accept the Publishing Terms to continue.
      </Typography>

      <Input.InputBase
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
          sx={{ fontWeight: 600, marginLeft: '0.75rem' }}
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
      marginLeft: '0.75rem',
    },
  },
  termsContainer: {
    maxHeight: '15rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  checkbox: {
    marginLeft: 0,
    alignItems: 'center',
    display: 'flex',
    gap: '0.5rem',
  },
};

export default PreparationStep;
