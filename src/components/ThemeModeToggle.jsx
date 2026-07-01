import { memo, useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { Tab } from '@/[fsd]/shared/ui';
import MoonIcon from '@/assets/moon-icon.svg?react';
import SunIcon from '@/assets/sun-icon.svg?react';
import { ThemeModeOptions } from '@/common/constants';
import { actions } from '@/slices/settings';

const ThemeModeToggle = memo(() => {
  const mode = useSelector(state => state.settings.mode);
  const dispatch = useDispatch();

  const onChange = useCallback(() => {
    dispatch(actions.switchMode());
  }, [dispatch]);

  const themeArrayBtn = [
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

  return (
    <Tab.TabGroupButton
      value={mode}
      onChange={onChange}
      arrayBtn={themeArrayBtn}
      size="small"
    />
  );
});

ThemeModeToggle.displayName = 'ThemeModeToggle';

export default ThemeModeToggle;
