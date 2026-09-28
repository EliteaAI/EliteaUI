import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Label } from '@/[fsd]/shared/ui';

import { LlmModelFormConstants } from '../../lib/constants';

const { LLM_MODEL_FIELD_ERROR_ATTRIBUTE, LLM_MODEL_FIELD_INFO_TEXTS, LLM_MODEL_FIELD_LABELS } =
  LlmModelFormConstants;

const LlmModelField = memo(props => {
  const { field, required, error, helperText, warning, children, sx } = props;
  const styles = llmModelFieldStyles();

  return (
    <Box
      sx={[styles.field, sx]}
      data-testid={`llm-model-field-${field}`}
      {...{ [LLM_MODEL_FIELD_ERROR_ATTRIBUTE]: error ? true : undefined }}
    >
      <Label.InfoLabelWithTooltip
        label={LLM_MODEL_FIELD_LABELS[field]}
        required={required}
        tooltip={LLM_MODEL_FIELD_INFO_TEXTS[field]}
        tooltipTestId={`llm-model-info-${field}`}
        tooltipContentTestId={`llm-model-info-text-${field}`}
      />
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
