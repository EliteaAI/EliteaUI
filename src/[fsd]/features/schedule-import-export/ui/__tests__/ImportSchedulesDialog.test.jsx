// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ImportSchedulesDialog from '../ImportSchedulesDialog';

// EL-7011 R3.1, R3.2, R3.3, R3.4, R3.6: the import dialog picks a YAML file, uploads it and shows the result.

const mocks = vi.hoisted(() => ({ importSchedules: vi.fn(), isLoading: false }));

vi.mock('@/[fsd]/entities/schedule', () => ({
  useImportSchedulesMutation: () => [mocks.importSchedules, { isLoading: mocks.isLoading }],
}));
vi.mock('@/common/utils', async importOriginal => ({
  ...(await importOriginal()),
  buildErrorMessage: err => err?.data?.error ?? 'Unknown error',
}));

const theme = createTheme({ palette: lightPalette });
const answer = payload => ({ unwrap: () => Promise.resolve(payload) });
const fail = error => ({ unwrap: () => Promise.reject(error) });

const renderDialog = (onClose = vi.fn()) => {
  render(
    <ThemeProvider theme={theme}>
      <ImportSchedulesDialog
        open
        onClose={onClose}
        projectId={7}
      />
    </ThemeProvider>,
  );
  return onClose;
};

const input = () => screen.getByTestId('import-schedules-dialog').ownerDocument.querySelector('input[type="file"]');
const pick = (name = 'schedules.yaml') => {
  const file = new File(['x'], name);
  fireEvent.change(input(), { target: { files: [file] } });
  return file;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isLoading = false;
});
afterEach(cleanup);

describe('EL-7011 R3.1 ImportSchedulesDialog file pick', () => {
  it('accepts one yaml or yml file and keeps Upload disabled until a file is chosen', () => {
    renderDialog();

    expect(input()).toHaveAttribute('accept', '.yaml,.yml');
    expect(input()).not.toHaveAttribute('multiple');
    expect(screen.getByTestId('import-schedules-upload')).toBeDisabled();
    pick('daily.yml');
    expect(screen.getByText('daily.yml')).toBeInTheDocument();
    expect(screen.getByTestId('import-schedules-upload')).toBeEnabled();
  });
});

describe('EL-7011 R3.2 and R3.3 ImportSchedulesDialog upload', () => {
  it('sends the file to the current project and shows the report', async () => {
    mocks.importSchedules.mockReturnValue(answer({ created: [{ name: 'Daily' }], skipped: [], failed: [] }));
    renderDialog();
    const file = pick();

    fireEvent.click(screen.getByTestId('import-schedules-upload'));

    await waitFor(() => expect(screen.getByTestId('import-report-created')).toBeInTheDocument());
    expect(mocks.importSchedules).toHaveBeenCalledWith({ projectId: 7, file });
  });
});

describe('EL-7011 R3.4 ImportSchedulesDialog errors', () => {
  it('shows the server text and keeps the dialog and the chosen file', async () => {
    mocks.importSchedules.mockReturnValue(fail({ status: 400, data: { error: 'File is too large' } }));
    const onClose = renderDialog();
    pick();

    fireEvent.click(screen.getByTestId('import-schedules-upload'));

    expect(await screen.findByText('File is too large')).toBeInTheDocument();
    expect(screen.getByText('schedules.yaml')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('EL-7011 R3.6 ImportSchedulesDialog while uploading', () => {
  it('ignores the close button and Escape and disables Upload', () => {
    mocks.isLoading = true;
    const onClose = renderDialog();

    expect(screen.getByTestId('import-schedules-upload')).toBeDisabled();
    fireEvent.click(screen.getByTestId('import-schedules-close-button'));
    fireEvent.keyDown(screen.getByTestId('import-schedules-dialog'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on the close button when idle', () => {
    const onClose = renderDialog();

    fireEvent.click(screen.getByTestId('import-schedules-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
