import { describe, expect, it } from 'vitest';

import { CHAT_TAG_TYPES } from '../../constants/projectBackup.constants.js';
import {
  getChatsSummaryText,
  getDefaultRestoreChats,
  getRestoreErrorMessage,
  getRestoreInvalidatedTags,
} from '../projectBackup.helpers.js';

describe('getRestoreErrorMessage', () => {
  it('names the UI checkbox instead of the backend parameter on a project mismatch', () => {
    const message = getRestoreErrorMessage({
      status: 409,
      data: {
        ok: false,
        error:
          'artifact belongs to project 12; pass allow_project_mismatch=true to restore it into project 7',
        artifact: { project_id: 12 },
      },
    });

    expect(message).toBe(
      'This backup was taken from another project. Check "Restore here anyway" to restore it into this project.',
    );
    expect(message).not.toContain('allow_project_mismatch');
  });

  it('names the UI checkbox on a project mismatch that arrives without the artifact', () => {
    const message = getRestoreErrorMessage({
      status: 409,
      data: {
        error:
          'artifact belongs to project 12; pass allow_project_mismatch=true to restore it into project 7',
      },
    });

    expect(message).toBe(
      'This backup was taken from another project. Check "Restore here anyway" to restore it into this project.',
    );
  });

  it('replaces the access_denied code with a readable message', () => {
    expect(getRestoreErrorMessage({ status: 403, data: { ok: false, error: 'access_denied' } })).toBe(
      'You do not have permission to restore data into this project.',
    );
  });

  it('keeps other backend messages and appends the detail', () => {
    expect(getRestoreErrorMessage({ status: 500, data: { error: 'restore failed', detail: 'boom' } })).toBe(
      'restore failed: boom',
    );
    expect(getRestoreErrorMessage({ status: 400, data: { error: 'empty file' } })).toBe('empty file');
  });

  it('falls back to a generic message', () => {
    expect(getRestoreErrorMessage({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' })).toBe(
      'TypeError: Failed to fetch',
    );
    expect(getRestoreErrorMessage(undefined)).toBe('Restore failed.');
  });
});

describe('getDefaultRestoreChats', () => {
  it('restores nothing for a backup without chats', () => {
    expect(getDefaultRestoreChats(undefined)).toBe('none');
    expect(getDefaultRestoreChats({ chats_included: 'none' })).toBe('none');
  });

  it('restores chats without attachments when the backup has no files', () => {
    expect(getDefaultRestoreChats({ chats_included: 'without_attachments' })).toBe('without_attachments');
    expect(getDefaultRestoreChats({ chats_included: 'with_attachments', has_attachment_files: false })).toBe(
      'without_attachments',
    );
  });

  it('restores chats with attachments when the backup has the files', () => {
    expect(getDefaultRestoreChats({ chats_included: 'with_attachments', has_attachment_files: true })).toBe(
      'with_attachments',
    );
  });
});

describe('getChatsSummaryText', () => {
  it('is empty when no chats were restored', () => {
    expect(getChatsSummaryText(undefined)).toBe('');
    expect(getChatsSummaryText({ total_rows: 3 })).toBe('');
  });

  it('reports restored and skipped chats with uploaded attachments', () => {
    expect(
      getChatsSummaryText({
        chats: { restored: 42, skipped: 3 },
        attachments: { total: 118, uploaded: 115, linked: 0, failed: 3 },
      }),
    ).toBe('Chats: 42 restored, 3 skipped (already exist) · Attachments: 115 uploaded, 3 failed');
  });

  it('reports linked attachments when no files were uploaded', () => {
    expect(
      getChatsSummaryText({
        chats: { restored: 2, skipped: 0 },
        attachments: { total: 3, uploaded: 0, linked: 1, failed: 2 },
      }),
    ).toBe('Chats: 2 restored, 0 skipped (already exist) · Attachments: 1 linked, 2 failed');
  });
});

describe('getRestoreInvalidatedTags', () => {
  const TEMPLATES = 'TAG_TYPE_CHAT_TEMPLATES';

  it('refetches the chat list and chat views after a restore with chats', () => {
    const tags = getRestoreInvalidatedTags(
      undefined,
      { projectId: 10, restoreChats: 'with_attachments' },
      TEMPLATES,
    );
    expect(tags).toEqual([{ type: TEMPLATES, id: 10 }, ...CHAT_TAG_TYPES]);
    expect(tags).toEqual(expect.arrayContaining(['TAG_TYPE_FOLDERS', 'TAG_TYPE_MESSAGES']));
  });

  it('keeps the chat caches when chats are not restored', () => {
    expect(getRestoreInvalidatedTags(undefined, { projectId: 10, restoreChats: 'none' }, TEMPLATES)).toEqual([
      { type: TEMPLATES, id: 10 },
    ]);
  });

  it('invalidates nothing for a preview, an inspection or a failure', () => {
    const args = { projectId: 10, restoreChats: 'with_attachments' };
    expect(getRestoreInvalidatedTags(undefined, { ...args, dryRun: true }, TEMPLATES)).toEqual([]);
    expect(getRestoreInvalidatedTags(undefined, { ...args, inspect: true }, TEMPLATES)).toEqual([]);
    expect(getRestoreInvalidatedTags({ status: 500 }, args, TEMPLATES)).toEqual([]);
  });
});
