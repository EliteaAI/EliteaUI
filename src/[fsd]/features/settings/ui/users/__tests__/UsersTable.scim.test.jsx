// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import UsersTable from '../UsersTable';

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// EL-5202: members synced from an Entra ID group are marked and can't be removed from the row actions.
vi.mock('react-redux', () => ({ useSelector: () => false }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/[fsd]/features/interactive-tours', () => ({ USERS_TOUR_TARGET_IDS: {} }));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useGetWindowWidth: () => ({ windowWidth: 1600 }),
}));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('../EditUsersButton', () => ({ default: () => <span data-testid="row-edit" /> }));
vi.mock('../DeleteUserButton', () => ({ default: () => <span data-testid="row-delete" /> }));

const USERS = [
  { id: 1, name: 'Jane', email: 'jane@corp.test', roles: ['viewer'], last_login: null, scim_synced: true },
  { id: 2, name: 'Bob', email: 'bob@corp.test', roles: ['editor'], last_login: null, scim_synced: false },
];

const renderTable = () =>
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <UsersTable
        users={USERS}
        total={2}
        rowsPerPage={20}
        page={0}
        onChangePageSize={vi.fn()}
        onPageChange={vi.fn()}
        isFetching={false}
        onSelectPage={vi.fn()}
        onSelectRow={vi.fn()}
        rolesOptions={[]}
        setSelectedUsers={vi.fn()}
      />
    </ThemeProvider>,
  );

describe('UsersTable synced members', () => {
  afterEach(cleanup);

  it('marks synced members and offers no delete for them', () => {
    renderTable();
    const rowOf = name => screen.getAllByTestId('user-row').find(row => row.textContent.includes(name));
    const jane = rowOf('Jane');
    const bob = rowOf('Bob');

    expect(within(jane).getByTestId('user-row-synced-icon')).toBeInTheDocument();
    expect(within(jane).queryByTestId('row-delete')).toBeNull();
    expect(within(jane).getByTestId('row-edit')).toBeInTheDocument();

    expect(within(bob).queryByTestId('user-row-synced-icon')).toBeNull();
    expect(within(bob).getByTestId('row-delete')).toBeInTheDocument();
  });
});
