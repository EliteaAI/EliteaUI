import RouteDefinitions from '@/routes';

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
