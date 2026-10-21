// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleDetailMenu from '../ScheduleDetailMenu';

// EL-7011 CR-16 (US-43 R4.3 to R4.5): the Edit schedule page header menu with Export and Import

const mocks = vi.hoisted(() => ({ onExport: vi.fn(), canExport: true, canImport: true, dialogProps: null }));

vi.mock('@/[fsd]/features/schedule', () => ({
  useScheduleRowActions: () => ({ onExport: mocks.canExport ? mocks.onExport : undefined }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => mocks.canImport }),
}));
vi.mock('@/[fsd]/features/schedule-import-export', () => ({
  ImportSchedulesDialog: props => {
    mocks.dialogProps = props;
    return (
      <button
        data-testid="import-dialog"
        onClick={props.onClose}
      />
    );
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks/useDeleteConfirmationDisabled.hooks', () => ({
  useDeleteConfirmationDisabled: () => false,
}));

const theme = createTheme(getDesignTokens('light'));
const schedule = { id: 9, name: 'Nightly' };

const renderMenu = () =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleDetailMenu
        schedule={schedule}
        projectId={5}
      />
    </ThemeProvider>,
  );
const openMenu = () => fireEvent.click(screen.getByTestId('schedule-detail-menu-button'));

describe('ScheduleDetailMenu EL-7011 CR-16', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.canExport = true;
    mocks.canImport = true;
    mocks.dialogProps = null;
  });

  it('R4.3 shows Export and Import with both permissions; Export exports this schedule', () => {
    renderMenu();
    openMenu();
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual(['Export', 'Import']);
    fireEvent.click(screen.getByText('Export'));
    expect(mocks.onExport).toHaveBeenCalledTimes(1);
  });

  it('R4.3 shows only the item whose permission the user holds', () => {
    mocks.canImport = false;
    renderMenu();
    openMenu();
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual(['Export']);
    cleanup();
    mocks.canImport = true;
    mocks.canExport = false;
    renderMenu();
    openMenu();
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual(['Import']);
  });

  it('R4.4 Import opens the import dialog of the project and closes it', () => {
    renderMenu();
    expect(screen.queryByTestId('import-dialog')).not.toBeInTheDocument();
    openMenu();
    fireEvent.click(screen.getByText('Import'));
    expect(mocks.dialogProps).toMatchObject({ open: true, projectId: 5 });
    fireEvent.click(screen.getByTestId('import-dialog'));
    expect(screen.queryByTestId('import-dialog')).not.toBeInTheDocument();
  });

  it('R4.5 renders no menu without both permissions', () => {
    mocks.canExport = false;
    mocks.canImport = false;
    const { container } = renderMenu();
    expect(container).toBeEmptyDOMElement();
  });
});
