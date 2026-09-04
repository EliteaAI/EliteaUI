import { useMemo } from 'react';

import { useLocation, useParams, useSearchParams } from 'react-router-dom';

import { useSkillDetailsQuery } from '@/[fsd]/features/skill/api';
import { BreadcrumbHelpers } from '@/[fsd]/shared/lib/helpers';
import { useApplicationDetailsQuery } from '@/api/applications';
import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { SearchParams } from '@/common/constants.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

/**
 * Fully resolved breadcrumb trail for the current route, empty when the route declares no crumbs.
 * Entity name queries reuse the same cache keys as the detail pages so no extra request is issued.
 */
export const useBreadcrumbTrail = () => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const projectId = useSelectedProjectId();
  const params = useParams();

  const trail = useMemo(() => BreadcrumbHelpers.resolveBreadcrumbTrail(pathname), [pathname]);
  const entityId = useMemo(() => BreadcrumbHelpers.getBreadcrumbEntityId(trail), [trail]);

  const isToolkit = !!params.toolkitId || !!params.mcpId;
  const isSkill = !!params.skillId;
  const isAgent = !isToolkit && !isSkill && (!!params.agentId || !!params.appId);

  const { data: toolkitDetails } = useToolkitsDetailsQuery(
    { projectId, toolkitId: entityId },
    { skip: !isToolkit || !projectId || !entityId },
  );
  const { data: applicationDetails } = useApplicationDetailsQuery(
    { projectId, applicationId: entityId },
    { skip: !isAgent || !projectId || !entityId },
  );
  const { data: skillDetails } = useSkillDetailsQuery(
    { projectId, skillId: entityId },
    { skip: !isSkill || !projectId || !entityId },
  );

  const entityName =
    toolkitDetails?.name ||
    applicationDetails?.name ||
    skillDetails?.name ||
    searchParams.get(SearchParams.Name) ||
    '';

  return useMemo(() => BreadcrumbHelpers.applyBreadcrumbLabels(trail, entityName), [trail, entityName]);
};

/**
 * Whether the current route declares a breadcrumb trail, without subscribing to the entity name query.
 */
export const useHasBreadcrumbTrail = () => {
  const { pathname } = useLocation();

  return useMemo(() => BreadcrumbHelpers.resolveBreadcrumbTrail(pathname).length > 0, [pathname]);
};
