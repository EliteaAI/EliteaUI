// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import PopoverSelect from '../PopoverSelect';

// A plain button so the assertions are about what PopoverSelect forwards, not about BaseBtn.
vi.mock('@/[fsd]/shared/ui', async () => {
  const { forwardRef } = await import('react');

  const BaseBtn = forwardRef((props, ref) => (
    <button
      ref={ref}
      type="button"
      data-testid={props['data-testid']}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ));
  BaseBtn.displayName = 'BaseBtn';

  return { Button: { BaseBtn } };
});

vi.mock('@/[fsd]/shared/ui/input/SimpleSearchBar', () => ({ default: () => null }));

afterEach(() => cleanup());

const theme = createTheme({
  palette: {
    border: { lines: '#333' },
    background: { secondary: '#111' },
  },
});

const options = [
  { label: 'Search Index', value: 'search_index' },
  { label: 'Stepback Search Index', value: 'stepback_search_index' },
];

const renderSelect = props =>
  render(
    <ThemeProvider theme={theme}>
      <PopoverSelect
        data-testid="tool-picker"
        options={options}
        onValueChange={() => {}}
        label="Select Tool"
        {...props}
      />
    </ThemeProvider>,
  );

describe('PopoverSelect', () => {
  it('opens the option list by default', () => {
    renderSelect();

    fireEvent.click(screen.getByTestId('tool-picker'));

    expect(screen.getByTestId('select-option-search_index')).toBeInTheDocument();
  });

  it('cannot be opened when disabled', () => {
    const onValueChange = vi.fn();
    renderSelect({ disabled: true, onValueChange });

    const trigger = screen.getByTestId('tool-picker');

    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);

    expect(screen.queryByTestId('select-option-search_index')).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
