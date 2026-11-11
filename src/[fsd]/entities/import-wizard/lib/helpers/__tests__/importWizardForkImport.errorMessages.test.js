// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import {
  getErrorImportUUID,
  getErrorMessagesByImportUUID,
} from '@/[fsd]/entities/import-wizard/lib/helpers/importWizardForkImport.helpers';

const selectedData = [{ import_uuid: 'agent-1' }, { import_uuid: 'toolkit-1' }];

describe('getErrorMessagesByImportUUID', () => {
  it('groups backend messages by the import_uuid of the item they belong to', () => {
    const errors = {
      skills: [{ index: 0, msg: 'Cannot attach all 50 skills: the project allows at most 10.' }],
      agents: [{ index: 1, msg: 'Validation error' }],
    };

    expect(getErrorMessagesByImportUUID(errors, selectedData)).toEqual({
      'agent-1': ['Cannot attach all 50 skills: the project allows at most 10.'],
      'toolkit-1': ['Validation error'],
    });
  });

  it('ignores non-blocking "reused" messages, consistent with getErrorImportUUID', () => {
    const errors = { toolkits: [{ index: 1, msg: 'Toolkit "x" already exists and was reused' }] };

    expect(getErrorMessagesByImportUUID(errors, selectedData)).toEqual({});
    expect(getErrorImportUUID(errors, selectedData)).toEqual([]);
  });

  it('deduplicates identical messages and tolerates unknown indexes', () => {
    const errors = {
      skills: [
        { index: 0, msg: 'same' },
        { index: 0, msg: 'same' },
        { index: 9, msg: 'orphan' },
      ],
    };

    expect(getErrorMessagesByImportUUID(errors, selectedData)).toEqual({ 'agent-1': ['same'] });
  });

  it('attaches an error to the item named by its import_uuid, not by its index', () => {
    // The index points at the toolkit, but the error names the agent: the named target wins.
    const errors = {
      skills: [
        { index: 1, import_uuid: 'agent-1', version_name: 'base', msg: 'Agent imported with 3 of 5 skills' },
      ],
    };

    expect(getErrorMessagesByImportUUID(errors, selectedData)).toEqual({
      'agent-1': ['Agent imported with 3 of 5 skills'],
    });
    expect(getErrorImportUUID(errors, selectedData)).toEqual(['agent-1']);
  });

  it('falls back to the index for errors that do not name their target', () => {
    const errors = { toolkits: [{ index: 1, msg: 'Toolkit failed' }] };

    expect(getErrorImportUUID(errors, selectedData)).toEqual(['toolkit-1']);
  });

  it('does not fail on an error whose index matches no selected item', () => {
    const errors = { agents: [{ index: 9, msg: 'orphan' }] };

    expect(getErrorImportUUID(errors, selectedData)).toEqual([]);
    expect(getErrorMessagesByImportUUID(errors, selectedData)).toEqual({});
  });
});
