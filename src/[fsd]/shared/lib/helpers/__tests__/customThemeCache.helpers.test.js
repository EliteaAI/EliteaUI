// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const CACHE_KEY = 'customTheme.v1';

// The module memoizes its first storage read, so each test imports it fresh.
const importHelpers = () => import('../customThemeCache.helpers');

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
