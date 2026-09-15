import { describe, expect, it } from 'vitest';

import { mergeSecretRows } from '../secretRows.helpers.js';

const newRow = { id: 'new-1', name: '', isNew: true };

const serverRow = (name, overrides = {}) => ({
  id: `existing-${name}`,
  name,
  secretValue: `{{secret.${name}}}`,
  is_default: false,
  allow_external_access: false,
  ...overrides,
});

describe('mergeSecretRows', () => {
  it('starts existing rows over from the server after a fetch, keeping unsaved new rows', () => {
    const localRows = [newRow, { ...serverRow('TOKEN'), secretValue: 'revealed-value' }];
    const serverRows = [serverRow('TOKEN'), serverRow('ADDED')];

    expect(mergeSecretRows(localRows, serverRows, { keepLocalState: false })).toEqual([
      newRow,
      serverRow('TOKEN'),
      serverRow('ADDED'),
    ]);
  });

  it('keeps a revealed or half-typed value when the rows rebuild without a fetch', () => {
    const localRows = [{ ...serverRow('TOKEN'), secretValue: 'typed-but-unsaved' }];

    const [row] = mergeSecretRows(localRows, [serverRow('TOKEN')], { keepLocalState: true });

    expect(row.secretValue).toBe('typed-but-unsaved');
  });

  it('takes the sharing flag and platform lock from the server when keeping local state', () => {
    const localRows = [{ ...serverRow('TOKEN'), secretValue: 'revealed-value' }];
    const serverRows = [serverRow('TOKEN', { allow_external_access: true, is_default: true })];

    const [row] = mergeSecretRows(localRows, serverRows, { keepLocalState: true });

    expect(row).toMatchObject({
      secretValue: 'revealed-value',
      allow_external_access: true,
      is_default: true,
    });
  });

  it('follows the server list for which rows exist, e.g. when a search narrows it', () => {
    const localRows = [newRow, serverRow('TOKEN'), serverRow('FILTERED_OUT')];
    const serverRows = [serverRow('TOKEN'), serverRow('BACK_IN_VIEW')];

    expect(mergeSecretRows(localRows, serverRows, { keepLocalState: true }).map(row => row.id)).toEqual([
      'new-1',
      'existing-TOKEN',
      'existing-BACK_IN_VIEW',
    ]);
  });
});
