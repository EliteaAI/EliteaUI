import { useCallback } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';

const DEFAULT_TAB = 'all';

export const useRunHistoryNavigation = ({ entityId, historyRoute }) => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { search } = useLocation();

  const goToRunHistory = useCallback(() => {
    navigate(
      NavigationHelpers.buildRoute(historyRoute, {
        tab: tab ?? DEFAULT_TAB,
        agentId: entityId,
      }) + search,
    );
  }, [navigate, tab, entityId, historyRoute, search]);

  return { goToRunHistory };
};
