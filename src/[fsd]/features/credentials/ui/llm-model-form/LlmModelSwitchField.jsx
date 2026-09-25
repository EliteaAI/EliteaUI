import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { Switch } from '@/[fsd]/shared/ui';

import { LlmModelFormConstants } from '../../lib/constants';
import LlmModelFieldInfo from './LlmModelFieldInfo';

const { LLM_MODEL_FIELD_ERROR_ATTRIBUTE, LLM_MODEL_FIELD_LABELS, LLM_MODEL_SWITCH_DESCRIPTIONS } =
  LlmModelFormConstants;

const LlmModelSwitchField = memo(props => {
  const { field, checked, onChange, error, isInfoOpen, onInfoToggle, onInfoClose } = props;
  const label = LLM_MODEL_FIELD_LABELS[field];
  const titleId = `llm-model-${field}-title`;
  const styles = llmModelSwitchFieldStyles();

  const switchSlotProps = useMemo(
    () => ({
      switch: {
        slotProps: {
          input: { role: 'switch', 'aria-labelledby': titleId, 'data-testid': `llm-model-switch-${field}` },
        },
      },
    }),
    [titleId, field],
  );

  const handleChange = useCallback((event, isChecked) => onChange(field, isChecked), [field, onChange]);

  return (
    <Box
      sx={styles.field}
      data-testid={`llm-model-field-${field}`}
      {...{ [LLM_MODEL_FIELD_ERROR_ATTRIBUTE]: error ? true : undefined }}
    >
      <Box sx={styles.row}>
        <Box sx={styles.text}>
          <Box sx={styles.titleRow}>
            <Typography
              id={titleId}
              variant="labelMedium"
              sx={styles.title}
            >
              {label}
            </Typography>
            <LlmModelFieldInfo
              field={field}
              label={label}
              isOpen={isInfoOpen}
              onToggle={onInfoToggle}
              onClose={onInfoClose}
            />
          </Box>
          <Typography
            variant="bodySmall"
            sx={styles.description}
          >
            {LLM_MODEL_SWITCH_DESCRIPTIONS[field]}
          </Typography>
        </Box>
        <Switch.BaseSwitch
          checked={Boolean(checked)}
          onChange={handleChange}
          slotProps={switchSlotProps}
        />
      </Box>
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
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
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
});

export default LlmModelSwitchField;
