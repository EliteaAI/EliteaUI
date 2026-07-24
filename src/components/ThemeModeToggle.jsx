import { memo, useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { Tab } from '@/[fsd]/shared/ui';
import MoonIcon from '@/assets/moon-icon.svg?react';
import SunIcon from '@/assets/sun-icon.svg?react';
import { ThemeModeOptions } from '@/common/constants';
import { actions } from '@/slices/settings';

// Shared component (src/components/) — never hardcodes feature-scoped testids
// (.agents/testing.md § Locator policy). Caller-supplied `<part>TestId` props,
// same shape as the sibling ViewToggle.jsx (tableViewTestId/cardViewTestId).
const ThemeModeToggle = memo(({ darkToggleTestId, lightToggleTestId } = {}) => {
  const mode = useSelector(state => state.settings.mode);
  const dispatch = useDispatch();

  const onChange = useCallback(() => {
    dispatch(actions.switchMode());
  }, [dispatch]);

  const themeArrayBtn = useMemo(
    () => [
      {
        value: ThemeModeOptions.Dark,
        buttonProps: { 'data-testid': darkToggleTestId },
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
        buttonProps: { 'data-testid': lightToggleTestId },
        icon: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SunIcon />
            <Typography variant="labelSmall">Light</Typography>
          </Box>
        ),
        tooltip: 'Light theme',
      },
    ],
    [darkToggleTestId, lightToggleTestId],
  );

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
