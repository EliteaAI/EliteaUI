import { useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { SIDEBAR_COLLAPSE_STATE_KEY } from '@/[fsd]/widgets/sidebar-root/lib/constants/sidebar.constants';
import useNavBlocker from '@/hooks/useNavBlocker';
import RouteDefinitions from '@/routes';
import { actions as settingsActions } from '@/slices/settings';

export const useSidebarNavigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isBlockNav, isStreaming, setIsResetApiState, resetApiState } = useNavBlocker();
  const personalProjectId = useSelector(state => state.user.personal_project_id);

  const navigateToPage = useCallback(
    (pagePath, breadCrumb, options = {}) =>
      event => {
        const { collapseSidebar = false } = options;
        // The item is a real link: a modified click is left to the browser (new tab/window), a plain one is handled here
        if (event?.metaKey || event?.ctrlKey || event?.shiftKey || event?.altKey) return;
        event?.preventDefault?.();
        if (!personalProjectId) {
          navigate(RouteDefinitions.Onboarding);
          return;
        }
        if (pagePath === pathname) {
          if (collapseSidebar) dispatch(settingsActions.setSideBarCollapsed(true));
          return;
        }
        if (isBlockNav || isStreaming) {
          setIsResetApiState(true);
        } else {
          resetApiState();
        }
        // A guard may cancel it: useCollapseAfterExploreNavigation folds the menu once it lands
        navigate(pagePath, {
          state: {
            routeStack: [{ breadCrumb, pagePath }],
            ...(collapseSidebar && { [SIDEBAR_COLLAPSE_STATE_KEY]: Date.now() }),
          },
        });
      },
    [
      dispatch,
      isBlockNav,
      isStreaming,
      navigate,
      pathname,
      personalProjectId,
      resetApiState,
      setIsResetApiState,
    ],
  );

  const getLinkTarget = useCallback(
    pagePath => (personalProjectId ? pagePath : RouteDefinitions.Onboarding),
    [personalProjectId],
  );

  return { navigateToPage, getLinkTarget };
};
