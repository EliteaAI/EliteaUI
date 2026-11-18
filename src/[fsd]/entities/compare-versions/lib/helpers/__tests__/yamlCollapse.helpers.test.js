// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { Chunk } from '@codemirror/merge';
import { Text } from '@codemirror/state';

import { getCollapsedLineRanges } from '../yamlCollapse.helpers';

const lines = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}${index}: v`);

// The ranges hidden on each side for two versions of a text, from the real merge diff
const rangesOfBoth = (baseLines, comparedLines) => {
  const base = Text.of(baseLines);
  const compared = Text.of(comparedLines);
  const chunks = Chunk.build(base, compared);
  return {
    base: getCollapsedLineRanges(
      base,
      chunks.map(chunk => ({ from: chunk.fromA, to: chunk.toA })),
    ),
    compared: getCollapsedLineRanges(
      compared,
      chunks.map(chunk => ({ from: chunk.fromB, to: chunk.toB })),
    ),
  };
};

// The ranges hidden on the base side
const rangesFor = (baseLines, comparedLines) => rangesOfBoth(baseLines, comparedLines).base;

const sizes = ranges => ranges.map(({ fromLine, toLine }) => toLine - fromLine + 1);

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

  // A change with no lines on one side. Distinct new lines, so the diff is a pure insertion or removal.
  const plain = lines('k', 40);
  const withNew = [...plain.slice(0, 20), 'new1: x', 'new2: x', ...plain.slice(20)];

  it('hides the same blocks on both sides when lines are only added', () => {
    const { base, compared } = rangesOfBoth(plain, withNew);

    // Both sides collapse the same number of unchanged lines, so the editors stay in line
    expect(sizes(base)).toEqual([17, 17]);
    expect(sizes(compared)).toEqual([17, 17]);
    // 3 lines of context after the change on each side: base 21-23, compared 23-25 (after new 21-22)
    expect(base[1]).toEqual({ fromLine: 24, toLine: 40 });
    expect(compared[1]).toEqual({ fromLine: 26, toLine: 42 });
  });

  it('hides the same blocks on both sides when lines are only removed', () => {
    const { base, compared } = rangesOfBoth(withNew, plain);

    expect(sizes(base)).toEqual([17, 17]);
    expect(sizes(compared)).toEqual([17, 17]);
    // 3 lines of context after the change on each side: base 23-25 (after removed 21-22), compared 21-23
    expect(base[1]).toEqual({ fromLine: 26, toLine: 42 });
    expect(compared[1]).toEqual({ fromLine: 24, toLine: 40 });
  });

  it('collapses nothing in identical texts', () => {
    expect(rangesFor(lines('k', 20), lines('k', 20))).toEqual([]);
  });
});
