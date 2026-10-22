// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';

import OwnerFilter from '../OwnerFilter';
import { renderWithTheme } from './_testHelpers';

await vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

const mocks = vi.hoisted(() => ({
  useUserList: vi.fn(),
  onLoadMoreUsers: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useUserList: mocks.useUserList,
  useToast: () => ({ toastError: mocks.toastError }),
}));
// The avatar needs the store; the filter test only needs the name
vi.mock('@/components/UserAvatar', () => ({ default: () => null }));

const USERS = [
  { id: 1, name: 'Ann Lee' },
  { id: 2, name: 'Bob Roy' },
];

const setUsers = (overrides = {}) =>
  mocks.useUserList.mockReturnValue({
    onLoadMoreUsers: mocks.onLoadMoreUsers,
    data: { rows: USERS, total: 45 },
    isUsersError: false,
    isUsersFetching: false,
    ...overrides,
  });

const renderFilter = (props = {}) =>
  renderWithTheme(
    <OwnerFilter
      selectedOwners={[]}
      onChangeOwners={vi.fn()}
      {...props}
    />,
  );

const lastQuery = () => mocks.useUserList.mock.calls.at(-1)[0].query;

// Ids apart from USERS, so a picked owner is never replaced by a listed user
const OWNERS = [1, 2, 3, 4].map(n => ({ id: 10 + n, name: `Owner ${n}` }));

const openList = () => {
  const input = screen.getByRole('combobox');
  fireEvent.focus(input);
  fireEvent.mouseDown(input);
};

// The field shows one name chip and, for two or more owners, the "+N" chip
const expectSummary = (name, more) => {
  const chips = screen.getAllByTestId('schedules-owner-chip');
  expect(chips).toHaveLength(1);
  expect(chips[0]).toHaveTextContent(name);
  const moreChip = screen.queryByTestId('schedules-owner-more');
  if (more) expect(moreChip).toHaveTextContent(more);
  else expect(moreChip).not.toBeInTheDocument();
};

describe('OwnerFilter EL-7011 R2.1 R2.2', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setUsers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('R2.1 shows the users and reports a picked owner', () => {
    const onChangeOwners = vi.fn();
    renderFilter({ onChangeOwners });
    const input = screen.getByRole('combobox');
    fireEvent.mouseDown(input);
    fireEvent.click(screen.getByText('Ann Lee'));
    expect(onChangeOwners).toHaveBeenCalledWith([expect.objectContaining({ id: 1 })]);
  });

  it('BUG-13 R2.1 R2.3 EL-7011 four owners show one chip and +3, closed, open and closed again', () => {
    renderFilter({ selectedOwners: OWNERS });
    expectSummary('Owner 1', '+3');
    openList();
    expectSummary('Owner 1', '+3');
    expect(screen.getAllByRole('option', { selected: true })).toHaveLength(4);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expectSummary('Owner 1', '+3');
  });

  it('BUG-13 R2.1 EL-7011 one owner shows one chip and no +N, closed and open', () => {
    renderFilter({ selectedOwners: OWNERS.slice(0, 1) });
    expectSummary('Owner 1', null);
    openList();
    expectSummary('Owner 1', null);
  });

  it('BUG-13 R2.1 EL-7011 no owner shows the placeholder and no chip, closed and open', () => {
    renderFilter();
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    openList();
    expect(screen.queryByTestId('schedules-owner-chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('schedules-owner-more')).not.toBeInTheDocument();
  });

  it('BUG-13 R2.1 EL-7011 the x on the chip removes the first owner and the next one moves in', () => {
    const onChangeOwners = vi.fn();
    const { rerender } = renderFilter({ selectedOwners: OWNERS, onChangeOwners });
    fireEvent.click(screen.getByTestId('schedules-owner-chip').querySelector('.MuiChip-deleteIcon'));
    const remaining = onChangeOwners.mock.calls.at(-1)[0];
    expect(remaining.map(owner => owner.id)).toEqual([12, 13, 14]);
    rerender(
      <ThemeProvider theme={createTheme({ palette: lightPalette })}>
        <OwnerFilter
          selectedOwners={remaining}
          onChangeOwners={onChangeOwners}
        />
      </ThemeProvider>,
    );
    expectSummary('Owner 2', '+2');
  });

  it.each([
    ['Backspace', 'the chip has the DOM focus', false],
    ['Backspace', 'ArrowLeft moved the focus into the chip', true],
    ['Delete', 'the chip has the DOM focus', false],
    ['Delete', 'ArrowLeft moved the focus into the chip', true],
  ])('BUG-40 R2.1 EL-7011 %s removes only that chip when %s', (key, _title, useArrowLeft) => {
    const onChangeOwners = vi.fn();
    renderFilter({ selectedOwners: OWNERS.slice(0, 2), onChangeOwners });
    const chip = screen.getByTestId('schedules-owner-chip');
    if (useArrowLeft) fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowLeft' });
    else chip.focus();
    fireEvent.keyDown(chip, { key });
    fireEvent.keyUp(chip, { key });
    expect(onChangeOwners).toHaveBeenCalledTimes(1);
    expect(onChangeOwners.mock.calls[0][0].map(owner => owner.id)).toEqual([12]);
  });

  it('BUG-13 R2.1 EL-7011 the +N chip names the other owners in its tooltip and label', () => {
    renderFilter({ selectedOwners: OWNERS });
    const more = screen.getByTestId('schedules-owner-more');
    expect(more).toHaveAttribute('tabindex', '0');
    expect(more).toHaveAttribute('aria-label', '3 more owners: Owner 2, Owner 3, Owner 4');
    expect(more.querySelector('.MuiChip-deleteIcon')).toBeNull();
    fireEvent.mouseOver(more);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const tooltip = screen.getByRole('tooltip');
    ['Owner 2', 'Owner 3', 'Owner 4'].forEach(name => expect(tooltip).toHaveTextContent(name));
    expect(tooltip).not.toHaveTextContent('Owner 1');
  });

  it('TC-US27-08 R2.2 sends the typed text as query after 300 ms', () => {
    renderFilter();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ann' } });
    expect(lastQuery()).toBe('');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(lastQuery()).toBe('ann');
  });

  it.each([
    ['loads the next page at the end of the list', 45, 1],
    ['does not load more when every user is loaded', 2, 0],
  ])('TC-US27-09 R2.2 %s', (_title, total, loadMoreCalls) => {
    setUsers({ data: { rows: USERS, total } });
    renderFilter();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');
    Object.defineProperties(listbox, {
      scrollTop: { value: 100, configurable: true },
      clientHeight: { value: 100, configurable: true },
      scrollHeight: { value: 200, configurable: true },
    });
    fireEvent.scroll(listbox);
    expect(mocks.onLoadMoreUsers).toHaveBeenCalledTimes(loadMoreCalls);
  });

  it('TC-US27-10 R2.2 keeps the loaded users and shows a toast when a request fails', () => {
    setUsers({ isUsersError: true, usersError: { status: 500 } });
    renderFilter();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(mocks.toastError).toHaveBeenCalled();
    expect(screen.getByText('Ann Lee')).toBeInTheDocument();
  });
});
