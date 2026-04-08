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
    Chat: RouteDefinitions.Chat,
  };

  return pageTypeToListRoute[pageType] ?? fallbackRoute;
};
