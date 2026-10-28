// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import DeleteProjectDataDialog from '../DeleteProjectDataDialog';

const theme = createTheme({ palette: lightPalette });

const renderDialog = props =>
  render(
    <ThemeProvider theme={theme}>
      <DeleteProjectDataDialog
        open
        projectName="Team Project"
        selectedTypes={[{ key: 'chats', label: 'Chats', count: 12 }]}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

const typeConfirmation = value =>
  fireEvent.change(screen.getByTestId('project-data-delete-confirm-input').querySelector('input'), {
    target: { value },
  });

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('DeleteProjectDataDialog', () => {
  it('shows the project name and the selected types with counts', () => {
    renderDialog();

    expect(screen.getByText('Delete data from Team Project?')).toBeInTheDocument();
    expect(screen.getByTestId('project-data-delete-type-chats')).toHaveTextContent('Chats (12)');
    expect(screen.getByText('Type DELETE to confirm')).toBeInTheDocument();
  });

  it('warns about items that will be skipped', () => {
    renderDialog({
      selectedTypes: [
        { key: 'agents', label: 'Agents', count: 5, blocked: 2 },
        { key: 'pipelines', label: 'Pipelines', count: 3, blocked: 0 },
      ],
    });

    expect(screen.getByTestId('project-data-delete-type-agents')).toHaveTextContent('Agents (5)');
    expect(screen.getByTestId('project-data-delete-type-agents')).toHaveTextContent(
      '2 published or embedded will be skipped; unpublish them first',
    );
    expect(screen.getByTestId('project-data-delete-type-pipelines')).not.toHaveTextContent('skipped');
  });

  it('tells which credentials are kept', () => {
    renderDialog({
      selectedTypes: [
        {
          key: 'credentials',
          label: 'Credentials',
          count: 5,
          blocked: 2,
          skipReason: { note: 'created by ELITEA for internal use (e.g. S3 access keys) will be kept' },
        },
      ],
    });

    expect(screen.getByTestId('project-data-delete-type-credentials')).toHaveTextContent(
      '2 created by ELITEA for internal use (e.g. S3 access keys) will be kept',
    );
  });

  it('warns that toolkits stop working when credentials go without them', () => {
    renderDialog({ selectedTypes: [{ key: 'credentials', label: 'Credentials', count: 3 }] });

    expect(screen.getByTestId('project-data-delete-credentials-warning')).toHaveTextContent(
      'Toolkits and MCPs that use these credentials will stop working.',
    );
  });

  it('does not warn about credentials when toolkits and MCPs are deleted too', () => {
    renderDialog({
      selectedTypes: [
        { key: 'toolkits', label: 'Toolkits', count: 1 },
        { key: 'mcps', label: 'MCPs', count: 1 },
        { key: 'credentials', label: 'Credentials', count: 3 },
      ],
    });

    expect(screen.queryByTestId('project-data-delete-credentials-warning')).not.toBeInTheDocument();
  });

  it.each(['', 'delete', 'Delete', 'DELETE ', ' DELETE', 'DELET'])(
    'keeps "Delete permanently" disabled for %j',
    value => {
      renderDialog();
      typeConfirmation(value);

      expect(screen.getByTestId('project-data-delete-confirm')).toBeDisabled();
    },
  );

  it('enables "Delete permanently" for the exact value and confirms', () => {
    const onConfirm = vi.fn();
    renderDialog({ onConfirm });

    typeConfirmation('DELETE');
    const confirm = screen.getByTestId('project-data-delete-confirm');
    expect(confirm).toBeEnabled();
    expect(confirm).toHaveTextContent('Delete permanently');

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancels without deleting', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderDialog({ onConfirm, onClose });

    typeConfirmation('DELETE');
    fireEvent.click(screen.getByTestId('project-data-delete-cancel'));

    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('closes on Escape without deleting', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderDialog({ onConfirm, onClose });

    fireEvent.keyDown(screen.getByTestId('project-data-delete-modal'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('blocks a second submission and closing while deleting', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderDialog({ isDeleting: true, onConfirm, onClose });

    typeConfirmation('DELETE');
    expect(screen.getByTestId('project-data-delete-confirm')).toBeDisabled();
    expect(screen.getByTestId('project-data-delete-confirm')).toHaveTextContent('Deleting...');
    expect(screen.getByTestId('project-data-delete-cancel')).toBeDisabled();

    fireEvent.keyDown(screen.getByTestId('project-data-delete-modal'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
