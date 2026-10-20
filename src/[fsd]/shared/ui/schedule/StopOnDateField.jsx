import { memo, useState } from 'react';

import { format, isBefore, isValid, parseISO, startOfToday } from 'date-fns';

import { Box, FormControlLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { BaseCheckbox } from '@/[fsd]/shared/ui/checkbox';

const PAST_DATE_MESSAGE = 'Pick today or a later date';

/**
 * "Stop on a date" checkbox with a date picker.
 * Controlled: `value` is `yyyy-MM-dd` or null; unchecking calls `onChange(null)`.
 * `error` is a server error for the stop date.
 */
const StopOnDateField = memo(props => {
  const { value, onChange, error, testIdPrefix = 'pipeline-schedule' } = props;

  const [checked, setChecked] = useState(Boolean(value));

  const date = value ? parseISO(value) : null;
  const pastError = date && isValid(date) && isBefore(date, startOfToday()) ? PAST_DATE_MESSAGE : '';
  const helperText = pastError || error;

  const handleCheck = event => {
    setChecked(event.target.checked);
    if (!event.target.checked) onChange(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <FormControlLabel
        label="Stop on a date"
        control={
          <BaseCheckbox
            checked={checked}
            onChange={handleCheck}
            data-testid={`${testIdPrefix}-stop-on-date-checkbox`}
          />
        }
      />
      {checked && (
        <DatePicker
          value={date}
          disablePast
          onChange={next => onChange(next && isValid(next) ? format(next, 'yyyy-MM-dd') : null)}
          slotProps={{
            textField: {
              size: 'small',
              error: Boolean(helperText),
              helperText,
              inputProps: { 'data-testid': `${testIdPrefix}-stop-on-date-input` },
            },
          }}
        />
      )}
    </Box>
  );
});

StopOnDateField.displayName = 'StopOnDateField';

export default StopOnDateField;
