// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { CHAT_TAG_TYPES, PROJECT_ENTITY_TAG_TYPES } from '../../constants/projectBackup.constants.js';
import {
  formatCount,
  getChatsSummaryText,
  getDefaultRestoreChats,
  getRestoreErrorMessage,
  getRestoreInvalidatedTags,
  getRestoreWarningText,
  getSkillFilesSummaryText,
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

describe('formatCount', () => {
  it('uses the singular for one and the plural otherwise', () => {
    expect(formatCount(1, 'chat')).toBe('1 chat');
    expect(formatCount(0, 'chat')).toBe('0 chats');
    expect(formatCount(2, 'attachment')).toBe('2 attachments');
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

  it('reports uploaded attachments when nothing was linked and every upload failed', () => {
    expect(
      getChatsSummaryText({
        chats: { restored: 2, skipped: 0 },
        attachments: { total: 3, uploaded: 0, linked: 0, failed: 3 },
      }),
    ).toBe('Chats: 2 restored, 0 skipped (already exist) · Attachments: 0 uploaded, 3 failed');
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
    expect(tags).toEqual([{ type: TEMPLATES, id: 10 }, ...PROJECT_ENTITY_TAG_TYPES, ...CHAT_TAG_TYPES]);
    expect(tags).toEqual(expect.arrayContaining(['TAG_TYPE_FOLDERS', 'TAG_TYPE_MESSAGES']));
  });

  it('keeps the chat caches when chats are not restored', () => {
    expect(getRestoreInvalidatedTags(undefined, { projectId: 10, restoreChats: 'none' }, TEMPLATES)).toEqual([
      { type: TEMPLATES, id: 10 },
      ...PROJECT_ENTITY_TAG_TYPES,
    ]);
  });

  it('refetches agent details after any real restore, so a replace shows the restored version', () => {
    const tags = getRestoreInvalidatedTags(undefined, { projectId: 10, restoreChats: 'none' }, TEMPLATES);
    expect(tags).toEqual(
      expect.arrayContaining(['TAG_TYPE_APPLICATION_DETAILS', 'TOOLKIT_DETAILS', 'TAG_TYPE_SKILL_DETAILS']),
    );
  });

  it('invalidates nothing for a preview, an inspection or a failure', () => {
    const args = { projectId: 10, restoreChats: 'with_attachments' };
    expect(getRestoreInvalidatedTags(undefined, { ...args, dryRun: true }, TEMPLATES)).toEqual([]);
    expect(getRestoreInvalidatedTags(undefined, { ...args, inspect: true }, TEMPLATES)).toEqual([]);
    expect(getRestoreInvalidatedTags({ status: 500 }, args, TEMPLATES)).toEqual([]);
  });
});

describe('getSkillFilesSummaryText', () => {
  it('is empty when the restore wrote no skill file rows', () => {
    expect(getSkillFilesSummaryText(undefined)).toBe('');
    expect(getSkillFilesSummaryText({ skill_files: { total: 0 } })).toBe('');
  });

  it('reports every count', () => {
    expect(
      getSkillFilesSummaryText({
        skill_files: { total: 22, present: 2, uploaded: 20, missing: 0, missing_paths: [], unchecked: false },
      }),
    ).toBe('Skill files: 22 total, 2 present, 20 uploaded, 0 missing');
  });

  it('names the paths of the missing files', () => {
    expect(
      getSkillFilesSummaryText({
        skill_files: { total: 3, present: 1, uploaded: 0, missing: 2, missing_paths: ['a.md', 'b/c.py'] },
      }),
    ).toBe('Skill files: 3 total, 1 present, 0 uploaded, 2 missing (a.md, b/c.py)');
  });

  it('names at most five missing paths and says when there are more', () => {
    const paths = ['a.md', 'b.md', 'c.md', 'd.md', 'e.md', 'f.md', 'g.md'];
    expect(
      getSkillFilesSummaryText({
        skill_files: { total: 7, present: 0, uploaded: 0, missing: 7, missing_paths: paths },
      }),
    ).toBe('Skill files: 7 total, 0 present, 0 uploaded, 7 missing (a.md, b.md, c.md, d.md, e.md and more)');
  });

  it('names exactly five missing paths without "and more"', () => {
    const paths = ['a.md', 'b.md', 'c.md', 'd.md', 'e.md'];
    expect(
      getSkillFilesSummaryText({
        skill_files: { total: 5, present: 0, uploaded: 0, missing: 5, missing_paths: paths },
      }),
    ).toBe('Skill files: 5 total, 0 present, 0 uploaded, 5 missing (a.md, b.md, c.md, d.md, e.md)');
  });

  it('says when storage could not be checked', () => {
    expect(getSkillFilesSummaryText({ skill_files: { total: 4, unchecked: true } })).toBe(
      'Skill files: 4 not checked (storage unavailable)',
    );
  });
});

describe('getRestoreWarningText', () => {
  it('is empty when every file was restored, and after a preview', () => {
    expect(getRestoreWarningText(undefined)).toBe('');
    expect(getRestoreWarningText({ attachments: { failed: 0 }, skill_files: { missing: 0 } })).toBe('');
    expect(
      getRestoreWarningText({ dry_run: true, attachments: { failed: 2 }, skill_files: { missing: 3 } }),
    ).toBe('');
  });

  it('names failed attachments or missing skill files', () => {
    expect(getRestoreWarningText({ attachments: { failed: 3 } })).toBe(
      'Restore completed. 3 attachment file(s) could not be restored.',
    );
    expect(getRestoreWarningText({ skill_files: { missing: 2 } })).toBe(
      'Restore completed. 2 skill file(s) could not be restored.',
    );
  });

  it('folds both into one warning', () => {
    expect(getRestoreWarningText({ attachments: { failed: 3 }, skill_files: { missing: 2 } })).toBe(
      'Restore completed. 3 attachment file(s) and 2 skill file(s) could not be restored.',
    );
  });

  it('does not warn when the skill files could not be checked', () => {
    expect(getRestoreWarningText({ skill_files: { total: 4, missing: 0, unchecked: true } })).toBe('');
  });
});
