import { memo, useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

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
      icon: <MoonIcon />,
      tooltip: 'Dark theme',
    },
    {
      value: ThemeModeOptions.Light,
      icon: <SunIcon />,
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
