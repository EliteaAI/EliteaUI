// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import ProjectDataDelete from '../ProjectDataDelete';

const hookState = vi.hoisted(() => ({ current: {} }));

vi.mock('@/[fsd]/features/settings/lib/hooks', () => ({
  useProjectDataDelete: () => hookState.current,
}));

const theme = createTheme({ palette: lightPalette });

const renderSection = props =>
  render(
    <ThemeProvider theme={theme}>
      <ProjectDataDelete
        projectName="Team Project"
        onOpenBackup={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

const typeCheckbox = key => within(screen.getByTestId(`project-data-type-${key}`)).getByRole('checkbox');
const chatsCheckbox = () => typeCheckbox('chats');
const selectAll = () => within(screen.getByTestId('project-data-select-all')).getByRole('checkbox');

const ALL_TYPES = ['chats', 'agents', 'pipelines', 'skills', 'toolkits', 'mcps', 'credentials'];

beforeEach(() => {
  vi.clearAllMocks();
  hookState.current = {
    counts: {
      chats: { count: 12, blocked: 0 },
      agents: { count: 5, blocked: 2 },
      pipelines: { count: 3, blocked: 0 },
      skills: { count: 4, blocked: 1 },
      toolkits: { count: 6, blocked: 0 },
      mcps: { count: 2, blocked: 0 },
      credentials: { count: 7, blocked: 0 },
    },
    isCountsLoading: false,
    isDeleting: false,
    doDelete: vi.fn().mockResolvedValue(true),
  };
});

afterEach(cleanup);

describe('ProjectDataDelete', () => {
  it('starts with Chats unchecked, its count, and the button disabled', () => {
    renderSection();

    expect(chatsCheckbox()).not.toBeChecked();
    expect(screen.getByTestId('project-data-type-chats')).toHaveTextContent('Chats');
    expect(screen.getByTestId('project-data-type-chats')).toHaveTextContent('12');
    expect(screen.getByTestId('project-data-delete-open')).toBeDisabled();
    expect(screen.getByTestId('project-data-delete-open')).toHaveTextContent('Delete selected data');
  });

  it('enables the button only while a type is selected', () => {
    renderSection();

    fireEvent.click(chatsCheckbox());
    expect(screen.getByTestId('project-data-delete-open')).toBeEnabled();

    fireEvent.click(chatsCheckbox());
    expect(screen.getByTestId('project-data-delete-open')).toBeDisabled();
  });

  it('shows the description, backup warning and chat restore note', () => {
    renderSection();

    expect(
      screen.getByText(/Permanently delete all items of the selected types from this project/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We strongly recommend creating and verifying a backup before deleting project data/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Chats and attachments can only be restored if they were included in the backup/),
    ).toBeInTheDocument();
  });

  it('links the warning to Back Up & Restore', () => {
    const onOpenBackup = vi.fn();
    renderSection({ onOpenBackup });

    fireEvent.click(screen.getByTestId('project-data-delete-backup-link'));
    expect(onOpenBackup).toHaveBeenCalled();
  });

  it('shows the section info tooltip', async () => {
    renderSection();

    fireEvent.mouseOver(screen.getByTestId('project-data-delete-info'));
    expect(
      await screen.findByText(
        'Deletes all project-owned items of the selected types, not just your own items, including copies taken from other projects. Data stored in other projects is not deleted.',
      ),
    ).toBeInTheDocument();
  });

  it('lists every type unchecked with its count', () => {
    renderSection();

    const labels = ['Chats', 'Agents', 'Pipelines', 'Skills', 'Toolkits', 'MCPs', 'Credentials'];
    ALL_TYPES.forEach((key, index) => {
      expect(typeCheckbox(key)).not.toBeChecked();
      expect(screen.getByTestId(`project-data-type-${key}`)).toHaveTextContent(labels[index]);
    });
    expect(screen.getByTestId('project-data-type-credentials')).toHaveTextContent('7');
    expect(screen.getByTestId('project-data-type-mcps')).toHaveTextContent('2');
  });

  it('shows a dash when a count is unavailable', () => {
    hookState.current.counts = { ...hookState.current.counts, skills: null };
    renderSection();

    expect(screen.getByTestId('project-data-type-skills')).toHaveTextContent('–');
  });

  it('checks and unchecks every type with Select all', () => {
    renderSection();

    fireEvent.click(selectAll());
    ALL_TYPES.forEach(key => expect(typeCheckbox(key)).toBeChecked());
    expect(screen.getByTestId('project-data-delete-open')).toBeEnabled();

    fireEvent.click(selectAll());
    ALL_TYPES.forEach(key => expect(typeCheckbox(key)).not.toBeChecked());
    expect(screen.getByTestId('project-data-delete-open')).toBeDisabled();
  });

  it('marks Select all indeterminate when some types are selected', () => {
    renderSection();

    fireEvent.click(typeCheckbox('agents'));
    expect(selectAll()).toHaveAttribute('data-indeterminate', 'true');
    expect(selectAll()).not.toBeChecked();
  });

  it('shows the credentials tooltip', async () => {
    renderSection();

    fireEvent.mouseOver(screen.getByTestId('project-data-type-credentials-info'));
    expect(
      await screen.findByText(
        'Credentials, tokens, and other secrets are excluded from project backups and cannot be restored from them. Ensure you can recreate required credentials before deleting them.',
      ),
    ).toBeInTheDocument();
  });

  it('hints how many published items will be skipped', () => {
    renderSection();

    expect(screen.getByTestId('project-data-type-agents-blocked')).toHaveTextContent(
      '2 published, will be skipped',
    );
    expect(screen.getByTestId('project-data-type-skills-blocked')).toHaveTextContent(
      '1 published, will be skipped',
    );
    expect(screen.queryByTestId('project-data-type-pipelines-blocked')).not.toBeInTheDocument();
  });

  it('deletes every selected type in display order', async () => {
    renderSection();

    fireEvent.click(typeCheckbox('credentials'));
    fireEvent.click(typeCheckbox('agents'));
    fireEvent.click(screen.getByTestId('project-data-delete-open'));
    fireEvent.change(screen.getByTestId('project-data-delete-confirm-input').querySelector('input'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByTestId('project-data-delete-confirm'));

    await waitFor(() => expect(hookState.current.doDelete).toHaveBeenCalledWith(['agents', 'credentials']));
  });

  it('opens the confirmation and deletes the selected types', async () => {
    renderSection();

    fireEvent.click(chatsCheckbox());
    fireEvent.click(screen.getByTestId('project-data-delete-open'));

    expect(screen.getByText('Delete data from Team Project?')).toBeInTheDocument();
    expect(screen.getByTestId('project-data-delete-type-chats')).toHaveTextContent('Chats (12)');

    fireEvent.change(screen.getByTestId('project-data-delete-confirm-input').querySelector('input'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByTestId('project-data-delete-confirm'));

    await waitFor(() => expect(hookState.current.doDelete).toHaveBeenCalledWith(['chats']));
    await waitFor(() => expect(screen.queryByText('Delete data from Team Project?')).not.toBeInTheDocument());
    expect(chatsCheckbox()).not.toBeChecked();
  });

  it('never deletes when the confirmation is cancelled', async () => {
    renderSection();

    fireEvent.click(chatsCheckbox());
    fireEvent.click(screen.getByTestId('project-data-delete-open'));
    fireEvent.click(screen.getByTestId('project-data-delete-cancel'));

    await waitFor(() => expect(screen.queryByText('Delete data from Team Project?')).not.toBeInTheDocument());
    expect(hookState.current.doDelete).not.toHaveBeenCalled();
  });
});
