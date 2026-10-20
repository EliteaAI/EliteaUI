// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ScheduleImportExportActions from '../ScheduleImportExportActions';

// EL-7011 R1.1, R1.2, R1.3, R2.1, R2.4, R2.5, R3.1: admin-only Export and Import buttons.

const mocks = vi.hoisted(() => ({
  checkPermission: vi.fn(),
  exportSchedules: vi.fn(),
  toastError: vi.fn(),
  isFetching: false,
}));

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: mocks.checkPermission }),
}));
vi.mock('@/[fsd]/entities/schedule', () => ({
  useLazyExportSchedulesQuery: () => [mocks.exportSchedules, { isFetching: mocks.isFetching }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastError: mocks.toastError }),
}));
vi.mock('@/common/utils', async importOriginal => ({
  ...(await importOriginal()),
  buildErrorMessage: err => err?.data?.error ?? 'Unknown error',
}));
vi.mock('../ImportSchedulesDialog', () => ({
  default: ({ open, projectId }) => (open ? <div data-testid="import-dialog">{projectId}</div> : null),
}));

const theme = createTheme({ palette: lightPalette });
const allow = (...keys) => mocks.checkPermission.mockImplementation(key => keys.includes(key));
const renderActions = () =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleImportExportActions projectId={7} />
    </ThemeProvider>,
  );

describe('EL-7011 ScheduleImportExportActions', () => {
  beforeEach(() => {
    mocks.isFetching = false;
    allow();
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('R1.1 R1.2 shows both buttons to a user with both permissions', () => {
    allow('models.applications.schedules.export', 'models.applications.schedules.import');
    renderActions();
    expect(screen.getByTestId('schedules-export-button')).toBeInTheDocument();
    expect(screen.getByTestId('schedules-import-button')).toBeInTheDocument();
  });

  it('R1.3 hides the button whose permission is missing', () => {
    allow('models.applications.schedules.import');
    renderActions();
    expect(screen.queryByTestId('schedules-export-button')).toBeNull();
    expect(screen.getByTestId('schedules-import-button')).toBeInTheDocument();
  });

  it('R1.3 shows no button without any permission', () => {
    renderActions();
    expect(screen.queryByTestId('schedules-export-button')).toBeNull();
    expect(screen.queryByTestId('schedules-import-button')).toBeNull();
  });

  it('R2.1 Export asks for the project without ids and saves the file with the server name', async () => {
    allow('models.applications.schedules.export');
    const blob = new Blob(['x']);
    mocks.exportSchedules.mockResolvedValue({ data: { blob, filename: 'schedules_7.yaml' } });
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      expect(this.download).toBe('schedules_7.yaml');
    });
    renderActions();
    fireEvent.click(screen.getByTestId('schedules-export-button'));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(mocks.exportSchedules).toHaveBeenCalledWith({ projectId: 7 });
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    click.mockRestore();
  });

  it('R2.4 Export failure shows the server message in a toast', async () => {
    allow('models.applications.schedules.export');
    mocks.exportSchedules.mockResolvedValue({ error: { status: 403, data: { error: 'no access' } } });
    renderActions();
    fireEvent.click(screen.getByTestId('schedules-export-button'));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('no access'));
  });

  it('R2.5 disables Export while the request runs', () => {
    allow('models.applications.schedules.export');
    mocks.isFetching = true;
    renderActions();
    expect(screen.getByTestId('schedules-export-button')).toBeDisabled();
  });

  it('R3.1 Import opens the dialog for the project', () => {
    allow('models.applications.schedules.import');
    renderActions();
    expect(screen.queryByTestId('import-dialog')).toBeNull();
    fireEvent.click(screen.getByTestId('schedules-import-button'));
    expect(screen.getByTestId('import-dialog')).toHaveTextContent('7');
  });
});
