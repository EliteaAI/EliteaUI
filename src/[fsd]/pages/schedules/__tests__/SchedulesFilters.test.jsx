// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import SchedulesFilters from '../SchedulesFilters';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// The owner filter has its own test; here only its presence and its callback matter
vi.mock('../OwnerFilter', () => ({
  default: ({ selectedOwners, onChangeOwners }) => (
    <button
      type="button"
      data-testid="owner-filter"
      onClick={() => onChangeOwners([{ id: 'a' }, { id: 'b' }])}
    >
      owners {selectedOwners.length}
    </button>
  ),
}));

const EMPTY = { entityType: '', status: '', enabled: '', search: '', ownerIds: [] };

const renderBar = (props = {}) => {
  const onChange = vi.fn();
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <SchedulesFilters
        value={EMPTY}
        onChange={onChange}
        isAdmin
        {...props}
      />
    </ThemeProvider>,
  );
  return onChange;
};

const pick = (selectLabel, optionName) => {
  fireEvent.mouseDown(within(screen.getByTestId(`schedules-filter-${selectLabel}`)).getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: optionName }));
};

describe('EL-7011 US-27 SchedulesFilters', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('R1.1 EL-7011: picking a type emits entityType', () => {
    const onChange = renderBar();
    pick('type', 'Pipeline');
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, entityType: 'pipeline' });
  });

  it('R1.1 EL-7011: picking a status emits status', () => {
    const onChange = renderBar();
    pick('status', 'Failed');
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, status: 'failed' });
  });

  it('R1.1 EL-7011: picking an enabled state emits a boolean, and "All" clears it', () => {
    const onChange = renderBar();
    pick('enabled', 'No');
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY, enabled: false });
    cleanup();
    const onChangeAll = renderBar({ value: { ...EMPTY, enabled: false } });
    pick('enabled', 'All');
    expect(onChangeAll).toHaveBeenCalledWith({ ...EMPTY, enabled: '' });
  });

  it('R1.2 EL-7011: typing emits search once, 300 ms after the last key', () => {
    const onChange = renderBar();
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'n' } });
    fireEvent.change(input, { target: { value: 'nightly' } });
    act(() => vi.advanceTimersByTime(299));
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, search: 'nightly' });
  });

  it('R2.1 EL-7011: an admin sees the Owner filter and its picks emit ownerIds', () => {
    const onChange = renderBar();
    fireEvent.click(screen.getByTestId('owner-filter'));
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, ownerIds: ['a', 'b'] });
  });

  it('R2.4 EL-7011: a regular user sees no Owner filter', () => {
    renderBar({ isAdmin: false });
    expect(screen.queryByTestId('owner-filter')).not.toBeInTheDocument();
  });

  it('R3.1 EL-7011: the bar has only Type, Status, Enabled, search and Owner', () => {
    renderBar();
    expect(screen.getAllByRole('combobox')).toHaveLength(3);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByTestId('owner-filter')).toBeInTheDocument();
    expect(screen.queryByText(/tag/i)).not.toBeInTheDocument();
  });
});
