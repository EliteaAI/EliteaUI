// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import Users from '../Users';

// EL-5202: members of SCIM-managed projects follow the IdP group, so the page offers no invite or removal;
// roles can still be edited.
const server = vi.hoisted(() => ({ list: null }));

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
  DeleteUserButton: () => <span data-testid="delete-button" />,
  UsersTable: ({ canDeleteUsers }) => <span data-testid="table-can-delete">{String(canDeleteUsers)}</span>,
}));

const loaded = scimManaged => ({
  data: {
    rows: [{ id: 1, name: 'Jane', email: 'jane@corp.test', roles: ['viewer'] }],
    total: 1,
    scim_managed: scimManaged,
  },
  isFetching: false,
  isError: false,
});
const loading = { data: undefined, isFetching: true, isError: false };

const renderPage = (path = '/settings/users') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Users />
    </MemoryRouter>,
  );

describe('Settings → Users of a SCIM-managed project', () => {
  afterEach(cleanup);

  it('hides invite and delete but keeps role editing', () => {
    server.list = loaded(true);
    renderPage();

    expect(screen.queryByTestId('invite-button')).toBeNull();
    expect(screen.queryByTestId('delete-button')).toBeNull();
    expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('table-can-delete')).toHaveTextContent('false');
  });

  it('keeps every action for a normal project', () => {
    server.list = loaded(false);
    renderPage();

    expect(screen.getByTestId('invite-button')).toBeInTheDocument();
    expect(screen.getByTestId('delete-button')).toBeInTheDocument();
    expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('table-can-delete')).toHaveTextContent('true');
  });

  it('does not open the invite dialog from ?inviteUsers=1 before the list loads, nor for a SCIM project', () => {
    server.list = loading;
    const { rerender } = renderPage('/settings/users?inviteUsers=1');
    expect(screen.queryByTestId('invite-dialog')).toBeNull();

    server.list = loaded(true);
    rerender(
      <MemoryRouter initialEntries={['/settings/users?inviteUsers=1']}>
        <Users />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('invite-dialog')).toBeNull();
  });

  it('opens the invite dialog from ?inviteUsers=1 for a normal project once loaded', () => {
    server.list = loaded(false);
    renderPage('/settings/users?inviteUsers=1');

    expect(screen.getByTestId('invite-dialog')).toBeInTheDocument();
  });
});
