import { useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { useGetCustomThemeQuery } from '@/[fsd]/shared/api';
import { ThemeModeOptions } from '@/common/constants';
import { actions } from '@/slices/settings';

/**
 * Falls back to the System theme when the selected Custom theme no longer exists.
 *
 * `mode` is persisted in localStorage, so a user who picked Custom keeps that choice after the admin turns the
 * custom theme off. Without this they get a theme toggle with nothing selected and an app locked to the dark
 * fallback, with no hint of why. Mount this once, at the app root.
 */
export const useCustomThemeGuard = () => {
  const mode = useSelector(state => state.settings.mode);
  const dispatch = useDispatch();
  const isCustomTheme = mode === ThemeModeOptions.Custom;

  const { data, isSuccess } = useGetCustomThemeQuery(undefined, { skip: !isCustomTheme });

  // Only act on a successful response - a transient error must not throw away the user's choice.
  const hasCustomTheme = Boolean(data?.palette || data?.logo);

  useEffect(() => {
    if (isCustomTheme && isSuccess && !hasCustomTheme) {
      dispatch(actions.setMode(ThemeModeOptions.System));
    }
  }, [isCustomTheme, isSuccess, hasCustomTheme, dispatch]);
};
