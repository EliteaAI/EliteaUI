import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useGetCustomThemeQuery } from '@/[fsd]/shared/api';
import { ThemeModeOptions } from '@/common/constants';

/**
 * Single source of truth for custom theme data.
 * Returns custom palette / logo only while the Custom theme mode is selected and the data is available.
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

  return useMemo(
    () => ({
      isCustomTheme,
      customPalette: (isCustomTheme && data?.palette) || null,
      customLogo: (isCustomTheme && data?.logo) || null,
    }),
    [isCustomTheme, data],
  );
};
