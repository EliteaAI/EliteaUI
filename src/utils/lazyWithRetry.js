import { lazy } from 'react';

/**
 * Session storage key to track reload attempts and prevent infinite reload loops
 */
const CHUNK_RELOAD_KEY = 'chunk_load_reload_attempted';

/**
 * Check if this is a chunk loading error (stale asset after deployment)
 * @param {Error} error - The error to check
 * @returns {boolean}
 */
const isChunkLoadError = error => {
  const message = error?.message || '';
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('MIME type') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module')
  );
};

/**
 * Wrapper around React.lazy that handles chunk loading failures gracefully.
 *
 * When a deployment occurs, asset filenames change due to content hashing.
 * Users with cached HTML may try to load old chunk filenames that no longer exist.
 * This wrapper detects such failures and automatically reloads the page to fetch
 * fresh assets.
 *
 * @param {() => Promise<{default: React.ComponentType}>} importFn - The dynamic import function
 * @param {Object} options - Configuration options
 * @param {number} options.retries - Number of retry attempts before reload (default: 1)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @returns {React.LazyExoticComponent}
 *
 * @example
 * // Instead of:
 * const MyComponent = lazy(() => import('./MyComponent'));
 *
 * // Use:
 * const MyComponent = lazyWithRetry(() => import('./MyComponent'));
 */
export function lazyWithRetry(importFn, options = {}) {
  const { retries = 1, retryDelay = 1000 } = options;

  return lazy(async () => {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Clear reload flag on successful load
        if (attempt === 0) {
          sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        }

        const module = await importFn();
        return module;
      } catch (error) {
        lastError = error;

        // Only handle chunk loading errors
        if (!isChunkLoadError(error)) {
          throw error;
        }

        // eslint-disable-next-line no-console
        console.warn(
          `[lazyWithRetry] Chunk load failed (attempt ${attempt + 1}/${retries + 1}):`,
          error.message,
        );

        // If we have retries left, wait and try again
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // All retries exhausted - check if we should reload
        const hasReloadedRecently = sessionStorage.getItem(CHUNK_RELOAD_KEY);

        if (!hasReloadedRecently) {
          // Mark that we're about to reload to prevent infinite loops
          sessionStorage.setItem(CHUNK_RELOAD_KEY, Date.now().toString());

          // eslint-disable-next-line no-console
          console.warn('[lazyWithRetry] Reloading page to fetch fresh assets...');

          // Give a small delay for the console message to be visible
          await new Promise(resolve => setTimeout(resolve, 100));

          // Reload the page to get fresh assets
          window.location.reload();

          // Return a placeholder component while the page reloads
          // This prevents React from throwing before the reload completes
          return { default: () => null };
        }

        // We already tried reloading - don't create an infinite loop
        // Let the error propagate to the ErrorBoundary
        // eslint-disable-next-line no-console
        console.error(
          '[lazyWithRetry] Chunk load failed even after page reload. ' +
            'The ErrorBoundary will handle this error.',
        );
        throw error;
      }
    }

    throw lastError;
  });
}

export default lazyWithRetry;
