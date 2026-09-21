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
  AUTH_SERVER_METADATA_UNAVAILABLE:
    "Could not discover this server's OAuth settings: its authorization server publishes no usable OAuth metadata, so authorization cannot start. Check the server URL or contact the server's provider.",
};

export const MCP_SESSION_CONFIG = {
  CHECK_INTERVAL: 500,
  POPUP_SIZE: { width: 500, height: 700 },
  SUCCESS_CLOSE_DELAY: 1500,
};

export const MCP_OAUTH_FLOWS = {
  DCR: 'dcr',
  OIDC: 'oidc',
  PKCE: 'pkce',
  STANDARD: 'standard',
};

export const PUBLIC_CLIENT_AUTH_METHOD = 'none';

export const PKCE_CODE_CHALLENGE_METHOD = 'S256';
