import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { LlmModelFormConstants } from '../../lib/constants';
import LlmModelFieldInfo from './LlmModelFieldInfo';

const { LLM_MODEL_FIELD_ERROR_ATTRIBUTE, LLM_MODEL_FIELD_LABELS } = LlmModelFormConstants;

const LlmModelField = memo(props => {
  const { field, required, error, helperText, warning, isInfoOpen, onInfoToggle, onInfoClose, children, sx } =
    props;
  const label = LLM_MODEL_FIELD_LABELS[field];
  const styles = llmModelFieldStyles();

  return (
    <Box
      sx={[styles.field, sx]}
      data-testid={`llm-model-field-${field}`}
      {...{ [LLM_MODEL_FIELD_ERROR_ATTRIBUTE]: error ? true : undefined }}
    >
      <Box sx={styles.labelRow}>
        <Typography
          component="label"
          htmlFor={`llm-model-${field}`}
          variant="bodySmall"
          sx={styles.label}
        >
          {required ? `${label} *` : label}
        </Typography>
        <LlmModelFieldInfo
          field={field}
          label={label}
          isOpen={isInfoOpen}
          onToggle={onInfoToggle}
          onClose={onInfoClose}
        />
      </Box>
      {children}
      {warning && (
        <Typography
          variant="bodySmall"
          sx={styles.warning}
          data-testid={`llm-model-warning-${field}`}
        >
          {warning}
        </Typography>
      )}
      {error ? (
        <Typography
          variant="bodySmall"
          role="alert"
          sx={styles.error}
          data-testid={`llm-model-error-${field}`}
        >
          {error}
        </Typography>
      ) : (
        helperText && (
          <Typography
            variant="bodySmall"
            sx={styles.helperText}
          >
            {helperText}
          </Typography>
        )
      )}
    </Box>
  );
});

LlmModelField.displayName = 'LlmModelField';

/** @type {MuiSx} */
const llmModelFieldStyles = () => ({
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
  }),
  helperText: ({ palette }) => ({
    color: palette.text.primary,
  }),
  warning: ({ palette }) => ({
    color: palette.text.attention,
  }),
  error: ({ palette }) => ({
    color: palette.text.error,
  }),
});

export default LlmModelField;
