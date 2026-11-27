import { describe, expect, it } from 'vitest';

import { areStartersEqual, filterEmptyStarters } from '../conversationStarters.helpers';

describe('filterEmptyStarters', () => {
  it('drops empty and whitespace-only entries', () => {
    expect(filterEmptyStarters(['a', '', '  ', 'b'])).toEqual(['a', 'b']);
  });

  it('treats a missing list as empty', () => {
    expect(filterEmptyStarters(undefined)).toEqual([]);
    expect(filterEmptyStarters(null)).toEqual([]);
  });
});

describe('areStartersEqual', () => {
  it('is true for lists with the same entries in the same order', () => {
    expect(areStartersEqual(['a', 'b'], ['a', 'b'])).toBe(true);
  });

  it('is false when length, order or an entry differs', () => {
    expect(areStartersEqual(['a'], ['a', 'b'])).toBe(false);
    expect(areStartersEqual(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(areStartersEqual(['a'], ['b'])).toBe(false);
  });

  it('counts a missing list as an empty one', () => {
    expect(areStartersEqual(undefined, [])).toBe(true);
    expect(areStartersEqual(null, undefined)).toBe(true);
    expect(areStartersEqual(undefined, ['a'])).toBe(false);
  });
});
