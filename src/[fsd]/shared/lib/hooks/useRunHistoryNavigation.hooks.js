import { useCallback } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { NavigationConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';

const DEFAULT_TAB = 'all';

export const useRunHistoryNavigation = ({ entityId, historyRoute, entityParam = 'agentId' }) => {
  const navigate = useNavigate();
  const { tab, version } = useParams();
  const { search } = useLocation();

  const goToRunHistory = useCallback(() => {
    const { VERSION_SEARCH_PARAM } = NavigationConstants;
    const params = new URLSearchParams(search);

    if (version) params.set(VERSION_SEARCH_PARAM, version);
    else params.delete(VERSION_SEARCH_PARAM);

    const query = params.toString();

    navigate(
      NavigationHelpers.buildRoute(historyRoute, {
        tab: tab ?? DEFAULT_TAB,
        [entityParam]: entityId,
      }) + (query ? `?${query}` : ''),
    );
  }, [navigate, tab, version, entityId, entityParam, historyRoute, search]);

  return { goToRunHistory };
};
