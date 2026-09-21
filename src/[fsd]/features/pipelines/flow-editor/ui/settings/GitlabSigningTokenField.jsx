import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';

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
      <Input.InputBase
        label="Signing token"
        value={value}
        onChange={handleChange}
        placeholder={isConfigured ? 'Paste a new token to replace the saved one' : 'whsec_…'}
        error={Boolean(error)}
        helperText={error || (isConfigured ? CONFIGURED_HELPER_TEXT : EMPTY_HELPER_TEXT)}
        helperTextTestId="pipeline-webhook-signing-token-helper-text"
        sx={styles.input}
        inputProps={{
          'data-testid': 'pipeline-webhook-signing-token-input',
          autoComplete: 'off',
          spellCheck: 'false',
        }}
      />
    </Box>
  );
});

GitlabSigningTokenField.displayName = 'GitlabSigningTokenField';

/** @type {MuiSx} */
const gitlabSigningTokenFieldStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  // Monospace so a mis-pasted token is legible character by character.
  input: {
    '& input': {
      fontSize: '0.75rem',
      fontFamily: 'monospace',
    },
  },
});

export default GitlabSigningTokenField;
