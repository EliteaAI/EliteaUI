/**
 * =============================================================================
 * LEGACY OPENAPI TOOLKIT MIGRATION HELPERS
 * =============================================================================
 *
 * TODO: DELETE THIS ENTIRE FILE after migration period (Q1 2026)
 *
 * This file contains helpers to normalize OLD OpenAPI toolkit format to NEW format.
 * Old toolkits stored authentication inline, new toolkits use configuration references.
 *
 * OLD FORMAT:
 * {
 *   settings: {
 *     schema_settings: "...",
 *     selected_tools: [{name: "x"}, "y"],
 *     authentication: { type: "api_key", settings: { api_key: "...", auth_type: "bearer" } }
 *   }
 * }
 *
 * NEW FORMAT:
 * {
 *   settings: {
 *     spec: "...",
 *     selected_tools: ["x", "y"],
 *     openapi_configuration: { id: 123, elitea_title: "my_creds" }  // reference to config entity
 *   }
 * }
 *
 * This migration:
 * - Converts schema_settings → spec
 * - Normalizes selected_tools (extracts .name from objects)
 * - IGNORES old authentication (user must create new configuration manually)
 */

/**
 * Checks if a toolkit is an old-format OpenAPI toolkit that needs normalization.
 *
 * TODO: DELETE after migration period
 *
 * @param {Object} toolkit - The toolkit object from API
 * @returns {boolean} - True if this is a legacy OpenAPI toolkit
 */
export const isLegacyOpenApiToolkit = toolkit => {
  if (toolkit?.type !== 'openapi') return false;
  const { settings = {} } = toolkit;
  // Old format has 'authentication' or 'schema_settings' fields
  return !!settings.authentication || !!settings.schema_settings;
};

/**
 * Normalizes an old OpenAPI toolkit to the new format for UI rendering.
 * Does NOT persist changes - just transforms for display.
 *
 * TODO: DELETE after migration period
 *
 * @param {Object} toolkit - The toolkit object from API
 * @returns {Object} - Normalized toolkit object
 */
export const normalizeLegacyOpenApiToolkit = toolkit => {
  if (!isLegacyOpenApiToolkit(toolkit)) {
    return toolkit;
  }

  const { settings = {}, ...rest } = toolkit;
  const {
    schema_settings,
    authentication, // eslint-disable-line no-unused-vars -- Intentionally ignored - user must create new config
    selected_tools = [],
    ...restSettings
  } = settings;

  // Normalize selected_tools: extract .name from objects, keep strings as-is
  const normalizedSelectedTools = selected_tools
    .map(tool => {
      if (typeof tool === 'object' && tool !== null && tool.name) {
        return tool.name;
      }
      if (typeof tool === 'string') {
        return tool;
      }
      return null;
    })
    .filter(Boolean);

  return {
    ...rest,
    settings: {
      ...restSettings,
      // Convert schema_settings to spec (new field name)
      spec: schema_settings || restSettings.spec || '',
      // Use normalized selected_tools
      selected_tools: normalizedSelectedTools,
      // Note: authentication is intentionally dropped
      // User will need to create/select an openapi_configuration manually
    },
  };
};
