import { describe, expect, it } from 'vitest';

import { buildCaseContentColumns } from '../dataset.helpers';

const expectedColumn = caseItem =>
  buildCaseContentColumns(caseItem).find(col => col.key === 'expectedOutput');

describe('buildCaseContentColumns', () => {
  it('says a dataset case has no expected output', () => {
    expect(expectedColumn({ input: 'q', output: 'a' }).emptyText).toMatch(/^No expected output/);
  });

  it('says a stored chat turn has no reference to compare against', () => {
    expect(expectedColumn({ input: 'q', output: 'a', source: { conversation_id: 'c-1' } }).emptyText).toBe(
      'Taken from a stored chat turn, so there is no expected output.',
    );
  });

  it('adds the instructions column only when the case has a structure', () => {
    expect(buildCaseContentColumns({ input: 'q' }).map(col => col.key)).toEqual([
      'input',
      'actualOutput',
      'expectedOutput',
    ]);
    expect(buildCaseContentColumns({ input: 'q', structure: 'Be brief' }).at(-1).key).toBe('instructions');
  });
});
