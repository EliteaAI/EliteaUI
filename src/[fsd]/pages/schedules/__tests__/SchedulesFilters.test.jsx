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

// The owner filter has its own test; here only its presence, its callback and the input box the bar styles matter
vi.mock('../OwnerFilter', () => ({
  default: ({ selectedOwners, onChangeOwners }) => (
    <div className="MuiAutocomplete-root">
      <div
        className="MuiAutocomplete-inputRoot"
        data-testid="owner-input-root"
      >
        <div
          className="MuiChip-root"
          data-testid="owner-chip"
        >
          <span className="MuiChip-label">A very long owner name that does not fit</span>
        </div>
        <div
          className="MuiAutocomplete-input"
          data-testid="owner-input"
        />
        <button
          type="button"
          data-testid="owner-filter"
          onClick={() => onChangeOwners([{ id: 'a' }, { id: 'b' }])}
        >
          owners {selectedOwners.length}
        </button>
      </div>
    </div>
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

describe('SchedulesFilters', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('picking a type emits entityType', () => {
    const onChange = renderBar();
    pick('type', 'Pipeline');
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, entityType: 'pipeline' });
  });

  it('picking a status emits status', () => {
    const onChange = renderBar();
    pick('status', 'Failed');
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, status: 'failed' });
  });

  it('the approval wait option reads "Waiting for input" and emits waiting_for_approval', () => {
    const onChange = renderBar();
    pick('status', 'Waiting for input');
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, status: 'waiting_for_approval' });
  });

  it('picking an enabled state emits a boolean, and "All" clears it', () => {
    const onChange = renderBar();
    pick('enabled', 'No');
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY, enabled: false });
    cleanup();
    const onChangeAll = renderBar({ value: { ...EMPTY, enabled: false } });
    pick('enabled', 'All');
    expect(onChangeAll).toHaveBeenCalledWith({ ...EMPTY, enabled: '' });
  });

  it('typing emits search once, 300 ms after the last key', () => {
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

  it('an admin sees the Owner filter and its picks emit ownerIds', () => {
    const onChange = renderBar();
    fireEvent.click(screen.getByTestId('owner-filter'));
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, ownerIds: ['a', 'b'] });
  });

  it('the Owner input has the height and inner paddings of the Type select', () => {
    renderBar();
    const owner = getComputedStyle(screen.getByTestId('owner-input-root'));
    const type = getComputedStyle(
      within(screen.getByTestId('schedules-filter-type')).getByRole('combobox').closest('.MuiInputBase-root'),
    );
    expect(owner.flexWrap).toBe('nowrap');
    expect(type.height).toBe('1.88rem');
    for (const side of ['height', 'paddingTop', 'paddingBottom', 'paddingLeft']) {
      expect(owner[side], side).toBe(type[side]);
    }
  });

  it('a long owner name ends with an ellipsis and the input keeps room to type', () => {
    renderBar();
    const chip = screen.getByTestId('owner-chip');
    const label = getComputedStyle(chip.firstElementChild);
    expect(getComputedStyle(chip).maxWidth).toBe('7rem');
    expect(label.overflow).toBe('hidden');
    expect(label.textOverflow).toBe('ellipsis');
    expect(getComputedStyle(screen.getByTestId('owner-input')).minWidth).toBe('1rem');
  });

  it('a regular user sees no Owner filter', () => {
    renderBar({ isAdmin: false });
    expect(screen.queryByTestId('owner-filter')).not.toBeInTheDocument();
  });

  it('TC-US35-18 hides the Type filter while the entity chip shows', () => {
    renderBar({ hideEntityType: true });
    expect(screen.queryByTestId('schedules-filter-type')).not.toBeInTheDocument();
    expect(screen.getByTestId('schedules-filter-status')).toBeInTheDocument();
  });

  it('the bar has only Type, Status, Enabled, search and Owner', () => {
    renderBar();
    expect(screen.getAllByRole('combobox')).toHaveLength(3);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByTestId('owner-filter')).toBeInTheDocument();
    expect(screen.queryByText(/tag/i)).not.toBeInTheDocument();
  });

  it('every control has an accessible name', () => {
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

  it('the title, then the controls in column order: Search, Type, Status, Owner, Enabled', () => {
    renderBar({ hasFilters: true });
    const bar = screen.getByRole('group', { name: 'Schedule filters' });
    const ids = [...bar.children].map(child => child.dataset.testid ?? child.getAttribute('aria-label'));
    expect(ids.slice(2)).toEqual([
      'schedules-filter-type',
      'schedules-filter-status',
      'Owner',
      'schedules-filter-enabled',
      'schedules-filters-clear',
    ]);
  });

  it('"Clear filters" shows only while a filter is set', () => {
    renderBar();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    cleanup();
    renderBar({ hasFilters: true });
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('"Clear filters" empties the search and the owners and focuses the search', () => {
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

  it('Escape in the search empties it', () => {
    const onChange = renderBar({ value: { ...EMPTY, search: 'nightly' } });
    const input = screen.getByRole('textbox', { name: 'Search schedules' });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
    act(() => vi.advanceTimersByTime(300));
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, search: '' });
  });

  it('shows the "Filters:" title before the controls', () => {
    renderBar();
    const group = screen.getByRole('group', { name: 'Schedule filters' });
    expect(group.firstElementChild).toHaveTextContent('Filters:');
  });
});
