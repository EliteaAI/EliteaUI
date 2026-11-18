import { useCallback } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { SearchParams } from '@/common/constants';

/**
 * Opens a schedule page nested in the current entity editor: the page keeps the editor search
 * (viewMode, so the entity crumb opens the editor), takes the schedule's version, and comes back to
 * this editor location.
 *
 * @returns {(to: { pathname: string, search?: string }, versionId?: number) => void}
 */
export const useOpenScheduleNested = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  return useCallback(
    (to, versionId) => {
      const params = new URLSearchParams(search);
      // Params of the link itself win over the editor search
      new URLSearchParams(to.search).forEach((value, key) => params.set(key, value));
      if (versionId) params.set(SearchParams.VersionId, versionId);
      const formSearch = params.toString();
      navigate({ ...to, search: formSearch && `?${formSearch}` }, { state: { returnTo: pathname + search } });
    },
    [navigate, pathname, search],
  );
};
