// @vitest-environment jsdom
import { useState } from 'react';

import { enGB } from 'date-fns/locale';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StopOnDateField from '../StopOnDateField';

const LABEL = 'Stop on a date';
const PAST_DATE_MESSAGE = 'Pick today or a later date';
const PAST_DATE = '2020-01-01';
const FUTURE_DATE = '2999-12-31';

const theme = createTheme();

afterEach(() => cleanup());

// Holds the value like the form does, so a check and an uncheck behave as in the app.
const Harness = ({ initialValue = null, onChange, error }) => {
  const [value, setValue] = useState(initialValue);
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={enGB}
      >
        <StopOnDateField
          value={value}
          error={error}
          onChange={next => {
            setValue(next);
            onChange?.(next);
          }}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('EL-7011 R3 StopOnDateField', () => {
  it('R3.1 TC-US30-13: checking the box shows a date field with a mask and a calendar', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('checkbox', { name: LABEL }));

    expect(screen.getByPlaceholderText(/DD\/MM\/YYYY/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /choose date/i }));
    expect(await screen.findByRole('grid')).toBeInTheDocument();
  });

  it('R3.2 TC-US30-14: unchecking hides the field and passes null', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Harness
        initialValue={FUTURE_DATE}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('checkbox', { name: LABEL })).toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: LABEL }));

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('button', { name: /choose date/i })).not.toBeInTheDocument();
  });

  it('R3.3 TC-US30-15: a past date is marked invalid with the message', () => {
    render(<Harness initialValue={PAST_DATE} />);

    expect(screen.getByText(PAST_DATE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('R3.4 TC-US30-16: a server error shows under the date field', () => {
    render(
      <Harness
        initialValue={FUTURE_DATE}
        error="Stop date is not allowed"
      />,
    );

    expect(screen.getByText('Stop date is not allowed')).toBeInTheDocument();
  });

  it('R3.1 TC-US30-17: with no value the box is unchecked and no date field shows', () => {
    render(<Harness />);

    expect(screen.getByRole('checkbox', { name: LABEL })).not.toBeChecked();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /choose date/i })).not.toBeInTheDocument();
  });
});
