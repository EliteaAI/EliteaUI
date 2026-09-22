import { describe, expect, it } from 'vitest';

import {
  buildSuiteMenuItems,
  resolveActiveSuiteId,
  sortSuitesByDate,
  withSuiteSearchParam,
} from '../suite.helpers';

describe('sortSuitesByDate', () => {
  it('orders suites newest first by updated_at, falling back to created_at', () => {
    const suites = [
      { id: 1, created_at: '2026-01-01T00:00:00Z' },
      { id: 2, updated_at: '2026-03-01T00:00:00Z' },
      { id: 3, updated_at: '2026-02-01T00:00:00Z' },
    ];

    expect(sortSuitesByDate(suites).map(s => s.id)).toEqual([2, 3, 1]);
  });

  it('does not mutate the source list and tolerates no argument', () => {
    const suites = [{ id: 1, updated_at: '2026-01-01T00:00:00Z' }, { id: 2 }];
    sortSuitesByDate(suites);

    expect(suites.map(s => s.id)).toEqual([1, 2]);
    expect(sortSuitesByDate()).toEqual([]);
  });
});

describe('buildSuiteMenuItems', () => {
  const suites = [
    { id: 1, name: 'Oldest', created_at: '2026-01-01T00:00:00Z' },
    { id: 2, name: 'Newest', updated_at: '2026-03-01T00:00:00Z' },
    { id: 3, name: 'Middle', updated_at: '2026-02-01T00:00:00Z' },
  ];

  it('lifts the active suite to the top and badges it', () => {
    const items = buildSuiteMenuItems(suites, 1, 'Previous');

    expect(items).toEqual([
      { id: 1, label: 'Oldest', badge: 'Previous' },
      { id: 2, label: 'Newest' },
      { id: 3, label: 'Middle' },
    ]);
  });

  it('omits the badge when none is asked for, keeping the order', () => {
    expect(buildSuiteMenuItems(suites, 3)).toEqual([
      { id: 3, label: 'Middle' },
      { id: 2, label: 'Newest' },
      { id: 1, label: 'Oldest' },
    ]);
  });

  it('falls back to newest-first when no suite is active', () => {
    expect(buildSuiteMenuItems(suites, null, 'Previous').map(item => item.id)).toEqual([2, 3, 1]);
    expect(buildSuiteMenuItems()).toEqual([]);
  });
});

describe('withSuiteSearchParam', () => {
  it('adds suiteId while keeping the params it was given', () => {
    expect(withSuiteSearchParam('viewMode=public', 42)).toBe('viewMode=public&suiteId=42');
  });

  it('leaves the search untouched when there is no suite', () => {
    expect(withSuiteSearchParam('viewMode=public', null)).toBe('viewMode=public');
    expect(withSuiteSearchParam('', undefined)).toBe('');
  });

  it('replaces a stale suiteId rather than appending a second one', () => {
    expect(withSuiteSearchParam('suiteId=7', 9)).toBe('suiteId=9');
  });
});

describe('resolveActiveSuiteId', () => {
  it('reads the suite the child page was opened from', () => {
    expect(resolveActiveSuiteId(new URLSearchParams('suiteId=9'))).toBe(9);
  });

  it('returns null when no suite is identified or the value is not a number', () => {
    expect(resolveActiveSuiteId(new URLSearchParams(''))).toBeNull();
    expect(resolveActiveSuiteId(new URLSearchParams('suiteId=abc'))).toBeNull();
    expect(resolveActiveSuiteId(undefined)).toBeNull();
  });
});
