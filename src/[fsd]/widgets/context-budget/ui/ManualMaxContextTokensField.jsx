import { memo } from 'react';

import { Box } from '@mui/material';

import { Label } from '@/[fsd]/shared/ui';
import FormInput from '@/components/FormInput';

/**
 * Admin-only manual summarization trigger, shown only while the platform toggle is on.
 */
const ManualMaxContextTokensField = memo(props => {
  const { value, error, onChange } = props;
  const styles = manualMaxContextTokensFieldStyles();

  return (
    <Box sx={styles.container}>
      <Label.InfoLabelWithTooltip
        label="Max Context Tokens"
        tooltip="Admin only, for summarization testing: manual summarization trigger that replaces the context window mode's value. Leave empty to use the mode."
        sx={styles.label}
      />
      <FormInput
        sx={styles.formInput}
        type="text"
        inputMode="numeric"
        value={value ?? ''}
        onChange={onChange}
        error={!!error}
        helperText={error || ' '}
        inputProps={{
          pattern: '[1-9][0-9]*',
          'data-testid': 'context-modal-manual-max-tokens-input',
        }}
      />
    </Box>
  );
});

ManualMaxContextTokensField.displayName = 'ManualMaxContextTokensField';

/** @type {MuiSx} */
const manualMaxContextTokensFieldStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    paddingLeft: '0.75rem',
  },
  formInput: {
    padding: '0rem',
    margin: '0rem',
  },
});

export default ManualMaxContextTokensField;
