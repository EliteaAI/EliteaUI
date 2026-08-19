import { matchRoutes } from 'react-router-dom';

import { BreadcrumbConstants } from '@/[fsd]/shared/lib/constants';

import { buildRoute } from './navigation.helpers.js';

const { BREADCRUMB_REGISTRY } = BreadcrumbConstants;

const MAX_TRAIL_DEPTH = 8;
const DEFAULT_TAB = 'all';

const registryRoutes = Object.keys(BREADCRUMB_REGISTRY).map(path => ({ path }));

const resolveCrumbLabel = (crumb, entityName) => {
  const { entry, params, isCurrent } = crumb;
  const label = entry.entityName ? entityName : (entry.getLabel?.(params) ?? entry.label ?? '');

  return label || (isCurrent ? (entry.fallbackLabel ?? '') : '');
};

/**
 * Resolve the crumb chain for a pathname by matching the breadcrumb registry and walking `parent` links.
 * @param {string} pathname
 * @returns {Array<{ key: string, entry: object, params: object, to: string, isCurrent: boolean }>}
 *   Empty for routes with no registry entry, so pages can fall back to their own header.
 */
export const resolveBreadcrumbTrail = pathname => {
  const matches = matchRoutes(registryRoutes, pathname);
  const bestMatch = matches?.[matches.length - 1];

  if (!bestMatch) return [];

  const params = { ...bestMatch.params, tab: bestMatch.params.tab ?? DEFAULT_TAB };
  const trail = [];
  const visitedKeys = new Set();
  let key = bestMatch.route.path;

  while (key && BREADCRUMB_REGISTRY[key] && !visitedKeys.has(key) && trail.length < MAX_TRAIL_DEPTH) {
    visitedKeys.add(key);
    const entry = BREADCRUMB_REGISTRY[key];
    trail.unshift({ key, entry, params, to: buildRoute(key, params) });
    key = entry.parent;
  }

  return trail.map((crumb, index) => ({ ...crumb, isCurrent: index === trail.length - 1 }));
};

/**
 * Id of the entity whose name a trail needs, or undefined when no crumb is entity-named.
 * Mirrors how the toolkit pages themselves resolve the id, so the details cache entry is shared.
 */
export const getBreadcrumbEntityId = trail => {
  const entityCrumb = trail.find(crumb => crumb.entry.entityName);

  if (!entityCrumb) return undefined;

  const { params } = entityCrumb;

  return params.mcpId || params.appId || params.toolkitId;
};

/**
 * Attach display labels to a trail, dropping ancestors whose label is not resolvable yet.
 */
export const applyBreadcrumbLabels = (trail, entityName) =>
  trail
    .map(crumb => ({ ...crumb, label: resolveCrumbLabel(crumb, entityName) }))
    .filter(crumb => crumb.isCurrent || crumb.label);
