import { memo, useState } from 'react';

import { format, isBefore, isValid, parseISO, startOfToday } from 'date-fns';

import { Box, FormControlLabel, FormHelperText, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { BaseCheckbox } from '@/[fsd]/shared/ui/checkbox';
import { datePickerCommonProps, datePickerStyles, getDateFieldSlotProps } from '@/[fsd]/shared/ui/date-picker';

const PAST_DATE_MESSAGE = 'Pick today or a later date';

/**
 * "Stop on a date" checkbox with a date picker.
 * Controlled: `value` is `yyyy-MM-dd` or null; unchecking calls `onChange(null)`.
 * `error` is a server error for the stop date.
 */
const StopOnDateField = memo(props => {
  const { value, onChange, error, testIdPrefix = 'pipeline-schedule' } = props;

  // Only "checked, no date yet"; a set value keeps the box checked on its own.
  const [awaitingDate, setAwaitingDate] = useState(false);
  const [open, setOpen] = useState(false);
  const checked = Boolean(value) || awaitingDate;

  const date = value ? parseISO(value) : null;
  const pastError = date && isValid(date) && isBefore(date, startOfToday()) ? PAST_DATE_MESSAGE : '';
  const helperText = pastError || error;

  const handleCheck = event => {
    setAwaitingDate(event.target.checked);
    if (!event.target.checked) onChange(null);
  };

  const handleDateChange = next => {
    if (!next) {
      setAwaitingDate(true);
      onChange(null);
    } else if (isValid(next)) {
      setAwaitingDate(false);
      onChange(format(next, 'yyyy-MM-dd'));
    }
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
        <>
          <Box sx={[datePickerStyles.datePickerField, open && datePickerStyles.datePickerFieldActive]}>
            <Typography sx={datePickerStyles.datePickerLabel}>Stop date:</Typography>
            <DatePicker
              value={date}
              disablePast
              closeOnSelect={false}
              open={open}
              onOpen={() => setOpen(true)}
              onClose={() => setOpen(false)}
              onChange={handleDateChange}
              format="dd/MM/yyyy"
              {...datePickerCommonProps}
              slotProps={getDateFieldSlotProps(`${testIdPrefix}-stop-on-date-input`, {
                error: Boolean(helperText),
                inputProps: { 'aria-label': 'Stop date' },
              })}
            />
          </Box>
          {helperText && <FormHelperText error>{helperText}</FormHelperText>}
        </>
      )}
    </Box>
  );
});

StopOnDateField.displayName = 'StopOnDateField';

export default StopOnDateField;
