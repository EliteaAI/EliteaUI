import { useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useGetCustomThemeQuery } from '@/[fsd]/shared/api';
import { CustomThemeCacheHelpers } from '@/[fsd]/shared/lib/helpers';
import { ThemeModeOptions } from '@/common/constants';

/**
 * Single source of truth for custom theme data.
 * Returns custom palette / logo only while the Custom theme mode is selected and the data is available.
 *
 * Until the request resolves the last known theme is served from localStorage, so a reload paints the custom
 * theme on the first frame instead of flashing the built-in dark palette (see `customThemeCache.helpers`).
 *
 * Read-only on purpose: this hook is called from `BrandLogo` and `useEliteATheme`, both of which render once
 * per chat message, so it must never force a fetch of its own. Freshness is owned elsewhere - a page reload
 * starts with an empty cache, and picking Custom in `ThemeModeToggle` invalidates `CUSTOM_THEME_TAG`, which
 * refetches once for every subscriber.
 */
export const useCustomTheme = () => {
  const mode = useSelector(state => state.settings.mode);
  const isCustomTheme = mode === ThemeModeOptions.Custom;

  const { data } = useGetCustomThemeQuery(undefined, { skip: !isCustomTheme });

  useEffect(() => {
    if (data) CustomThemeCacheHelpers.persistCustomTheme(data);
  }, [data]);

  const theme = data ?? CustomThemeCacheHelpers.getCachedCustomTheme();

  return useMemo(
    () => ({
      isCustomTheme,
      customPalette: (isCustomTheme && theme?.palette) || null,
      customLogo: (isCustomTheme && theme?.logo) || null,
    }),
    [isCustomTheme, theme],
  );
};
