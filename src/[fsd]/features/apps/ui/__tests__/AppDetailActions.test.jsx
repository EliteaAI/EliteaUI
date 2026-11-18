// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));
vi.mock('@/[fsd]/shared/config/store', () => ({ default: {} }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useProjectType: () => ({ isPrivate: mocks.isPrivate }),
  useSelectedProjectId: () => 7,
  useToast: () => ({ toastError: mocks.toastError, toastSuccess: mocks.toastSuccess }),
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Controls: {
    ControlsDropdown: ({ id, menuItems }) => {
      const [menuItem] = menuItems;
      return (
        <button
          data-testid={id}
          data-alarm={menuItem.alarm}
          disabled={menuItem.disabled}
          onClick={menuItem.onClick}
        >
          {menuItem.label}
        </button>
      );
    },
  },
  Modal: {
    DeleteEntityModal: ({ name, open, onClose, onConfirm, shouldRequestInputName }) =>
      open ? (
        <div
          role="dialog"
          data-testid="delete-confirm-dialog"
          data-request-input-name={shouldRequestInputName}
        >
          <span data-testid="delete-confirm-entity-name">{name}</span>
          <button
            data-testid="delete-confirm-cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            data-testid="delete-confirm-button"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      ) : null,
  },
}));
vi.mock('@/components/Icons/DeleteIcon', () => ({ default: () => null }));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: mocks.checkPermission }),
}));

const renderActions = (props = {}) =>
  render(
    <AppDetailActions
      appId="app-1"
      appName="Inventory"
      {...props}
    />,
  );

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
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps delete unavailable without permission and enables it with the existing toolkit delete permission', () => {
    const { unmount } = renderActions();
    expect(screen.getByTestId('app-detail-actions')).toBeDisabled();

    unmount();
    mocks.checkPermission.mockReturnValue(true);
    renderActions();

    expect(screen.getByTestId('app-detail-actions')).toHaveTextContent('Delete application');
    expect(screen.getByTestId('app-detail-actions')).toBeEnabled();
    expect(screen.getByTestId('app-detail-actions')).toHaveAttribute('data-alarm', 'true');
  });

  it('opens the entity warning modal with the app name and cancels without deleting', () => {
    mocks.isPrivate = true;
    renderActions();

    fireEvent.click(screen.getByTestId('app-detail-actions'));

    expect(screen.getByTestId('delete-confirm-entity-name')).toHaveTextContent('Inventory');
    expect(screen.getByTestId('delete-confirm-dialog')).toHaveAttribute('data-request-input-name', 'true');
    expect(mocks.deleteToolkit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('delete-confirm-cancel-button'));

    expect(screen.queryByTestId('delete-confirm-dialog')).not.toBeInTheDocument();
    expect(mocks.deleteToolkit).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('shows success and returns to the Applications list only after deletion completes', async () => {
    mocks.isPrivate = true;
    const { promise: deletion, resolve: completeDeletion } = Promise.withResolvers();
    mocks.deleteToolkit.mockReturnValue({ unwrap: () => deletion });
    renderActions();

    fireEvent.click(screen.getByTestId('app-detail-actions'));
    fireEvent.click(screen.getByTestId('delete-confirm-button'));

    expect(mocks.deleteToolkit).toHaveBeenCalledWith({ projectId: 7, toolkitId: 'app-1' });
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();

    await act(async () => {
      completeDeletion();
    });

    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'The Inventory application has been successfully deleted.',
    );
    expect(mocks.navigate).toHaveBeenCalledWith('/apps/applications', { replace: true });
  });

  it('reports deletion failures without navigating away', async () => {
    mocks.isPrivate = true;
    mocks.deleteToolkit.mockReturnValue({
      unwrap: () => Promise.reject(new Error('delete failed')),
    });
    renderActions();

    fireEvent.click(screen.getByTestId('app-detail-actions'));

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-confirm-button'));
    });

    expect(mocks.toastError).toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
