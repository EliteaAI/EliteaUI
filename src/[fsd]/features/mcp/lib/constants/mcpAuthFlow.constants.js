export const MCP_OAUTH_ERRORS = {
  POPUP_BLOCKED: 'Popup blocked',
  AUTHORIZATION_CANCELLED: 'Authorization cancelled by user',
  NO_CODE: 'No authorization code received',
  STATE_MISMATCH: 'State mismatch',
  TOKEN_FAILED: 'Token request failed',
  MISSING_ACCESS_TOKEN: 'Token response missing access_token',
  MISSING_CLIENT_ID: 'Client ID is required',
  MISSING_ENDPOINTS: 'Authorization server metadata is missing endpoints',
  NO_AUTH_SERVERS: 'No authorization server found in MCP resource metadata',
  REGISTRATION_FAILED: 'Dynamic client registration failed',
};

export const MCP_DISCOVERY_ENDPOINTS = [
  '/.well-known/oauth-protected-resource',
  '/.well-known/oauth-authorization-server',
  '/.well-known/openid-configuration',
];

export const MCP_SESSION_CONFIG = {
  CHECK_INTERVAL: 500,
  POPUP_SIZE: { width: 500, height: 700 },
  SUCCESS_CLOSE_DELAY: 1500,
};

export const MCP_AUTH_FLOW_CONSTANTS = {
  ERROR_MESSAGES: MCP_OAUTH_ERRORS,
  SESSION_CONFIG: MCP_SESSION_CONFIG,
  DISCOVERY_ENDPOINTS: MCP_DISCOVERY_ENDPOINTS,
};
