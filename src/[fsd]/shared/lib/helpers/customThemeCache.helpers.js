/**
 * Local cache of the last custom theme the backend returned.
 *
 * `mode` is restored from localStorage synchronously, but the custom palette only arrives once
 * `/admin/custom_theme/prompt_lib` resolves - so on every reload the app would render the built-in dark palette
 * first and visibly swap themes mid-load. Seeding the first render from this cache removes that flash; the
 * request still runs and overwrites the cache, so a theme edited by an admin is picked up on the next load.
 *
 * This only covers the window after the bundle mounts; the default browser background is still shown until
 * then, in every theme mode.
 *
 * The cache is an optimisation only: every read and write is guarded, and a miss simply restores the old
 * loading behaviour.
 */
const CACHE_KEY = 'customTheme.v1';

let memoized;

const readStorage = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const palette = parsed.palette && typeof parsed.palette === 'object' ? parsed.palette : null;
    const logo = typeof parsed.logo === 'string' ? parsed.logo : null;

    return palette || logo ? { palette, logo } : null;
  } catch {
    return null;
  }
};

/**
 * Returns the cached `{ palette, logo }` or null. Reads storage once per page load - this is called on every
 * mount of `useCustomTheme`, including one per chat message.
 */
export const getCachedCustomTheme = () => {
  if (memoized === undefined) memoized = readStorage();

  return memoized;
};

export const clearCachedCustomTheme = () => {
  memoized = null;

  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // storage unavailable - nothing to clear
  }
};

/**
 * Stores the theme the backend just returned. An empty theme (no palette and no logo) clears the cache, so a
 * custom theme deleted by an admin stops being applied on the next load.
 */
export const persistCustomTheme = theme => {
  const palette = theme?.palette && typeof theme.palette === 'object' ? theme.palette : null;
  const logo = typeof theme?.logo === 'string' ? theme.logo : null;

  if (!palette && !logo) {
    clearCachedCustomTheme();

    return;
  }

  memoized = { palette, logo };

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(memoized));
  } catch {
    // quota exceeded or storage blocked - the next load just falls back to the loading state
  }
};
