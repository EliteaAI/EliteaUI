import { SearchParams } from '@/common/constants';
import RouteDefinitions, { getBasename } from '@/routes';

/**
 * Get the list route for a given page type.
 * @param {string | null} pageType - The page type to get the list route for
 * @param {string} [fallbackRoute] - Optional fallback route if pageType is not found
 * @returns {string | null} The list route or fallbackRoute/null if not found
 */
export const getListRouteByPageType = (pageType, fallbackRoute = null) => {
  if (!pageType) {
    return fallbackRoute;
  }

  const pageTypeToListRoute = {
    ApplicationDetails: RouteDefinitions.Applications,
    AppDetails: RouteDefinitions.Apps,
    ToolkitDetails: RouteDefinitions.Toolkits,
    MCPDetails: RouteDefinitions.MCPs,
    CredentialDetails: RouteDefinitions.Credentials,
    PipelineDetails: RouteDefinitions.Pipelines,
    SkillDetails: RouteDefinitions.Skills,
    ScheduleDetails: RouteDefinitions.Schedules,
    WebhookDetails: RouteDefinitions.Webhooks,
    Chat: RouteDefinitions.Chat,
  };

  return pageTypeToListRoute[pageType] ?? fallbackRoute;
};

/**
 * Build a concrete path from a route pattern by substituting its `:param` placeholders.
 * An optional param (`:tab?`) loses its `?` so it cannot leak into the path as a query-string
 * boundary; a param with no value becomes an empty segment rather than throwing.
 * @param {string} pattern - Route pattern, e.g. '/toolkits/:tab/:toolkitId'
 * @param {Record<string, string | number>} [params] - Values keyed by param name
 * @returns {string} Concrete path with every value URI-encoded
 */
export const buildRoute = (pattern, params = {}) =>
  pattern.replace(/:([A-Za-z_]\w*)\??/g, (_, key) => encodeURIComponent(String(params[key] ?? '')));

/**
 * Build an absolute, shareable URL for a path inside a project workspace, as needed for
 * `window.open` and copy-link affordances.
 * @param {string | number} projectId - Project the path belongs to
 * @param {string} path - Concrete in-app path, e.g. '/toolkits/all/43/index/docs'
 * @returns {string} Absolute URL including origin and router basename
 */
export const buildAbsoluteAppUrl = (projectId, path) =>
  `${window.location.origin}${getBasename()}/${projectId}${path}`;

/**
 * Remove the leading `/{projectId}` switcher segment from a path, preserving the router basename.
 * The id is matched as a whole leading segment: a substring replace would also strike an id that
 * recurs later in the path, and would mangle a longer id that merely starts with it.
 * @param {string} pathname - Path as loaded, with or without the basename
 * @param {string | number} projectId - Project segment to remove
 * @returns {string} Path without the project segment, basename-prefixed
 */
export const stripProjectSegment = (pathname, projectId) => {
  const basename = getBasename();
  const withoutBasename =
    basename && pathname.startsWith(basename) ? pathname.slice(basename.length) : pathname;
  const segment = `/${projectId}`;
  const rest =
    withoutBasename === segment || withoutBasename.startsWith(`${segment}/`)
      ? withoutBasename.slice(segment.length)
      : withoutBasename;
  return `${basename}${rest || '/'}`;
};

const PERSISTENT_SEARCH_PARAMS = [SearchParams.ViewMode, SearchParams.Name];

/**
 * Extract only the search params that should survive navigation between sub-routes
 * (viewMode, name). Page-local params (datasetId, etc.) are intentionally dropped.
 * @param {string} search - The current location.search string
 * @returns {string} A search string containing only persistent params
 */
export const pickPersistentSearch = search => {
  const source = new URLSearchParams(search);
  const result = new URLSearchParams();
  for (const key of PERSISTENT_SEARCH_PARAMS) {
    const value = source.get(key);
    if (value !== null) result.set(key, value);
  }
  return result.toString();
};

/**
 * True when a click is one the browser handles itself as "open elsewhere": Ctrl/Cmd/Shift/Alt+Click or a
 * non-primary button (middle-click). The in-app side effects of a navigation (resetting state, closing a
 * menu that must stay open, ...) must not run for these, because the current tab does not navigate.
 * @param {{ button?: number, ctrlKey?: boolean, metaKey?: boolean, shiftKey?: boolean, altKey?: boolean }} event
 * @returns {boolean}
 */
export const isModifiedClick = event =>
  Boolean(event && (event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey));

/**
 * Prefixes a link `href` with the active project as a leading path segment (`/114/agents/all/5`), the form
 * the `/:projectId/*` route (ProjectSwitcher) understands: it checks the project against the user's list,
 * switches to it and drops the segment. A tab opened from "Open link in new tab" has no per-tab project of
 * its own, so without the segment it could open under whichever project another tab selected last.
 * Only for the `href`: in-app clicks navigate to the clean target.
 * @param {string} href - Router href including the basename, e.g. '/agents/all/5?viewMode=owner#top'
 * @param {string | number | undefined | null} projectId
 * @returns {string} The href unchanged when there is no project or it already names one
 */
export const prependProjectSegment = (href, projectId) => {
  if (!href || projectId === undefined || projectId === null || projectId === '') return href;

  const basename = getBasename();
  const hasBasename = basename && href.startsWith(basename);
  const rest = hasBasename ? href.slice(basename.length) : href;

  // No route starts with a number, so a leading numeric segment is already a project
  if (/^\/\d+(?=[/?#]|$)/.test(rest)) return href;

  return `${hasBasename ? basename : ''}/${projectId}${rest === '/' ? '' : rest}`;
};
