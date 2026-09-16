import { useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { createTheme } from '@mui/material/styles';

import getDesignTokens from '@/MainTheme';
import { useCustomTheme } from '@/[fsd]/shared/lib/hooks/useCustomTheme.hooks';
import { ThemeModeOptions } from '@/common/constants';
import lightPalette from '@/lightPalette';

const getSystemPreference = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const useEliteATheme = () => {
  const mode = useSelector(state => state.settings.mode);
  const { isCustomTheme, customPalette } = useCustomTheme();

  const [systemPreference, setSystemPreference] = useState(getSystemPreference);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setSystemPreference(e.matches ? 'dark' : 'light');

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedMode = useMemo(() => {
    if (mode === ThemeModeOptions.System) return systemPreference;
    // Custom palette defines its own base mode; fall back to dark while loading or on error
    if (isCustomTheme) return customPalette?.mode === ThemeModeOptions.Light ? 'light' : 'dark';

    return mode;
  }, [mode, systemPreference, isCustomTheme, customPalette]);

  const isDarkMode = resolvedMode === 'dark';

  const globalTheme = useMemo(() => {
    return createTheme(getDesignTokens(resolvedMode, customPalette));
  }, [resolvedMode, customPalette]);

  const localGridTheme = useMemo(() => {
    if (isDarkMode) return createTheme(globalTheme, {});

    // DataGrid reads `background.default` as a colour string, but our palettes nest it as
    // { primary, secondary }. Read the value back off the resolved theme so a light custom palette gets its
    // own colour here instead of the hardcoded Elitea one.
    return createTheme(globalTheme, {
      palette: {
        mode: 'light',
        background: {
          default:
            globalTheme.palette.background?.default?.secondary ?? lightPalette.background.default.secondary,
        },
      },
    });
  }, [globalTheme, isDarkMode]);

  return {
    globalTheme,
    localGridTheme,
    isDarkMode,
    isCustomTheme,
    resolvedMode,
  };
};
