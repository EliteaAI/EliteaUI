import { McpAuthConstants } from '@/[fsd]/features/mcp/lib/constants';

/**
 * Returns true if the given type string identifies an MCP toolkit.
 * Covers both remote MCPs ('mcp') and pre-built MCPs ('mcp_*').
 */
export const isMcpToolkitType = type =>
  type === 'mcp' || Boolean(type?.startsWith(McpAuthConstants.MCP_PREBUILD_PREFIX));

/**
 * Returns true if the given toolkit item is an MCP toolkit.
 * Checks item.type and item.meta.mcp (used by pipeline nodes).
 */
export const isMcpToolkit = item => isMcpToolkitType(item?.type) || item?.meta?.mcp === true;
