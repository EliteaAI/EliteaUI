import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { createTheme } from '@mui/material/styles';

import getDesignTokens from '../MainTheme';
import { blue01 } from '../lightPalette';

export default function useEliteATheme() {
  const isDarkMode = useSelector(state => state.settings.mode === 'dark');
  const globalTheme = useMemo(() => {
    return createTheme(getDesignTokens(isDarkMode ? 'dark' : 'light'));
  }, [isDarkMode]);

  const localGridTheme = useMemo(() => {
    return createTheme(
      globalTheme,
      !isDarkMode
        ? {
            palette: {
              mode: 'light',
              background: {
                default: blue01,
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
  };
}
