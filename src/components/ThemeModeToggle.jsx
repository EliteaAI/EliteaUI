import { memo, useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import ContrastOutlinedIcon from '@mui/icons-material/ContrastOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import { Box, Typography } from '@mui/material';

import { useGetCustomThemeQuery } from '@/[fsd]/shared/api/customThemeApi';
import { Tab } from '@/[fsd]/shared/ui';
import MoonIcon from '@/assets/moon-icon.svg?react';
import SunIcon from '@/assets/sun-icon.svg?react';
import { ThemeModeOptions } from '@/common/constants';
import { actions } from '@/slices/settings';

const ThemeModeToggle = memo(() => {
  const mode = useSelector(state => state.settings.mode);
  const dispatch = useDispatch();
  const { data: customTheme } = useGetCustomThemeQuery();

  // Check if custom theme is available (has palette or logo)
  const hasCustomTheme = Boolean(customTheme?.palette || customTheme?.logo);

  const onChange = useCallback(
    (_event, newValue) => {
      if (newValue) {
        dispatch(actions.setMode(newValue));
      }
    },
    [dispatch],
  );

  const themeArrayBtn = useMemo(() => {
    const buttons = [
      {
        value: ThemeModeOptions.System,
        icon: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ContrastOutlinedIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="labelSmall">System</Typography>
          </Box>
        ),
        tooltip: 'Use system theme',
      },
      {
        value: ThemeModeOptions.Dark,
        icon: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MoonIcon />
            <Typography variant="labelSmall">Dark</Typography>
          </Box>
        ),
        tooltip: 'Dark theme',
      },
      {
        value: ThemeModeOptions.Light,
        icon: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SunIcon />
            <Typography variant="labelSmall">Light</Typography>
          </Box>
        ),
        tooltip: 'Light theme',
      },
    ];

    // Only show Custom option if custom theme is configured
    if (hasCustomTheme) {
      buttons.push({
        value: ThemeModeOptions.Custom,
        icon: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PaletteOutlinedIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="labelSmall">Custom</Typography>
          </Box>
        ),
        tooltip: 'Custom theme',
      });
    }

    return buttons;
  }, [hasCustomTheme]);

  return (
    <Tab.TabGroupButton
      value={mode}
      onChange={onChange}
      arrayBtn={themeArrayBtn}
      size="small"
      customSx={{ minWidth: '6.25rem', justifyContent: 'center' }}
    />
  );
});

ThemeModeToggle.displayName = 'ThemeModeToggle';

export default ThemeModeToggle;
