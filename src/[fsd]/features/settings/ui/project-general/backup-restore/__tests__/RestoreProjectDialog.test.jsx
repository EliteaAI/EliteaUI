// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import RestoreProjectDialog from '../RestoreProjectDialog';

const mocks = vi.hoisted(() => ({ restore: vi.fn(), toastWarning: vi.fn(), dispatch: vi.fn() }));

vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }));
vi.mock('@/slices/chat', () => ({
  name: 'chat',
  default: () => ({}),
  actions: { resetLastSelectedConversationId: payload => ({ type: 'chat/reset', payload }) },
}));

vi.mock('@/[fsd]/features/settings/api', () => ({
  useRestoreProjectBackupMutation: () => [mocks.restore, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastWarning: mocks.toastWarning }),
  useTextOverflow: () => ({ textRef: { current: null }, isOverflowing: false }),
}));

const theme = createTheme({ palette: lightPalette });

const artifactOf = overrides => ({
  project_id: 10,
  kind: 'safe',
  chats_included: 'none',
  has_attachment_files: false,
  ...overrides,
});

const answer = payload => ({ unwrap: () => Promise.resolve(payload) });

const renderDialog = () =>
  render(
    <ThemeProvider theme={theme}>
      <RestoreProjectDialog
        open
        onClose={vi.fn()}
        projectId={10}
        projectName="Team Project"
      />
    </ThemeProvider>,
  );

const pickFile = async (name = 'backup.zip.enc') => {
  const input = screen.getByTestId('project-restore-modal').ownerDocument.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [new File(['x'], name)] } });
  await waitFor(() => expect(mocks.restore).toHaveBeenCalled());
};

const option = value =>
  within(screen.getByTestId(`project-restore-chats-option-${value}`)).getByRole('radio');

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('RestoreProjectDialog', () => {
  it('keeps the existing controls and accepts zip backups', () => {
    renderDialog();

    expect(screen.getByTestId('project-restore-dry-run').querySelector('input')).toBeChecked();
    expect(screen.getByTestId('project-restore-truncate').querySelector('input')).not.toBeChecked();
    expect(screen.getByTestId('project-restore-submit')).toHaveTextContent('Preview');
    const input = screen
      .getByTestId('project-restore-modal')
      .ownerDocument.querySelector('input[type="file"]');
    expect(input.getAttribute('accept')).toContain('.zip');
  });

  it('inspects the picked file and says when it has no chats', async () => {
    mocks.restore.mockReturnValue(answer({ ok: true, inspect: true, artifact: artifactOf() }));
    renderDialog();

    await pickFile('backup.sql.enc');

    expect(mocks.restore).toHaveBeenCalledWith(expect.objectContaining({ inspect: true, projectId: 10 }));
    expect(await screen.findByTestId('project-restore-no-chats')).toHaveTextContent(
      'This backup does not contain chats.',
    );
    expect(screen.queryByTestId('project-restore-chats-option-none')).not.toBeInTheDocument();
  });

  it('defaults to restoring chats with attachments when the backup has them', async () => {
    mocks.restore.mockReturnValue(
      answer({
        ok: true,
        artifact: artifactOf({
          chats_included: 'with_attachments',
          has_attachment_files: true,
          chats_count: 42,
          attachments_count: 118,
          attachments_size: 350 * 1024 * 1024,
        }),
      }),
    );
    renderDialog();

    await pickFile();

    expect(await screen.findByTestId('project-restore-chats-info')).toHaveTextContent(
      'Backup contains 42 chats · 118 attachments (~350 MB)',
    );
    expect(option('with_attachments')).toBeChecked();
    expect(option('with_attachments')).not.toBeDisabled();
  });

  it('disables "with attachments" for a backup without files', async () => {
    mocks.restore.mockReturnValue(
      answer({ ok: true, artifact: artifactOf({ chats_included: 'without_attachments' }) }),
    );
    renderDialog();

    await pickFile('backup.sql.enc');

    await screen.findByTestId('project-restore-chats-info');
    expect(option('without_attachments')).toBeChecked();
    expect(option('with_attachments')).toBeDisabled();
  });

  it('sends the chat option and shows the replace warning and the chat summary', async () => {
    mocks.restore.mockReturnValueOnce(
      answer({
        ok: true,
        artifact: artifactOf({ chats_included: 'with_attachments', has_attachment_files: true }),
      }),
    );
    renderDialog();
    await pickFile();
    await screen.findByTestId('project-restore-chats-info');

    fireEvent.click(screen.getByTestId('project-restore-truncate').querySelector('input'));
    expect(screen.getByTestId('project-restore-replace-chats-warning')).toHaveTextContent(
      'All existing chats in Team Project will be permanently deleted',
    );
    fireEvent.click(screen.getByTestId('project-restore-dry-run').querySelector('input'));

    mocks.restore.mockReturnValueOnce(
      answer({
        ok: true,
        artifact: artifactOf({ chats_included: 'with_attachments', has_attachment_files: true }),
        result: {
          dry_run: false,
          statements: 10,
          total_rows: 100,
          applied_tables: [],
          chats: { restored: 42, skipped: 3 },
          attachments: { total: 118, uploaded: 115, linked: 0, failed: 3 },
        },
      }),
    );
    fireEvent.click(screen.getByTestId('project-restore-submit'));

    expect(await screen.findByTestId('project-restore-chats-summary')).toHaveTextContent(
      'Chats: 42 restored, 3 skipped (already exist) · Attachments: 115 uploaded, 3 failed',
    );
    expect(mocks.restore).toHaveBeenLastCalledWith(
      expect.objectContaining({ restoreChats: 'with_attachments', truncate: true, dryRun: false }),
    );
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'chat/reset', payload: { projectId: 10 } });
    expect(mocks.toastWarning).toHaveBeenCalledWith(
      'Restore completed. 3 chat attachment(s) could not be restored.',
    );
  });

  it('hides the replace-chats warning when chats are not restored', async () => {
    mocks.restore.mockReturnValue(
      answer({ ok: true, artifact: artifactOf({ chats_included: 'without_attachments' }) }),
    );
    renderDialog();
    await pickFile('backup.sql.enc');
    await screen.findByTestId('project-restore-chats-info');

    fireEvent.click(option('none'));
    fireEvent.click(screen.getByTestId('project-restore-truncate').querySelector('input'));

    expect(screen.queryByTestId('project-restore-replace-chats-warning')).not.toBeInTheDocument();
  });

  it('shows the skill files result and warns when some could not be restored', async () => {
    mocks.restore.mockReturnValueOnce(answer({ ok: true, artifact: artifactOf() }));
    renderDialog();
    await pickFile();
    fireEvent.click(screen.getByTestId('project-restore-dry-run').querySelector('input'));

    mocks.restore.mockReturnValueOnce(
      answer({
        ok: true,
        artifact: artifactOf(),
        result: {
          dry_run: false,
          statements: 4,
          total_rows: 49,
          applied_tables: ['skill_version_files'],
          skill_files: {
            total: 22,
            present: 0,
            uploaded: 20,
            missing: 2,
            missing_paths: ['notes.txt', 'references/guide.md'],
            unchecked: false,
          },
        },
      }),
    );
    fireEvent.click(screen.getByTestId('project-restore-submit'));

    expect(await screen.findByTestId('project-restore-skill-files-summary')).toHaveTextContent(
      'Skill attachments: 22 total, 0 present, 20 uploaded, 2 missing (notes.txt, references/guide.md)',
    );
    expect(mocks.toastWarning).toHaveBeenCalledWith(
      'Restore completed. 2 skill attachment(s) could not be restored.',
    );
  });

  it('does not warn about missing skill files after a preview', async () => {
    mocks.restore.mockReturnValueOnce(answer({ ok: true, artifact: artifactOf() }));
    renderDialog();
    await pickFile();

    mocks.restore.mockReturnValueOnce(
      answer({
        ok: true,
        artifact: artifactOf(),
        result: {
          dry_run: true,
          applied_tables: [],
          skill_files: { total: 2, present: 0, uploaded: 1, missing: 1 },
        },
      }),
    );
    fireEvent.click(screen.getByTestId('project-restore-submit'));

    expect(await screen.findByTestId('project-restore-skill-files-summary')).toHaveTextContent(
      'Skill attachments: 2 total, 0 present, 1 uploaded, 1 missing',
    );
    expect(mocks.toastWarning).not.toHaveBeenCalled();
  });

  it("warns that merging another project's backup can mix entities, until replace is checked", async () => {
    mocks.restore.mockReturnValue(answer({ ok: true, artifact: artifactOf({ project_id: 7 }) }));
    renderDialog();
    await pickFile();

    expect(await screen.findByTestId('project-restore-merge-warning')).toHaveTextContent(
      'Restore it into a new project, or check "Replace existing data - do not merge".',
    );
    fireEvent.click(screen.getByTestId('project-restore-truncate').querySelector('input'));
    expect(screen.queryByTestId('project-restore-merge-warning')).not.toBeInTheDocument();
  });

  it('does not warn about merging a backup of this project', async () => {
    mocks.restore.mockReturnValue(answer({ ok: true, artifact: artifactOf() }));
    renderDialog();
    await pickFile();
    await screen.findByTestId('project-restore-no-chats');

    expect(screen.queryByTestId('project-restore-merge-warning')).not.toBeInTheDocument();
  });

  it('shows one warning toast for failed attachments and missing skill files together', async () => {
    mocks.restore.mockReturnValueOnce(
      answer({
        ok: true,
        artifact: artifactOf({ chats_included: 'with_attachments', has_attachment_files: true }),
      }),
    );
    renderDialog();
    await pickFile();
    await screen.findByTestId('project-restore-chats-info');
    fireEvent.click(screen.getByTestId('project-restore-dry-run').querySelector('input'));

    mocks.restore.mockReturnValueOnce(
      answer({
        ok: true,
        artifact: artifactOf({ chats_included: 'with_attachments', has_attachment_files: true }),
        result: {
          dry_run: false,
          statements: 1,
          total_rows: 1,
          applied_tables: [],
          chats: { restored: 1, skipped: 0 },
          attachments: { total: 3, uploaded: 0, linked: 0, failed: 3 },
          skill_files: { total: 2, present: 0, uploaded: 0, missing: 2, missing_paths: ['a.md', 'b.md'] },
        },
      }),
    );
    fireEvent.click(screen.getByTestId('project-restore-submit'));

    await screen.findByTestId('project-restore-skill-files-summary');
    expect(mocks.toastWarning).toHaveBeenCalledTimes(1);
    expect(mocks.toastWarning).toHaveBeenCalledWith(
      'Restore completed. 3 chat attachment(s) and 2 skill attachment(s) could not be restored.',
    );
  });
});
