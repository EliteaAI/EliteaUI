import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { LlmModelFormConstants } from '../../lib/constants';
import LlmModelStatusLine from './LlmModelStatusLine';

const { LLM_MODEL_FIELD_ERROR_ATTRIBUTE } = LlmModelFormConstants;

const LlmModelField = memo(props => {
  const { field, errorInBanner = false, error, helperText, warning, status, children, sx } = props;
  const styles = llmModelFieldStyles();

  return (
    <Box
      sx={[styles.field, sx]}
      data-testid={`llm-model-field-${field}`}
      {...{ [LLM_MODEL_FIELD_ERROR_ATTRIBUTE]: error ? true : undefined }}
    >
      {children}
      {status && (
        <LlmModelStatusLine
          status={status}
          testId={`llm-model-status-${field}`}
        />
      )}
      {warning && (
        <Typography
          variant="bodySmall"
          sx={styles.warning}
          data-testid={`llm-model-warning-${field}`}
        >
          {warning}
        </Typography>
      )}
      {error && !errorInBanner ? (
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
  helperText: ({ palette }) => ({
    marginLeft: '0.75rem',
    color: palette.text.primary,
  }),
  warning: ({ palette }) => ({
    color: palette.text.attention,
    whiteSpace: 'pre-line',
  }),
  error: ({ palette }) => ({
    color: palette.text.error,
  }),
});

export default LlmModelField;
