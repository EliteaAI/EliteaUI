import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Label } from '@/[fsd]/shared/ui';
import CheckIcon from '@/components/Icons/CheckIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

import { LlmModelFormConstants } from '../../lib/constants';

const {
  LLM_MODEL_FIELD_ERROR_ATTRIBUTE,
  LLM_MODEL_FIELD_INFO_TEXTS,
  LLM_MODEL_FIELD_LABELS,
  LLM_MODEL_RECOGNITION_TONES,
} = LlmModelFormConstants;

const LlmModelField = memo(props => {
  const { field, required, error, helperText, warning, status, children, sx } = props;
  const styles = llmModelFieldStyles();
  const StatusIcon = status?.tone === LLM_MODEL_RECOGNITION_TONES.success ? CheckIcon : InfoIcon;

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
      {status && (
        <Typography
          variant="bodySmall"
          role="status"
          sx={[
            styles.status,
            status.tone === LLM_MODEL_RECOGNITION_TONES.success ? styles.success : styles.warning,
          ]}
          data-testid={`llm-model-status-${field}`}
          data-tone={status.tone}
        >
          <StatusIcon
            sx={styles.statusIcon}
            fill="currentColor"
          />
          {status.text}
        </Typography>
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
    whiteSpace: 'pre-line',
  }),
  success: ({ palette }) => ({
    color: palette.alert.success.text,
  }),
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  statusIcon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
  error: ({ palette }) => ({
    color: palette.text.error,
  }),
});

export default LlmModelField;
