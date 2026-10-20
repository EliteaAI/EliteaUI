// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import CreateBackupDialog from '../CreateBackupDialog';

const summaryQuery = vi.hoisted(() => ({ current: { data: undefined, isFetching: false } }));

vi.mock('@/[fsd]/features/settings/api', () => ({
  useProjectBackupSummaryQuery: () => summaryQuery.current,
}));

const theme = createTheme({ palette: lightPalette });

const renderDialog = props =>
  render(
    <ThemeProvider theme={theme}>
      <CreateBackupDialog
        open
        projectId={10}
        projectName="Team Project"
        isDownloading={false}
        onClose={vi.fn()}
        onBackup={vi.fn().mockResolvedValue(true)}
        {...props}
      />
    </ThemeProvider>,
  );

const option = value => within(screen.getByTestId(`project-backup-chats-option-${value}`)).getByRole('radio');

beforeEach(() => {
  vi.clearAllMocks();
  summaryQuery.current = {
    data: {
      chats_count: 42,
      attachments_count: 118,
      attachments_size: 350 * 1024 * 1024,
      missing_attachments: 0,
    },
    isFetching: false,
  };
});

afterEach(cleanup);

describe('CreateBackupDialog', () => {
  it('opens with "Do not include chats" selected and the chat summary', () => {
    renderDialog();

    expect(screen.getByText('Create Project Backup')).toBeInTheDocument();
    expect(option('none')).toBeChecked();
    expect(option('without_attachments')).not.toBeChecked();
    expect(option('with_attachments')).not.toBeChecked();
    expect(screen.getByTestId('project-backup-chats-summary')).toHaveTextContent(
      '42 chats · 118 attachments · ~350 MB',
    );
    expect(screen.queryByText(/Store the backup file securely/)).not.toBeInTheDocument();
  });

  it('downloads the current backup by default', async () => {
    const onBackup = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    renderDialog({ onBackup, onClose });

    fireEvent.click(screen.getByTestId('project-backup-confirm'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onBackup).toHaveBeenCalledWith({ chats: 'none', missingAttachments: 0 });
  });

  it('passes the selected chat option and shows the privacy note', async () => {
    const onBackup = vi.fn().mockResolvedValue(true);
    renderDialog({ onBackup });

    fireEvent.click(option('with_attachments'));
    expect(screen.getByText(/Store the backup file securely/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('project-backup-confirm'));
    await waitFor(() =>
      expect(onBackup).toHaveBeenCalledWith({ chats: 'with_attachments', missingAttachments: 0 }),
    );
  });

  it('cancels without downloading', () => {
    const onBackup = vi.fn();
    const onClose = vi.fn();
    renderDialog({ onBackup, onClose });

    fireEvent.click(screen.getByTestId('project-backup-cancel'));

    expect(onClose).toHaveBeenCalled();
    expect(onBackup).not.toHaveBeenCalled();
  });

  it('keeps the modal open when the download fails', async () => {
    const onClose = vi.fn();
    const onBackup = vi.fn().mockResolvedValue(false);
    renderDialog({ onBackup, onClose });

    fireEvent.click(screen.getByTestId('project-backup-confirm'));

    await waitFor(() => expect(onBackup).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables the chat options for a project without chats', () => {
    summaryQuery.current = {
      data: { chats_count: 0, attachments_count: 0, attachments_size: 0, missing_attachments: 0 },
      isFetching: false,
    };
    renderDialog();

    expect(option('without_attachments')).toBeDisabled();
    expect(option('with_attachments')).toBeDisabled();
    expect(option('none')).not.toBeDisabled();
  });

  it('keeps the chat options available when the summary fails to load', () => {
    summaryQuery.current = { data: undefined, isFetching: false, isError: true };
    renderDialog();

    expect(option('without_attachments')).not.toBeDisabled();
    expect(option('with_attachments')).not.toBeDisabled();
    expect(screen.getByTestId('project-backup-chats-summary')).toHaveTextContent("Couldn't load chat info.");
    expect(screen.queryByText('This project has no chats')).not.toBeInTheDocument();
  });

  it('uses the singular for a single chat and attachment', () => {
    summaryQuery.current = {
      data: { chats_count: 1, attachments_count: 1, attachments_size: 1024, missing_attachments: 0 },
      isFetching: false,
    };
    renderDialog();

    expect(screen.getByTestId('project-backup-chats-summary')).toHaveTextContent(
      '1 chat · 1 attachment · ~1.0 KB',
    );
  });

  it('warns about a large backup with attachments only', () => {
    summaryQuery.current = {
      data: {
        chats_count: 3,
        attachments_count: 9,
        attachments_size: 600 * 1024 * 1024,
        missing_attachments: 0,
      },
      isFetching: false,
    };
    renderDialog();

    fireEvent.click(option('without_attachments'));
    expect(screen.queryByText(/Large backup/)).not.toBeInTheDocument();

    fireEvent.click(option('with_attachments'));
    expect(screen.getByText('Large backup (~600 MB). It may take a while.')).toBeInTheDocument();
  });

  it('shows the progress state and blocks closing while preparing', () => {
    const onClose = vi.fn();
    renderDialog({ isDownloading: true, onClose });

    expect(screen.getByTestId('project-backup-confirm')).toHaveTextContent('Preparing...');
    expect(screen.getByTestId('project-backup-confirm')).toBeDisabled();
    expect(screen.getByTestId('project-backup-cancel')).toBeDisabled();
    fireEvent.keyDown(screen.getByTestId('project-backup-modal'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
