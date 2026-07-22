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
