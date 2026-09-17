import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import FormInput from '@/components/FormInput';

const CONFIGURED_HELPER_TEXT =
  'A signing token is saved. Leave this empty to keep it, or paste a new one to replace it.';
const EMPTY_HELPER_TEXT =
  'GitLab shows the signing token once, when you enable the webhook. Copy it from there and paste it here — Elitea cannot generate it for you.';

const GitlabSigningTokenField = memo(props => {
  const { value = '', onChange, isConfigured = false, error, sx = {} } = props;

  const styles = gitlabSigningTokenFieldStyles();

  const handleChange = useCallback(
    event => {
      onChange?.(event.target.value);
    },
    [onChange],
  );

  return (
    <Box sx={[styles.root, sx]}>
      <Typography
        variant="labelMedium"
        sx={styles.sectionLabel}
      >
        Signing token
      </Typography>
      <FormInput
        value={value}
        onChange={handleChange}
        placeholder={isConfigured ? 'Paste a new token to replace the saved one' : 'whsec_…'}
        error={Boolean(error)}
        sx={styles.input}
        inputProps={{
          'data-testid': 'pipeline-webhook-signing-token-input',
          autoComplete: 'off',
          spellCheck: 'false',
        }}
      />
      <Typography
        variant="bodySmall"
        sx={error ? styles.errorText : styles.helperText}
        data-testid="pipeline-webhook-signing-token-helper-text"
      >
        {error || (isConfigured ? CONFIGURED_HELPER_TEXT : EMPTY_HELPER_TEXT)}
      </Typography>
    </Box>
  );
});

GitlabSigningTokenField.displayName = 'GitlabSigningTokenField';

/** @type {MuiSx} */
const gitlabSigningTokenFieldStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  input: {
    flex: 1,
    '& input': {
      fontSize: '0.75rem',
      fontFamily: 'monospace',
    },
  },
  helperText: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.75rem',
    fontStyle: 'italic',
  }),
  errorText: ({ palette }) => ({
    color: palette.error.main,
    fontSize: '0.75rem',
  }),
});

export default GitlabSigningTokenField;
