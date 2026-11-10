// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { Chunk } from '@codemirror/merge';
import { Text } from '@codemirror/state';

import { getCollapsedLineRanges } from '../yamlCollapse.helpers';

const lines = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}${index}: v`);

// The ranges hidden on the base side for two versions of a text
const rangesFor = (baseLines, comparedLines) => {
  const base = Text.of(baseLines);
  const chunks = Chunk.build(base, Text.of(comparedLines)).map(chunk => ({
    from: chunk.fromA,
    to: chunk.toA,
  }));
  return getCollapsedLineRanges(base, chunks);
};

const between = size => [
  ['changeA: 1', ...lines('k', size), 'changeB: 1'],
  ['changeA: 2', ...lines('k', size), 'changeB: 2'],
];

describe('getCollapsedLineRanges (AC-8)', () => {
  it('never collapses an unchanged block of 6 lines or fewer', () => {
    expect(rangesFor(...between(6))).toEqual([]);
    expect(rangesFor(['a: 1', ...lines('k', 6)], ['a: 2', ...lines('k', 6)])).toEqual([]);
    expect(rangesFor([...lines('k', 6), 'a: 1'], [...lines('k', 6), 'a: 2'])).toEqual([]);
  });

  it('keeps the first and last 3 lines of a longer block between two changes', () => {
    // Lines 2 to 13 are unchanged: 2-4 and 11-13 stay, 5-10 collapse
    expect(rangesFor(...between(12))).toEqual([{ fromLine: 5, toLine: 10 }]);
    // A 7-line block hides its middle line
    expect(rangesFor(...between(7))).toEqual([{ fromLine: 5, toLine: 5 }]);
  });

  it('keeps only the 3 lines next to the change at the start or end of the file', () => {
    expect(rangesFor(['a: 1', ...lines('k', 7)], ['a: 2', ...lines('k', 7)])).toEqual([
      { fromLine: 5, toLine: 8 },
    ]);
    expect(rangesFor([...lines('k', 7), 'a: 1'], [...lines('k', 7), 'a: 2'])).toEqual([
      { fromLine: 1, toLine: 4 },
    ]);
  });

  it('collapses nothing in identical texts', () => {
    expect(rangesFor(lines('k', 20), lines('k', 20))).toEqual([]);
  });
});
