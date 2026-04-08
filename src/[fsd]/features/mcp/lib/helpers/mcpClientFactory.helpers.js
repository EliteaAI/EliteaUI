import { McpClientConstants } from '@/[fsd]/features/mcp/lib/constants';
import { discoverServerCapabilities } from '@/[fsd]/features/mcp/lib/helpers/mcpClient.helpers';

const DEFAULT_METADATA = {
  authMethod: McpClientConstants.MCP_AUTH_METHODS.OAUTH,
  discoveredVia: McpClientConstants.MCP_DISCOVERY_TYPES.FALLBACK,
  capabilities: [],
  version: '1.0',
};

export const createMcpClient = serverUrl => {
  const normalizedServerUrl = serverUrl.replace(/\/+$/, '');
  let metadata = null;

  const discoverCapabilities = async () => {
    if (metadata) return metadata;
    try {
      metadata = await discoverServerCapabilities(normalizedServerUrl);
    } catch {
      metadata = { ...DEFAULT_METADATA };
    }
    return metadata;
  };

  return { discoverCapabilities };
};
