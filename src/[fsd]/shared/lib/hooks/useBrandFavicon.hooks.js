import { useEffect, useRef } from 'react';

import { useCustomTheme } from '@/[fsd]/shared/lib/hooks/useCustomTheme.hooks';

/**
 * Swaps the browser tab favicon to the custom logo while the Custom theme is active,
 * and restores the original favicon when it is not.
 *
 * The logo is preloaded first and the favicon is swapped only once it loads, so a missing or unreachable
 * logo (e.g. a stale cached URL) keeps the original favicon instead of showing a broken tab icon - the same
 * fallback `BrandLogo` applies in the sidebar.
 *
 * Uses link element replacement to force browser to reload the favicon.
 */
export const useBrandFavicon = () => {
  const { customLogo } = useCustomTheme();
  const customLinkRef = useRef(null);

  useEffect(() => {
    // Find the original favicon link
    const originalLink = document.querySelector("link[rel='icon']");
    if (!originalLink || !customLogo) return;

    // Resolve relative paths against the current origin. Appending a cache buster here would corrupt
    // signed logo URLs, which carry their own query string - the backend versions the URL instead.
    const faviconUrl = new URL(customLogo, window.location.origin).toString();

    let isCancelled = false;
    const probe = new Image();

    probe.onload = () => {
      if (isCancelled) return;

      // Hide the original favicon
      originalLink.setAttribute('data-hidden', 'true');
      originalLink.removeAttribute('rel');

      // Create or update custom favicon link
      if (!customLinkRef.current) {
        customLinkRef.current = document.createElement('link');
        customLinkRef.current.id = 'custom-favicon';
        document.head.appendChild(customLinkRef.current);
      }

      customLinkRef.current.rel = 'icon';
      customLinkRef.current.href = faviconUrl;
    };

    // Logo failed to load - keep the original favicon as the fallback
    probe.onerror = () => {};

    probe.src = faviconUrl;

    return () => {
      isCancelled = true;
      probe.onload = null;
      probe.onerror = null;

      // Restore original favicon
      if (originalLink.hasAttribute('data-hidden')) {
        originalLink.removeAttribute('data-hidden');
        originalLink.rel = 'icon';
      }

      // Remove custom favicon link
      if (customLinkRef.current) {
        customLinkRef.current.remove();
        customLinkRef.current = null;
      }
    };
  }, [customLogo]);
};
