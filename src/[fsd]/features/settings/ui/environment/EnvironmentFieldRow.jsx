import { memo, useCallback, useMemo } from 'react';

import { Box, IconButton, TextField, Tooltip } from '@mui/material';

import { EnvironmentFieldHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { Label } from '@/[fsd]/shared/ui';
import ClockIcon from '@/assets/icons/clock_icon.svg?react';

const EnvironmentFieldRow = memo(props => {
  const { field, value, disabled, onChange, onBlur, onRestore } = props;

  const styles = environmentFieldRowStyles();
  const isNumeric = EnvironmentFieldHelpers.isNumericType(field.type);

  const handleChange = useCallback(
    event => {
      onChange(field.key, event.target.value);
    },
    [field.key, onChange],
  );

  const handleBlur = useCallback(() => {
    onBlur(field.key);
  }, [field.key, onBlur]);

  const handleRestore = useCallback(() => {
    onRestore(field.key);
  }, [field.key, onRestore]);

  const slotProps = useMemo(
    () => ({
      input: {
        'aria-label': field.label,
        ...(isNumeric && {
          min: field.minimum ?? 0,
          ...(field.maximum !== undefined && { max: field.maximum }),
          step: field.type === 'integer' ? 1 : 'any',
        }),
      },
    }),
    [field, isNumeric],
  );

  return (
    <Box sx={styles.fieldRow}>
      <Label.InfoLabelWithTooltip
        label={field.label}
        tooltip={field.tooltip}
        variant="bodyMedium"
        sx={styles.label}
      />
      <Box sx={styles.inputContainer}>
        <TextField
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          fullWidth
          variant="standard"
          type={isNumeric ? 'number' : 'text'}
          slotProps={slotProps}
          sx={styles.textField}
        />
        <Tooltip
          title="Restore to default"
          placement="top"
        >
          <Box component="span">
            <IconButton
              variant="alita"
              color="tertiary"
              onClick={handleRestore}
              disabled={disabled}
              aria-label={`restore-${field.key}`}
              sx={styles.iconButton}
            >
              <ClockIcon />
            </IconButton>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
});

EnvironmentFieldRow.displayName = 'EnvironmentFieldRow';

/** @type {MuiSx} */
const environmentFieldRowStyles = () => ({
  fieldRow: {
    display: 'flex',
    flexDirection: 'column',
    width: '26.25rem',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    gap: '0.25rem',
  },
  label: {
    paddingLeft: '0.7rem',
  },
  iconButton: {
    mt: '0.5rem',
  },
  textField: {
    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active':
      ({ palette }) => ({
        WebkitBoxShadow: `0 0 0 62.5rem ${palette.background.tabPanel} inset`,
        WebkitTextFillColor: `${palette.text.secondary}`,
        caretColor: palette.text.secondary,
        transition: 'background-color 5000s ease-in-out 0s',
      }),
    '& input:-webkit-autofill::first-line': ({ palette }) => ({
      color: `${palette.text.secondary}`,
    }),
  },
});

export default EnvironmentFieldRow;
