import { memo, useCallback, useMemo } from 'react';

import { Box, FormControlLabel, FormHelperText, Typography } from '@mui/material';

import { ToolBaseHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { Checkbox } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

// Renders an array field whose schema lists its options (ui_component: 'checkbox_list').
// At least one box stays ticked: the last ticked box can't be unticked.
const CheckboxListInput = memo(props => {
  const {
    k,
    value,
    options = [],
    defaultValue,
    label,
    editField,
    fieldPath,
    disabled = false,
    errorText,
  } = props;

  const styles = checkboxListInputStyles();

  const selected = useMemo(
    () => ToolBaseHelpers.getCheckboxListValue(value, options, defaultValue),
    [value, options, defaultValue],
  );

  const handleChange = useCallback(
    optionValue => (_, checked) => {
      editField(fieldPath, ToolBaseHelpers.toggleCheckboxListValue(selected, optionValue, checked, options));
    },
    [editField, fieldPath, selected, options],
  );

  return (
    <Box
      sx={styles.root}
      data-testid={`toolkit-field-${k}-checkbox-list`}
    >
      <Typography
        variant="bodyMedium"
        sx={styles.label}
      >
        {label}
      </Typography>
      <Box sx={styles.options}>
        {options.map(option => {
          const isChecked = selected.includes(option.value);
          const isLastChecked = isChecked && selected.length === 1;
          return (
            <FormControlLabel
              key={option.value}
              sx={styles.option}
              control={
                <Checkbox.BaseCheckbox
                  data-testid={`toolkit-field-${k}-option-${option.value}`}
                  inputProps={{ 'data-testid': `toolkit-field-${k}-option-${option.value}-field` }}
                  checked={isChecked}
                  onChange={handleChange(option.value)}
                  disabled={disabled || isLastChecked}
                />
              }
              label={
                <Typography
                  variant="bodyMedium"
                  sx={styles.optionLabel}
                >
                  {option.label || option.value}
                  {option.description && (
                    <InfoTooltip
                      infoTooltip={option.description}
                      sx={styles.infoIcon}
                      testId={`toolkit-field-${k}-option-${option.value}-info`}
                    />
                  )}
                </Typography>
              }
            />
          );
        })}
      </Box>
      {errorText && <FormHelperText error>{errorText}</FormHelperText>}
    </Box>
  );
});

CheckboxListInput.displayName = 'CheckboxListInput';

/** @type {MuiSx} */
const checkboxListInputStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '0.75rem',
    marginBottom: '0.5rem',
    padding: '0 0.75rem',
  },
  label: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    color: palette.text.primary,
  }),
  options: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '0.25rem',
  },
  option: {
    height: '2rem',
    marginLeft: 0,
  },
  optionLabel: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  infoIcon: {
    display: 'inline-flex',
    marginLeft: '0.25rem',
  },
});

export default CheckboxListInput;
