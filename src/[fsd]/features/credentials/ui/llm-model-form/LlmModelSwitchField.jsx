import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { Label, Switch } from '@/[fsd]/shared/ui';

import { LlmModelFormConstants } from '../../lib/constants';

const {
  LLM_MODEL_FIELD_ERROR_ATTRIBUTE,
  LLM_MODEL_FIELD_INFO_TEXTS,
  LLM_MODEL_FIELD_LABELS,
  LLM_MODEL_SWITCH_DESCRIPTIONS,
} = LlmModelFormConstants;

const LlmModelSwitchField = memo(props => {
  const { field, checked, onChange, error, locked = false, description, children } = props;
  const label = LLM_MODEL_FIELD_LABELS[field];
  const styles = llmModelSwitchFieldStyles();

  const switchSlotProps = useMemo(
    () => ({
      switch: {
        sx: locked ? styles.lockedSwitch : undefined,
        slotProps: {
          input: {
            role: 'switch',
            'aria-label': label,
            'aria-disabled': locked ? 'true' : undefined,
            'data-testid': `llm-model-switch-${field}`,
          },
        },
      },
    }),
    [label, field, locked, styles.lockedSwitch],
  );

  const handleChange = useCallback(
    (event, isChecked) => {
      if (!locked) onChange(field, isChecked);
    },
    [field, locked, onChange],
  );

  return (
    <Box
      sx={styles.field}
      data-testid={`llm-model-field-${field}`}
      {...{ [LLM_MODEL_FIELD_ERROR_ATTRIBUTE]: error ? true : undefined }}
    >
      <Box sx={styles.row}>
        <Box sx={styles.text}>
          <Label.InfoLabelWithTooltip
            label={label}
            variant="labelMedium"
            labelSx={styles.title}
            tooltip={LLM_MODEL_FIELD_INFO_TEXTS[field]}
            tooltipTestId={`llm-model-info-${field}`}
            tooltipContentTestId={`llm-model-info-text-${field}`}
          />
          <Typography
            variant="bodySmall"
            sx={styles.description}
          >
            {description ?? LLM_MODEL_SWITCH_DESCRIPTIONS[field]}
          </Typography>
        </Box>
        <Switch.BaseSwitch
          checked={Boolean(checked)}
          onChange={handleChange}
          slotProps={switchSlotProps}
        />
      </Box>
      {children}
      {error && (
        <Typography
          variant="bodySmall"
          role="alert"
          sx={styles.error}
          data-testid={`llm-model-error-${field}`}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
});

LlmModelSwitchField.displayName = 'LlmModelSwitchField';

/** @type {MuiSx} */
const llmModelSwitchFieldStyles = () => ({
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
  },
  title: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  description: ({ palette }) => ({
    color: palette.text.primary,
  }),
  error: ({ palette }) => ({
    color: palette.text.error,
  }),
  lockedSwitch: {
    opacity: 0.55,
    cursor: 'not-allowed',
    '& .MuiSwitch-input': { cursor: 'not-allowed' },
  },
});

export default LlmModelSwitchField;
