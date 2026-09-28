// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const CACHE_KEY = 'customTheme.v1';

// The module memoizes its first storage read, so each test imports it fresh.
const importHelpers = () => import('../customThemeCache.helpers');

class StorageMock {
  constructor() {
    this._store = {};
  }

  get length() {
    return Object.keys(this._store).length;
  }

  key(index) {
    return Object.keys(this._store)[index] ?? null;
  }

  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null;
  }

  setItem(key, value) {
    this._store[String(key)] = String(value);
  }

  removeItem(key) {
    delete this._store[String(key)];
  }

  clear() {
    this._store = {};
  }
}

// Override the global Storage class with our mock so that
// vi.spyOn(Storage.prototype, ...) targets our implementation, not any
// native Node.js Storage that may be undefined or cause illegal invocations.
globalThis.Storage = StorageMock;

const localStorageMock = new StorageMock();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('customThemeCache.helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('returns null when nothing is cached', async () => {
    const { getCachedCustomTheme } = await importHelpers();

    expect(getCachedCustomTheme()).toBeNull();
  });

  it('reads a theme written by an earlier page load', async () => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ palette: { mode: 'dark' }, logo: 'https://cdn/logo.svg' }),
    );
    const { getCachedCustomTheme } = await importHelpers();

    expect(getCachedCustomTheme()).toEqual({ palette: { mode: 'dark' }, logo: 'https://cdn/logo.svg' });
  });

  it('reads storage only once per page load', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ palette: { mode: 'dark' }, logo: null }));
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const { getCachedCustomTheme } = await importHelpers();

    getCachedCustomTheme();
    getCachedCustomTheme();
    getCachedCustomTheme();

    expect(getItem).toHaveBeenCalledTimes(1);
    getItem.mockRestore();
  });

  it('ignores corrupted cache entries', async () => {
    localStorage.setItem(CACHE_KEY, '{not json');
    const { getCachedCustomTheme } = await importHelpers();

    expect(getCachedCustomTheme()).toBeNull();
  });

  it('persists the theme returned by the backend', async () => {
    const { getCachedCustomTheme, persistCustomTheme } = await importHelpers();
    const palette = { mode: 'dark', background: { default: { primary: '#0E1312' } } };

    persistCustomTheme({ palette, logo: 'https://cdn/logo.svg' });

    expect(JSON.parse(localStorage.getItem(CACHE_KEY))).toEqual({
      palette,
      logo: 'https://cdn/logo.svg',
    });
    expect(getCachedCustomTheme()).toEqual({ palette, logo: 'https://cdn/logo.svg' });
  });

  it('clears the cache when the backend reports no custom theme', async () => {
    const { getCachedCustomTheme, persistCustomTheme } = await importHelpers();

    persistCustomTheme({ palette: { mode: 'dark' }, logo: 'https://cdn/logo.svg' });
    persistCustomTheme({ palette: null, logo: null });

    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    expect(getCachedCustomTheme()).toBeNull();
  });

  it('survives storage being unavailable', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { getCachedCustomTheme, persistCustomTheme } = await importHelpers();

    expect(() => persistCustomTheme({ palette: { mode: 'dark' }, logo: null })).not.toThrow();
    expect(getCachedCustomTheme()).toEqual({ palette: { mode: 'dark' }, logo: null });

    setItem.mockRestore();
  });
});
