import { describe, expect, it } from 'vitest';

import { initialCompletedTsOf, resolveIndexEventLabel } from '../indexEvent.helpers';

const entry = (state, updated_on) => ({ state, updated_on });

describe('initialCompletedTsOf', () => {
  it('picks the earliest completed run regardless of order', () => {
    expect(
      initialCompletedTsOf([entry('completed', 300), entry('failed', 100), entry('completed', 200)]),
    ).toBe(200);
  });

  it('is null when nothing completed yet', () => {
    expect(initialCompletedTsOf([entry('failed', 100)])).toBeNull();
    expect(initialCompletedTsOf([])).toBeNull();
    expect(initialCompletedTsOf(undefined)).toBeNull();
  });
});

describe('resolveIndexEventLabel', () => {
  it('separates the first index from every reindex after it', () => {
    expect(resolveIndexEventLabel(entry('completed', 200), 200)).toBe('Indexed');
    expect(resolveIndexEventLabel(entry('completed', 300), 200)).toBe('Reindexed');
  });

  it('names the remaining terminal states', () => {
    expect(resolveIndexEventLabel(entry('failed', 400), 200)).toBe('Failed');
    expect(resolveIndexEventLabel(entry('cancelled', 400), 200)).toBe('Stopped');
    expect(resolveIndexEventLabel(entry('partly_indexed', 400), 200)).toBe('Partially Indexed');
    expect(resolveIndexEventLabel(entry('scheduled_reindex', 400), 200)).toBe('Reindexed by schedule');
    expect(resolveIndexEventLabel(entry('run_test', 400), 200)).toBe('Search index');
  });

  it('falls back to the raw state so an unknown one is never mislabelled', () => {
    expect(resolveIndexEventLabel(entry('something_new', 400), 200)).toBe('something_new');
  });
});
