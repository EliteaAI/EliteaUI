import { useEffect, useRef } from 'react';

import { useDispatch } from 'react-redux';
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom';

import {
  SIDEBAR_COLLAPSE_STATE_KEY,
  SIDEBAR_EXPAND_STATE_KEY,
} from '@/[fsd]/widgets/sidebar-root/lib/constants/sidebar.constants';
import { actions as settingsActions } from '@/slices/settings';

// Once per landed sidebar pick: Explore, Artifacts, Settings, Help fold the menu, New chat unfolds it.
// Never on Back/Forward/reload
export const useToggleSidebarAfterNavigation = () => {
  const dispatch = useDispatch();
  const { state } = useLocation();
  const navigationType = useNavigationType();
  const collapseId = state?.[SIDEBAR_COLLAPSE_STATE_KEY];
  const pickId = collapseId ?? state?.[SIDEBAR_EXPAND_STATE_KEY];
  const handledIdRef = useRef(null);

  useEffect(() => {
    if (!pickId || pickId === handledIdRef.current) return;
    handledIdRef.current = pickId;
    if (navigationType === NavigationType.Pop) return;
    dispatch(settingsActions.setSideBarCollapsed(!!collapseId));
  }, [collapseId, dispatch, navigationType, pickId]);
};
