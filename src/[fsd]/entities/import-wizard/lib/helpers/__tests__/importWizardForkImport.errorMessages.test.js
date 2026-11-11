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
});
