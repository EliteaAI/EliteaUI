import { useCallback } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import useNavBlocker from '@/hooks/useNavBlocker';
import RouteDefinitions from '@/routes';

export const useSidebarNavigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isBlockNav, isStreaming, setIsResetApiState, resetApiState } = useNavBlocker();
  const personalProjectId = useSelector(state => state.user.personal_project_id);

  const navigateToPage = useCallback(
    (pagePath, breadCrumb) => event => {
      // The item is a real link (so the browser can open it in a new tab); a plain click is handled here
      event?.preventDefault?.();
      if (!personalProjectId) {
        navigate(RouteDefinitions.Onboarding);
        return;
      }
      if (pagePath === pathname) return;
      if (isBlockNav || isStreaming) {
        setIsResetApiState(true);
      } else {
        resetApiState();
      }
      navigate(pagePath, { state: { routeStack: [{ breadCrumb, pagePath }] } });
    },
    [isBlockNav, isStreaming, navigate, pathname, personalProjectId, resetApiState, setIsResetApiState],
  );

  const getLinkTarget = useCallback(
    pagePath => (personalProjectId ? pagePath : RouteDefinitions.Onboarding),
    [personalProjectId],
  );

  return { navigateToPage, getLinkTarget };
};
