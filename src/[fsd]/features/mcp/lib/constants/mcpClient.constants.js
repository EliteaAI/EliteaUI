export const MCP_CLIENT_DEFAULTS = {
  TIMEOUT: 30000,
  RETRIES: 3,
};

export const MCP_DISCOVERY_PATHS = [
  '/.well-known/mcp',
  '/.well-known/oauth-protected-resource',
  '/.well-known/oauth-protected-resource/mcp/',
];

export const MCP_OAUTH_DISCOVERY_PATHS = [
  '/.well-known/oauth-authorization-server',
  '/.well-known/openid-configuration',
  '/oauth/.well-known/openid-configuration',
];

export const MCP_API_KEY_TEST_ENDPOINTS = ['/health', '/status', '/api/v1/health', '/api/health'];

export const MCP_API_KEY_HEADERS = ['X-API-Key', 'Authorization', 'Api-Key', 'X-Access-Token'];

export const MCP_AUTH_METHODS = {
  OAUTH: 'oauth',
  API_KEY: 'api_key',
  OPEN: 'open',
  NONE: 'none',
};

export const MCP_DISCOVERY_TYPES = {
  MCP: 'mcp-discovery',
  OAUTH: 'oauth-discovery',
  API_KEY: 'api-key-discovery',
  OPEN: 'open-access',
  FALLBACK: 'fallback',
};
