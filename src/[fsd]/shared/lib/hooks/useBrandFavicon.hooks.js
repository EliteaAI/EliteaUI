import { useEffect, useRef } from 'react';

import { useCustomTheme } from '@/[fsd]/shared/lib/hooks/useCustomTheme.hooks';

/**
 * Swaps the browser tab favicon to the custom logo while the Custom theme is active,
 * and restores the original favicon when it is not.
 *
 * Uses link element replacement to force browser to reload the favicon.
 */
export const useBrandFavicon = () => {
  const { customLogo } = useCustomTheme();
  const customLinkRef = useRef(null);

  useEffect(() => {
    // Find the original favicon link
    const originalLink = document.querySelector("link[rel='icon']");
    if (!originalLink) return;

    if (customLogo) {
      // Hide the original favicon
      originalLink.setAttribute('data-hidden', 'true');
      originalLink.removeAttribute('rel');

      // Create or update custom favicon link
      if (!customLinkRef.current) {
        customLinkRef.current = document.createElement('link');
        customLinkRef.current.id = 'custom-favicon';
        document.head.appendChild(customLinkRef.current);
      }

      // Ensure the favicon URL is absolute and add cache buster
      const baseUrl = customLogo.startsWith('http') ? customLogo : `${window.location.origin}${customLogo}`;
      const faviconUrl = `${baseUrl}?v=${Date.now()}`;

      customLinkRef.current.rel = 'icon';
      customLinkRef.current.href = faviconUrl;
    }

    return () => {
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
