import { McpAuthConstants } from '@/[fsd]/features/mcp/lib/constants';

/**
 * Returns true if the given type string identifies an MCP toolkit.
 * Covers both remote MCPs ('mcp') and pre-built MCPs ('mcp_*').
 */
export const isMcpToolkitType = type =>
  type === 'mcp' || Boolean(type?.startsWith(McpAuthConstants.MCP_PREBUILD_PREFIX));

/**
 * Returns true only for a Remote MCP toolkit — a user-connected external MCP
 * server (type === 'mcp'). Pre-built / Local MCP toolkits (type 'mcp_*', e.g.
 * the Elitea internal MCPs) are Elitea-managed and are surfaced as regular
 * toolkits, so they are NOT treated as MCPs for grouping/routing purposes.
 */
export const isRemoteMcpToolkitType = type => type === 'mcp';

/**
 * Returns true if the given toolkit item is an MCP toolkit.
 * Checks item.type and item.meta.mcp (used by pipeline nodes).
 */
export const isMcpToolkit = item => isMcpToolkitType(item?.type) || item?.meta?.mcp === true;

/**
 * Resolve a toolkit's schema from a type. Toolkit instances use a normalized
 * type ("mcp_elitea_analytics") while schemas are keyed by the original name
 * ("mcp_Elitea Analytics"), so a direct lookup misses for MCP instances.
 */
export const resolveToolkitSchemaByType = (type, toolkitSchemas = {}) => {
  if (!type) return undefined;
  if (toolkitSchemas[type]) return toolkitSchemas[type];
  const prefix = McpAuthConstants.MCP_PREBUILD_PREFIX;
  if (!type.toLowerCase().startsWith(prefix)) return undefined;
  const normalize = key => prefix + key.slice(prefix.length).toLowerCase().replace(/ /g, '_');
  const wanted = normalize(type);
  const key = Object.keys(toolkitSchemas).find(
    k => k.toLowerCase().startsWith(prefix) && normalize(k) === wanted,
  );
  return key ? toolkitSchemas[key] : undefined;
};
