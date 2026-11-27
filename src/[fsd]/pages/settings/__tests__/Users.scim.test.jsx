// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import Users from '../Users';

// EL-5202: projects linked to an Entra ID group keep every member action; only members synced from the group
// can't be removed here (they are removed in the IdP), so bulk delete leaves them out.
const server = vi.hoisted(() => ({ list: null, currentUserId: 99 }));

vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { id: server.currentUserId } }) }));
vi.mock('@/api/admin', () => ({
  useUserListQuery: () => server.list,
  useRoleListQuery: () => ({ data: [] }),
  useUserCreateMutation: () => [vi.fn(), {}],
}));
vi.mock('@/[fsd]/shared/lib/hooks', async () => ({
  useDebounceValue: (await import('@/[fsd]/shared/lib/hooks/useDebounceValue.hooks')).useDebounceValue,
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/components/InviteUserDialog', () => ({
  default: ({ open }) => (open ? <div data-testid="invite-dialog" /> : null),
}));
vi.mock('@/[fsd]/features/interactive-tours', () => ({ USERS_TOUR_TARGET_IDS: {} }));
vi.mock('@/[fsd]/features/settings', () => ({
  DrawerPage: ({ children }) => <div>{children}</div>,
  DrawerPageHeader: ({ showAddButton, extraContent }) => (
    <div>
      {showAddButton && <span data-testid="invite-button" />}
      {extraContent}
    </div>
  ),
  EditUsersButton: () => <span data-testid="edit-button" />,
  DeleteUserButton: ({ users, disabled, tooltip }) => (
    <button
      data-testid="delete-button"
      disabled={disabled}
      title={tooltip}
    >
      {users.map(u => u.id).join(',')}
    </button>
  ),
  UsersTable: ({ users, onSelectPage, onSelectRow }) => (
    <div>
      <button
        data-testid="select-all"
        onClick={() => onSelectPage(true)}
      >
        {users.length}
      </button>
      {users.map(user => (
        <button
          key={user.id}
          data-testid={`select-${user.id}`}
          onClick={() => onSelectRow(user, true)}
        />
      ))}
    </div>
  ),
}));

const loaded = {
  data: {
    rows: [
      { id: 1, name: 'Jane', email: 'jane@corp.test', roles: ['viewer'], scim_synced: true },
      { id: 2, name: 'Bob', email: 'bob@corp.test', roles: ['editor'], scim_synced: false },
    ],
    total: 2,
    scim_managed: true,
  },
  isFetching: false,
  isError: false,
};

const renderPage = (path = '/settings/users') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Users />
    </MemoryRouter>,
  );

describe('Settings → Users of a project linked to an Entra ID group', () => {
  afterEach(() => {
    cleanup();
    server.currentUserId = 99;
  });

  it('keeps invite, edit and delete', () => {
    server.list = loaded;
    renderPage();

    expect(screen.getByTestId('invite-button')).toBeInTheDocument();
    expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('delete-button')).toBeInTheDocument();
  });

  it('leaves synced members out of bulk delete', () => {
    server.list = loaded;
    renderPage();

    fireEvent.click(screen.getByTestId('select-all'));
    expect(screen.getByTestId('delete-button')).toHaveTextContent(/^2$/);
  });

  it('opens the invite dialog from ?inviteUsers=1', () => {
    server.list = loaded;
    renderPage('/settings/users?inviteUsers=1');

    expect(screen.getByTestId('invite-dialog')).toBeInTheDocument();
  });

  it('disables bulk delete while the current admin is selected', () => {
    server.list = {
      ...loaded,
      data: {
        ...loaded.data,
        rows: [
          { id: 3, name: 'Me', email: 'me@corp.test', roles: ['admin'], scim_synced: false },
          { id: 2, name: 'Bob', email: 'bob@corp.test', roles: ['editor'], scim_synced: false },
        ],
      },
    };
    server.currentUserId = 3;
    renderPage();

    fireEvent.click(screen.getByTestId('select-2'));
    expect(screen.getByTestId('delete-button')).toBeEnabled();

    fireEvent.click(screen.getByTestId('select-3'));
    expect(screen.getByTestId('delete-button')).toBeDisabled();
    expect(screen.getByTestId('delete-button')).toHaveAttribute(
      'title',
      'You cannot delete yourself while you have the admin role',
    );
  });

  it('keeps bulk delete enabled when the current user selects themselves without the admin role', () => {
    server.list = loaded;
    server.currentUserId = 2;
    renderPage();

    fireEvent.click(screen.getByTestId('select-2'));
    expect(screen.getByTestId('delete-button')).toBeEnabled();
  });
});
