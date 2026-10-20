// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import OwnerFilter from '../OwnerFilter';

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
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <OwnerFilter
        selectedOwners={[]}
        onChangeOwners={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

const lastQuery = () => mocks.useUserList.mock.calls.at(-1)[0].query;

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

  it('TC-US27-08 R2.2 sends the typed text as query after 300 ms', () => {
    renderFilter();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ann' } });
    expect(lastQuery()).toBe('');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(lastQuery()).toBe('ann');
  });

  it('TC-US27-09 R2.2 loads the next page at the end of the list', () => {
    renderFilter();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');
    Object.defineProperties(listbox, {
      scrollTop: { value: 100, configurable: true },
      clientHeight: { value: 100, configurable: true },
      scrollHeight: { value: 200, configurable: true },
    });
    fireEvent.scroll(listbox);
    expect(mocks.onLoadMoreUsers).toHaveBeenCalledTimes(1);
  });

  it('TC-US27-09 R2.2 does not load more when every user is loaded', () => {
    setUsers({ data: { rows: USERS, total: 2 } });
    renderFilter();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');
    Object.defineProperties(listbox, {
      scrollTop: { value: 100, configurable: true },
      clientHeight: { value: 100, configurable: true },
      scrollHeight: { value: 200, configurable: true },
    });
    fireEvent.scroll(listbox);
    expect(mocks.onLoadMoreUsers).not.toHaveBeenCalled();
  });

  it('TC-US27-10 R2.2 keeps the loaded users and shows a toast when a request fails', () => {
    setUsers({ isUsersError: true, usersError: { status: 500 } });
    renderFilter();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(mocks.toastError).toHaveBeenCalled();
    expect(screen.getByText('Ann Lee')).toBeInTheDocument();
  });
});
