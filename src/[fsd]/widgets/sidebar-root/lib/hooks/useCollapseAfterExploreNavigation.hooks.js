import { useEffect, useRef } from 'react';

import { useDispatch } from 'react-redux';
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom';

import { SIDEBAR_COLLAPSE_STATE_KEY } from '@/[fsd]/widgets/sidebar-root/lib/constants/sidebar.constants';
import { actions as settingsActions } from '@/slices/settings';

// Folds the menu once per landed Explore pick, never on Back/Forward/reload
export const useCollapseAfterExploreNavigation = () => {
  const dispatch = useDispatch();
  const { state } = useLocation();
  const navigationType = useNavigationType();
  const collapseId = state?.[SIDEBAR_COLLAPSE_STATE_KEY];
  const handledIdRef = useRef(null);

  useEffect(() => {
    if (!collapseId || collapseId === handledIdRef.current) return;
    handledIdRef.current = collapseId;
    if (navigationType === NavigationType.Pop) return;
    dispatch(settingsActions.setSideBarCollapsed(true));
  }, [collapseId, dispatch, navigationType]);
};
