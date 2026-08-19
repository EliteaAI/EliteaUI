import { useMemo } from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

import { BreadcrumbHelpers } from '@/[fsd]/shared/lib/helpers';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { SearchParams } from '@/common/constants.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

/**
 * Fully resolved breadcrumb trail for the current route, empty when the route declares no crumbs.
 * The entity name reuses the details cache the toolkit pages already fill, so no extra request is issued.
 */
export const useBreadcrumbTrail = () => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const projectId = useSelectedProjectId();

  const trail = useMemo(() => BreadcrumbHelpers.resolveBreadcrumbTrail(pathname), [pathname]);
  const entityId = useMemo(() => BreadcrumbHelpers.getBreadcrumbEntityId(trail), [trail]);

  const { data } = useToolkitsDetailsQuery(
    { projectId, toolkitId: entityId },
    { skip: !projectId || !entityId },
  );

  const entityName = data?.name || searchParams.get(SearchParams.Name) || '';

  return useMemo(() => BreadcrumbHelpers.applyBreadcrumbLabels(trail, entityName), [trail, entityName]);
};

/**
 * Whether the current route declares a breadcrumb trail, without subscribing to the entity name query.
 */
export const useHasBreadcrumbTrail = () => {
  const { pathname } = useLocation();

  return useMemo(() => BreadcrumbHelpers.resolveBreadcrumbTrail(pathname).length > 0, [pathname]);
};
