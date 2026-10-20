// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';

import SchedulesFilters from '../SchedulesFilters';
import { renderWithTheme } from './_testHelpers';

await vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
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
  renderWithTheme(
    <SchedulesFilters
      value={EMPTY}
      onChange={onChange}
      onClear={vi.fn()}
      hasFilters={false}
      isAdmin
      {...props}
    />,
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

  it('EL-7011: every control has an accessible name', () => {
    renderBar();
    expect(screen.getByRole('group', { name: 'Schedule filters' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search schedules' })).toBeInTheDocument();
    ['Type', 'Status', 'Enabled'].forEach(name =>
      expect(screen.getByRole('combobox', { name })).toBeInTheDocument(),
    );
    expect(screen.getByRole('group', { name: 'Owner' })).toBeInTheDocument();
    cleanup();
    renderBar({ value: { ...EMPTY, entityType: 'pipeline' } });
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveTextContent('Pipeline');
  });

  it('EL-7011: the controls follow the column order: Search, Type, Status, Owner, Enabled', () => {
    renderBar({ hasFilters: true });
    const bar = screen.getByRole('group', { name: 'Schedule filters' });
    const ids = [...bar.children].map(child => child.dataset.testid ?? child.getAttribute('aria-label'));
    expect(ids.slice(1)).toEqual([
      'schedules-filter-type',
      'schedules-filter-status',
      'Owner',
      'schedules-filter-enabled',
      'schedules-filters-clear',
    ]);
  });

  it('EL-7011: "Clear filters" shows only while a filter is set', () => {
    renderBar();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    cleanup();
    renderBar({ hasFilters: true });
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('R1.3 EL-7011: "Clear filters" empties the search and the owners and focuses the search', () => {
    const onClear = vi.fn();
    const onChange = renderBar({ hasFilters: true, onClear });
    const input = screen.getByRole('textbox', { name: 'Search schedules' });
    fireEvent.change(input, { target: { value: 'nightly' } });
    fireEvent.click(screen.getByTestId('owner-filter'));
    expect(screen.getByTestId('owner-filter')).toHaveTextContent('owners 2');
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.getByTestId('owner-filter')).toHaveTextContent('owners 0');
    // The pending search is dropped, so it cannot bring the old text back
    onChange.mockClear();
    act(() => vi.advanceTimersByTime(300));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('R1.2 EL-7011: Escape in the search empties it', () => {
    const onChange = renderBar({ value: { ...EMPTY, search: 'nightly' } });
    const input = screen.getByRole('textbox', { name: 'Search schedules' });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
    act(() => vi.advanceTimersByTime(300));
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, search: '' });
  });
});
