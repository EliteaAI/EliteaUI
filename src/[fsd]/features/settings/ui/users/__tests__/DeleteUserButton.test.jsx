// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import DeleteUserButton from '../DeleteUserButton';

const { deleteUser, unwrap, toastError, toastSuccess, dispatch, setProject, navigate } = vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
  const unwrapMock = vi.fn();
  return {
    unwrap: unwrapMock,
    deleteUser: vi.fn(() => ({ unwrap: unwrapMock })),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
    dispatch: vi.fn(),
    navigate: vi.fn(),
    setProject: vi.fn(payload => ({ type: 'settings/setProject', payload })),
  };
});

vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useSelector: selector => selector({ user: { id: 1, personal_project_id: 77 } }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@/routes', () => ({ default: { SettingsProjectGeneral: '/settings/project-general' } }));
vi.mock('@/slices/settings.js', () => ({ actions: { setProject } }));

vi.mock('@/api/admin', () => ({
  useUserDeleteMutation: () => [deleteUser, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 406,
  useToast: () => ({ toastError, toastSuccess }),
}));
vi.mock('@/common/utils', () => ({ buildErrorMessage: error => error?.data?.error || 'error' }));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@/components/Chat/StyledComponents', () => ({ StyledCircleProgress: () => null }));
vi.mock('@/components/Icons/DeleteIcon', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui', () => ({
  Modal: {
    DeleteEntityModal: ({ open, onConfirm }) =>
      open ? (
        <button
          data-testid="confirm-delete"
          onClick={onConfirm}
        />
      ) : null,
  },
}));

const theme = createTheme({ palette: lightPalette });

const USER = { id: 994, name: 'samvel test' };

const renderButton = props =>
  render(
    <ThemeProvider theme={theme}>
      <DeleteUserButton
        testId="delete-button"
        {...props}
      />
    </ThemeProvider>,
  );

const confirmDelete = async () => {
  fireEvent.click(screen.getByTestId('delete-button'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('confirm-delete'));
  });
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('DeleteUserButton', () => {
  it('deletes once and does not repeat the success handling when the selection is cleared', async () => {
    unwrap.mockResolvedValue(null);
    const setSelectedUsers = vi.fn();
    const { rerender } = renderButton({ users: [USER], setSelectedUsers });

    await confirmDelete();

    expect(deleteUser).toHaveBeenCalledTimes(1);
    expect(deleteUser).toHaveBeenCalledWith({ projectId: 406, removesSelf: false, params: { ids: [994] } });
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalledWith('The samvel test user has been successfully deleted.');
    expect(setSelectedUsers).toHaveBeenCalledTimes(1);
    expect(setSelectedUsers).toHaveBeenCalledWith([]);

    // The page passes a fresh empty selection back after clearing it
    rerender(
      <ThemeProvider theme={theme}>
        <DeleteUserButton
          testId="delete-button"
          users={[]}
          setSelectedUsers={setSelectedUsers}
        />
      </ThemeProvider>,
    );
    rerender(
      <ThemeProvider theme={theme}>
        <DeleteUserButton
          testId="delete-button"
          users={[]}
          setSelectedUsers={setSelectedUsers}
        />
      </ThemeProvider>,
    );

    expect(deleteUser).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(setSelectedUsers).toHaveBeenCalledTimes(1);
  });

  it('shows an error and keeps the selection when the delete fails', async () => {
    unwrap.mockRejectedValue({ status: 403, data: { error: 'Forbidden' } });
    const setSelectedUsers = vi.fn();
    renderButton({ users: [USER, { id: 995, name: 'other' }], setSelectedUsers });

    await confirmDelete();

    expect(deleteUser).toHaveBeenCalledWith({
      projectId: 406,
      removesSelf: false,
      params: { ids: [994, 995] },
    });
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith('Forbidden');
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(setSelectedUsers).not.toHaveBeenCalled();
  });

  it('leaves for the private project instead of refetching when the user removes themselves', async () => {
    unwrap.mockResolvedValue(null);
    const setSelectedUsers = vi.fn();
    renderButton({ users: [{ id: 1, name: 'me' }], setSelectedUsers });

    await confirmDelete();

    expect(deleteUser).toHaveBeenCalledWith({
      projectId: 406,
      removesSelf: true,
      params: { ids: [1] },
    });
    expect(setProject).toHaveBeenCalledWith({ id: 77, name: 'Private' });
    expect(navigate).toHaveBeenCalledWith('/settings/project-general', { replace: true });
    expect(toastError).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(setSelectedUsers).not.toHaveBeenCalled();
  });
});
