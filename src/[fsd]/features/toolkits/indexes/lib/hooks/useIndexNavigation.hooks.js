import { useCallback, useMemo } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

const DEFAULT_TAB = 'all';

export const useIndexNavigation = toolkitId => {
  const navigate = useNavigate();
  const { tab = DEFAULT_TAB } = useParams();
  const projectId = useSelectedProjectId();

  const buildIndexPath = useCallback(
    (template, indexName) => {
      const path = template.replace(':tab', tab).replace(':toolkitId', String(toolkitId ?? ''));
      return indexName === undefined ? path : path.replace(':indexName', encodeURIComponent(indexName));
    },
    [tab, toolkitId],
  );

  const goToCreateIndex = useCallback(() => {
    navigate(buildIndexPath(RouteDefinitions.ToolkitIndexNew));
  }, [buildIndexPath, navigate]);

  const goToIndex = useCallback(
    index => {
      const name = index?.metadata?.collection;
      if (!name) return;
      navigate(buildIndexPath(RouteDefinitions.ToolkitIndex, name));
    },
    [buildIndexPath, navigate],
  );

  const openIndexInNewTab = useCallback(
    index => {
      const name = index?.metadata?.collection;
      if (!name) return;
      const url = NavigationHelpers.buildAbsoluteAppUrl(
        projectId,
        buildIndexPath(RouteDefinitions.ToolkitIndex, name),
      );
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [buildIndexPath, projectId],
  );

  return useMemo(
    () => ({ goToCreateIndex, goToIndex, openIndexInNewTab }),
    [goToCreateIndex, goToIndex, openIndexInNewTab],
  );
};
