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

const DATE_LABEL = 'Stop date';

// The shared Analytics picker styles read these palette tokens.
const theme = createTheme({
  palette: {
    border: { lines: '#ddd' },
    icon: { subtle: '#888', default: '#888', secondary: '#fff' },
    background: {
      default: { secondary: '#fff', tertiary: '#fafafa' },
      interactiveItem: { hover: '#f5f5f5' },
      surface: { interactive: { active: '#eee', selected: '#ddd' } },
    },
    components: {
      split: { background: { default: '#ccc' } },
      button: {
        text: { primary: '#fff' },
        background: {
          tertiary: { pressed: '#eee' },
          secondary: { pressed: '#ddd' },
          primary: { hover: '#333', pressed: '#222' },
        },
      },
    },
  },
});

afterEach(() => cleanup());

const Providers = ({ children }) => (
  <ThemeProvider theme={theme}>
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={enGB}
    >
      {children}
    </LocalizationProvider>
  </ThemeProvider>
);

// Holds the value like the form does, so a check and an uncheck behave as in the app.
const Harness = ({ initialValue = null, onChange, error }) => {
  const [value, setValue] = useState(initialValue);
  return (
    <Providers>
      <StopOnDateField
        value={value}
        error={error}
        onChange={next => {
          setValue(next);
          onChange?.(next);
        }}
      />
    </Providers>
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

  it('R3.1: a value that arrives after mount checks the box and shows the date', () => {
    const { rerender } = render(
      <StopOnDateField
        value={null}
        onChange={vi.fn()}
      />,
      { wrapper: Providers },
    );

    rerender(
      <StopOnDateField
        value={FUTURE_DATE}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: LABEL })).toBeChecked();
    expect(screen.getByRole('textbox', { name: DATE_LABEL })).toHaveValue('31/12/2999');
  });

  it('R3.2: a value reset to null after mount unchecks the box and hides the field', () => {
    const { rerender } = render(
      <StopOnDateField
        value={FUTURE_DATE}
        onChange={vi.fn()}
      />,
      { wrapper: Providers },
    );

    rerender(
      <StopOnDateField
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: LABEL })).not.toBeChecked();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('R3.1: the date field has the accessible name "Stop date"', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('checkbox', { name: LABEL }));

    expect(screen.getByRole('textbox', { name: DATE_LABEL })).toBeInTheDocument();
  });

  it('R3.1: typing a valid future date passes it as yyyy-MM-dd', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole('checkbox', { name: LABEL }));

    await user.click(screen.getByRole('textbox'));
    await user.keyboard('31122999');

    expect(onChange).toHaveBeenLastCalledWith(FUTURE_DATE);
  });

  it('R3.1 TC-US30-13: the open calendar shows Clear and Apply', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: LABEL }));

    await user.click(screen.getByRole('button', { name: /choose date/i }));

    expect(await screen.findByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });

  it('R3.2 TC-US30-18: Apply commits the picked day as yyyy-MM-dd; a day click alone keeps the popup open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Harness
        initialValue="2090-06-01"
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /choose date/i }));
    await user.click(await screen.findByRole('gridcell', { name: '15' }));

    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onChange).toHaveBeenLastCalledWith('2090-06-15');
  });

  it('R3.3 TC-US30-19: Clear passes null and the box stays checked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Harness
        initialValue={FUTURE_DATE}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /choose date/i }));

    await user.click(await screen.findByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('checkbox', { name: LABEL })).toBeChecked();
  });
});
