// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import * as toolkitApi from '@/api/toolkits';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import AppDetailActions from '../AppDetailActions';

const mocks = vi.hoisted(() => ({
  deleteToolkit: vi.fn(),
  navigate: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  checkPermission: vi.fn(),
  isPrivate: false,
  isLoading: false,
  skipDeleteConfirmation: false,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));
vi.mock('@/[fsd]/shared/config/store', () => ({ default: {} }));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useProjectType: () => ({ isPrivate: mocks.isPrivate }),
  useSelectedProjectId: () => 7,
  useToast: () => ({ toastError: mocks.toastError, toastSuccess: mocks.toastSuccess }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useDeleteConfirmationDisabled.hooks', () => ({
  useDeleteConfirmationDisabled: () => mocks.skipDeleteConfirmation,
}));
vi.mock('@/components/Icons/DeleteIcon', () => ({ default: () => null }));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: mocks.checkPermission }),
}));

const theme = createTheme(getDesignTokens('light'));

const renderActions = () =>
  render(
    <ThemeProvider theme={theme}>
      <AppDetailActions
        appId="app-1"
        appName="Inventory"
      />
    </ThemeProvider>,
  );

const openActionsMenu = () => fireEvent.click(screen.getByTestId('app-detail-actions-menu-button'));
const selectDelete = () => {
  openActionsMenu();
  fireEvent.click(screen.getByTestId('app-detail-delete-application-menuitem'));
};
const confirmDelete = () => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Inventory' } });
  fireEvent.click(screen.getByTestId('delete-confirm-button'));
};

describe('AppDetailActions', () => {
  beforeEach(() => {
    vi.spyOn(toolkitApi, 'useToolkitDeleteMutation').mockReturnValue([
      mocks.deleteToolkit,
      { isLoading: mocks.isLoading },
    ]);
    mocks.deleteToolkit.mockReset();
    mocks.deleteToolkit.mockReturnValue({ unwrap: () => Promise.resolve() });
    mocks.navigate.mockReset();
    mocks.toastError.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.checkPermission.mockReset();
    mocks.checkPermission.mockReturnValue(false);
    mocks.isPrivate = false;
    mocks.isLoading = false;
    mocks.skipDeleteConfirmation = false;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps delete unavailable without permission and enables it with the existing toolkit delete permission', () => {
    const { unmount } = renderActions();
    expect(screen.queryByTestId('app-detail-actions-menu-button')).not.toBeInTheDocument();

    unmount();
    mocks.checkPermission.mockReturnValue(true);
    renderActions();

    openActionsMenu();
    expect(screen.getByTestId('app-detail-delete-application-menuitem')).toHaveTextContent(
      'Delete application',
    );
  });

  it('requires the app name by default and can be canceled', () => {
    mocks.isPrivate = true;
    renderActions();

    selectDelete();

    expect(screen.getByTestId('delete-confirm-entity-name')).toHaveTextContent('Inventory');
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'incorrect' } });
    expect(screen.getByTestId('delete-confirm-button')).toBeDisabled();
    expect(mocks.deleteToolkit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('delete-confirm-cancel-button'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.deleteToolkit).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('deletes without a dialog when the project skips delete confirmations', async () => {
    mocks.isPrivate = true;
    mocks.skipDeleteConfirmation = true;
    renderActions();

    openActionsMenu();
    await act(async () => {
      fireEvent.click(screen.getByTestId('app-detail-delete-application-menuitem'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.deleteToolkit).toHaveBeenCalledExactlyOnceWith({ projectId: 7, toolkitId: 'app-1' });
    expect(mocks.navigate).toHaveBeenCalledWith('/apps/all', { replace: true });
  });

  it('shows success and returns to the Applications list only after deletion completes', async () => {
    mocks.isPrivate = true;
    const { promise: deletion, resolve: completeDeletion } = Promise.withResolvers();
    mocks.deleteToolkit.mockReturnValue({ unwrap: () => deletion });
    renderActions();

    selectDelete();
    confirmDelete();

    expect(mocks.deleteToolkit).toHaveBeenCalledWith({ projectId: 7, toolkitId: 'app-1' });
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();

    await act(async () => {
      completeDeletion();
    });

    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'The Inventory application has been successfully deleted.',
    );
    expect(mocks.navigate).toHaveBeenCalledWith('/apps/all', { replace: true });
  });

  it('submits only once when Enter repeats while deletion is pending', async () => {
    mocks.isPrivate = true;
    const { promise: deletion, resolve: completeDeletion } = Promise.withResolvers();
    mocks.deleteToolkit.mockReturnValue({ unwrap: () => deletion });
    renderActions();

    selectDelete();
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Inventory' } });

    act(() => {
      fireEvent.keyDown(nameInput, { key: 'Enter' });
      fireEvent.keyDown(nameInput, { key: 'Enter', repeat: true });
    });

    expect(mocks.deleteToolkit).toHaveBeenCalledExactlyOnceWith({ projectId: 7, toolkitId: 'app-1' });
    expect(mocks.navigate).not.toHaveBeenCalled();

    await act(async () => {
      completeDeletion();
    });

    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith('/apps/all', { replace: true });
  });

  it('reports deletion failures without navigating away', async () => {
    mocks.isPrivate = true;
    mocks.deleteToolkit.mockReturnValue({
      unwrap: () => Promise.reject(new Error('delete failed')),
    });
    renderActions();

    selectDelete();

    await act(async () => {
      confirmDelete();
    });

    expect(mocks.toastError).toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
