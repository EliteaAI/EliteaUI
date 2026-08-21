export const MC_TOKENS_STORAGE_KEY = 'elitea_mcp_tokens_v1';
export const MCP_CREDENTIALS_STORAGE_KEY = 'elitea_mcp_credentials_v1';
export const MCP_IGNORED_SERVERS_STORAGE_KEY = 'elitea_mcp_ignored_servers_v1';
export const MCP_TOKEN_CHANGE_EVENT = 'elitea_mcp_token_change';
export const MCP_LOGOUT_SYNC_STORAGE_KEY = 'elitea_mcp_logout_sync_v1';
export const MCP_CONNECTION_VERIFIED = '__connection_verified__';

export { MCP_PREBUILD_PREFIX } from '@/[fsd]/shared/lib/constants/mcp.constants';

// Deprecated MCP server URLs mapped to their current replacements.
// Tokens stored under either URL resolve to the same canonical key.
export const MCP_DEPRECATED_URL_MAP = {
  'https://mcp.atlassian.com/v1/sse': 'https://mcp.atlassian.com/v1/mcp/authv2',
};
