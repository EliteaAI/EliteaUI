// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import DeleteUserButton from '../DeleteUserButton';

vi.mock('@/api/admin', () => ({ useUserDeleteMutation: () => [vi.fn(), { isLoading: false }] }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 406,
  useToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}));
vi.mock('@/common/utils', async importOriginal => ({
  ...(await importOriginal()),
  buildErrorMessage: () => 'error',
}));
vi.mock('@/components/Chat/StyledComponents', () => ({ StyledCircleProgress: () => null }));
vi.mock('@/components/Icons/DeleteIcon', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui', () => ({ Modal: { DeleteEntityModal: () => null } }));

const theme = createTheme({ palette: lightPalette });

afterEach(cleanup);

describe('DeleteUserButton tooltip', () => {
  it('shows the reason when hovering a disabled button', async () => {
    render(
      <ThemeProvider theme={theme}>
        <DeleteUserButton
          testId="delete-button"
          users={[{ id: 1, name: 'me' }]}
          disabled
          tooltip="You cannot delete yourself while you have the admin role"
        />
      </ThemeProvider>,
    );

    const button = screen.getByTestId('delete-button');
    expect(button).toBeDisabled();
    fireEvent.mouseOver(button.parentElement);

    expect(
      await screen.findByText('You cannot delete yourself while you have the admin role'),
    ).toBeInTheDocument();
  });
});
