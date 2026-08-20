import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { readStickySuiteId, writeStickySuiteId } from '../useStickySuiteSelection.hooks';

// The suite is not run under jsdom, so stand up the minimal sessionStorage the
// helpers touch. The hook itself is a thin useState wrapper over these two.
const store = new Map();
const originalWindow = globalThis.window;

globalThis.window = {
  sessionStorage: {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
  },
};

afterAll(() => {
  globalThis.window = originalWindow;
});

describe('sticky suite selection storage', () => {
  beforeEach(() => store.clear());

  it('round-trips a suite id, scoped per project + agent', () => {
    writeStickySuiteId(1, 19, 7);
    expect(readStickySuiteId(1, 19)).toBe(7);
    expect(readStickySuiteId(1, 20)).toBeNull();
    expect(readStickySuiteId(2, 19)).toBeNull();
  });

  it('clears the entry when the selection is dropped', () => {
    writeStickySuiteId(1, 19, 7);
    writeStickySuiteId(1, 19, null);
    expect(readStickySuiteId(1, 19)).toBeNull();
  });

  it('is a no-op for incomplete keys', () => {
    writeStickySuiteId(null, 19, 7);
    expect(store.size).toBe(0);
    expect(readStickySuiteId(null, 19)).toBeNull();
    expect(readStickySuiteId(1, null)).toBeNull();
  });

  it('returns null for a corrupted stored value', () => {
    writeStickySuiteId(1, 19, 'not-a-number');
    expect(readStickySuiteId(1, 19)).toBeNull();
  });
});
