// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import Users from '../Users';

const server = vi.hoisted(() => ({ users: [], requests: [] }));

const listUsers = ({ page, pageSize, params }) => {
  server.requests.push({ page, pageSize, ...params });
  const needle = (params?.query ?? '').toLowerCase();
  const matches = server.users.filter(
    user =>
      !needle ||
      user.name.toLowerCase().includes(needle) ||
      user.email.toLowerCase().includes(needle) ||
      (params?.match_roles && user.roles.some(role => role.toLowerCase().includes(needle))),
  );
  return { rows: matches.slice(0, (page + 1) * pageSize), total: matches.length };
};

vi.mock('@/api/admin', () => ({
  useUserListQuery: args => ({ data: listUsers(args), isFetching: false, isError: false }),
  useRoleListQuery: () => ({ data: [] }),
  useUserCreateMutation: () => [vi.fn(), {}],
}));
vi.mock('@/[fsd]/shared/lib/hooks', async () => ({
  useDebounceValue: (await import('@/[fsd]/shared/lib/hooks/useDebounceValue.hooks')).useDebounceValue,
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/components/InviteUserDialog', () => ({ default: () => null }));
vi.mock('@/[fsd]/features/interactive-tours', () => ({ USERS_TOUR_TARGET_IDS: {} }));
vi.mock('@/[fsd]/features/settings', () => ({
  DrawerPage: ({ children }) => <div>{children}</div>,
  DrawerPageHeader: ({ slotProps }) => (
    <input
      data-testid="users-search-input"
      value={slotProps.searchInput.search}
      onChange={event => slotProps.searchInput.onChangeSearch(event.target.value)}
    />
  ),
  EditUsersButton: () => null,
  DeleteUserButton: () => null,
  UsersTable: ({ users, total, page, onPageChange }) => (
    <div>
      <span data-testid="total">{total}</span>
      {users.length ? users.map(user => <span key={user.id}>{user.name}</span>) : 'No users'}
      <button onClick={() => onPageChange(null, page + 1)}>next</button>
    </div>
  ),
}));

const makeUser = id => ({
  id,
  name: `Member ${String(id).padStart(2, '0')}`,
  email: `member${id}@corp.test`,
  roles: [id === 25 ? 'editor' : 'viewer'],
});

const search = async value => {
  fireEvent.change(screen.getByTestId('users-search-input'), { target: { value } });
  await act(() => vi.advanceTimersByTimeAsync(300));
};

describe('Settings → Users search', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    server.users = Array.from({ length: 25 }, (_, index) => makeUser(index + 1));
    server.requests = [];
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>,
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('finds a user who is not on the first loaded page', async () => {
    expect(screen.queryByText('Member 24')).toBeNull();

    await search('member 24');

    expect(screen.getByText('Member 24')).toBeInTheDocument();
    expect(screen.getByTestId('total')).toHaveTextContent('1');
    expect(server.requests.at(-1)).toEqual({ page: 0, pageSize: 20, query: 'member 24', match_roles: true });
  });

  it('finds a user by role across the whole project', async () => {
    await search('EDITOR');

    expect(screen.getByText('Member 25')).toBeInTheDocument();
    expect(screen.getByTestId('total')).toHaveTextContent('1');
  });

  it('shows No users only when nothing in the project matches', async () => {
    await search('nobody-here');

    expect(screen.getByText('No users')).toBeInTheDocument();
    expect(screen.getByTestId('total')).toHaveTextContent('0');
  });

  it('pages through search results with the same query', async () => {
    await search('member');
    fireEvent.click(screen.getByText('next'));

    expect(server.requests.at(-1)).toEqual({ page: 1, pageSize: 20, query: 'member', match_roles: true });
    expect(screen.getByText('Member 21')).toBeInTheDocument();
    expect(screen.queryByText('Member 01')).toBeNull();
  });

  it('sends one request for a new search made past the first page', async () => {
    await search('member');
    fireEvent.click(screen.getByText('next'));
    const sentBefore = server.requests.length;

    await search('member 2');

    const sent = server.requests.slice(sentBefore);
    expect(sent.filter(request => request.query === 'member' && request.page === 0)).toEqual([]);
    expect(sent.filter(request => request.query === 'member 2' && request.page !== 0)).toEqual([]);
    expect(sent.at(-1)).toEqual({ page: 0, pageSize: 20, query: 'member 2', match_roles: true });
    expect(screen.getByText('Member 20')).toBeInTheDocument();
  });

  it('restores the full list when the search is cleared', async () => {
    await search('member 24');
    await search('');

    expect(screen.getByTestId('total')).toHaveTextContent('25');
    expect(server.requests.at(-1)).toEqual({ page: 0, pageSize: 20, query: '', match_roles: true });
  });
});
