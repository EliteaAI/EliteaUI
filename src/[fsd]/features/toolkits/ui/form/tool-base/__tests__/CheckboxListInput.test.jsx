// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import CheckboxListInput from '../CheckboxListInput';

vi.mock('@/[fsd]/shared/ui', () => ({
  Checkbox: {
    BaseCheckbox: props => (
      <input
        type="checkbox"
        data-testid={props['data-testid']}
        checked={props.checked}
        disabled={props.disabled}
        onChange={event => props.onChange(event, event.target.checked)}
      />
    ),
  },
}));
vi.mock('@/[fsd]/shared/ui/tooltip/InfoTooltip', () => ({
  default: props => <span data-testid={props.testId}>{props.infoTooltip}</span>,
}));

const OPTIONS = [
  { value: 'Mail.Read', label: 'Mail.Read', description: 'Read your mail' },
  { value: 'Mail.ReadWrite', label: 'Mail.ReadWrite', description: 'Change and delete your mail' },
  { value: 'Mail.Send', label: 'Mail.Send', description: 'Send mail as you' },
];

const editField = vi.fn();

const renderInput = props =>
  render(
    <ThemeProvider theme={createTheme()}>
      <CheckboxListInput
        k="scopes"
        options={OPTIONS}
        defaultValue={['Mail.Read']}
        label="Scopes"
        editField={editField}
        fieldPath="settings.scopes"
        {...props}
      />
    </ThemeProvider>,
  );

const box = value => screen.getByTestId(`toolkit-field-scopes-option-${value}`);

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('CheckboxListInput', () => {
  it('ticks the schema default when nothing is saved', () => {
    renderInput({ value: undefined });

    expect(box('Mail.Read')).toBeChecked();
    expect(box('Mail.Send')).not.toBeChecked();
  });

  it('ticks saved values and ignores values that are not options', () => {
    renderInput({ value: 'mail.send offline_access' });

    expect(box('Mail.Send')).toBeChecked();
    expect(box('Mail.Read')).not.toBeChecked();
  });

  it('shows a tooltip for every option', () => {
    renderInput({ value: ['Mail.Read'] });

    expect(screen.getByTestId('toolkit-field-scopes-option-Mail.Send-info')).toHaveTextContent(
      'Send mail as you',
    );
  });

  it('saves the ticked values in option order', () => {
    renderInput({ value: ['Mail.Send'] });

    fireEvent.click(box('Mail.Read'));

    expect(editField).toHaveBeenCalledWith('settings.scopes', ['Mail.Read', 'Mail.Send']);
  });

  it('keeps the last ticked box ticked', () => {
    renderInput({ value: ['Mail.Read'] });

    expect(box('Mail.Read')).toBeDisabled();
    expect(box('Mail.Send')).not.toBeDisabled();
  });

  it('disables every box when the field is disabled', () => {
    renderInput({ value: ['Mail.Read', 'Mail.Send'], disabled: true });

    OPTIONS.forEach(option => expect(box(option.value)).toBeDisabled());
  });
});
