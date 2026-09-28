import { describe, expect, it } from 'vitest';

import { getRestoreErrorMessage } from '../projectBackup.helpers.js';

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
