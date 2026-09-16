import { useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useGetCustomThemeQuery } from '@/[fsd]/shared/api';
import { ThemeModeOptions } from '@/common/constants';

/**
 * Single source of truth for custom theme data.
 * Returns custom palette / logo only while the Custom theme mode is selected and the data is available.
 * Refetches when switching to Custom mode to get the latest theme data.
 */
export const useCustomTheme = () => {
  const mode = useSelector(state => state.settings.mode);
  const isCustomTheme = mode === ThemeModeOptions.Custom;

  const { data, refetch } = useGetCustomThemeQuery(undefined, {
    skip: !isCustomTheme,
    refetchOnMountOrArgChange: true,
  });

  // Refetch when switching to Custom mode to get latest theme data
  useEffect(() => {
    if (isCustomTheme) {
      refetch();
    }
  }, [isCustomTheme, refetch]);

  return useMemo(
    () => ({
      isCustomTheme,
      customPalette: (isCustomTheme && data?.palette) || null,
      customLogo: (isCustomTheme && data?.logo) || null,
    }),
    [isCustomTheme, data],
  );
};
