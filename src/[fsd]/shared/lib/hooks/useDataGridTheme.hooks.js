import { useMemo } from 'react';

import { createTheme, useTheme } from '@mui/material/styles';

/**
 * MUI X DataGrid passes `palette.background.default` to `alpha()`, which expects a colour string. Our
 * palettes nest it as `{ primary, secondary, tertiary }`, so rendering a DataGrid with the app theme throws
 * "color.charAt is not a function". Wrap DataGrids in this theme; it flattens the token to the
 * surface colour the grid sits on.
 */
export const useDataGridTheme = () => {
  const theme = useTheme();

  return useMemo(() => {
    const backgroundDefault = theme.palette.background?.default;

    if (typeof backgroundDefault === 'string') return theme;

    return createTheme(theme, {
      palette: {
        background: {
          default: backgroundDefault?.secondary ?? theme.palette.background?.paper,
        },
      },
    });
  }, [theme]);
};
