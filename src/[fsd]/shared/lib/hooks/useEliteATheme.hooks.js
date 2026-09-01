import { useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { createTheme } from '@mui/material/styles';

import getDesignTokens from '@/MainTheme';
import { THEME_COLORS } from '@/[fsd]/shared/config/theme';

const getSystemPreference = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const useEliteATheme = () => {
  const mode = useSelector(state => state.settings.mode);

  const [systemPreference, setSystemPreference] = useState(getSystemPreference);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => setSystemPreference(e.matches ? 'dark' : 'light');

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedMode = mode === 'system' ? systemPreference : mode;
  const isDarkMode = resolvedMode === 'dark';

  const globalTheme = useMemo(() => {
    return createTheme(getDesignTokens(resolvedMode));
  }, [resolvedMode]);

  const localGridTheme = useMemo(() => {
    return createTheme(
      globalTheme,
      !isDarkMode
        ? {
            palette: {
              mode: 'light',
              background: {
                default: THEME_COLORS.lightPage,
              },
            },
          }
        : {},
    );
  }, [globalTheme, isDarkMode]);

  return {
    globalTheme,
    localGridTheme,
    isDarkMode,
    resolvedMode,
  };
};
