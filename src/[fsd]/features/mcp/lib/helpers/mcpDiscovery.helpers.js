import { McpAuthFlowConstants } from '@/[fsd]/features/mcp/lib/constants';

/**
 * Construct OAuth metadata from authorization server URL when discovery metadata is not available.
 * Uses common OAuth endpoint patterns (e.g., GitHub uses /authorize and /access_token).
 */
const constructOAuthMetadataFromServer = authServerUrl => {
  if (!authServerUrl) return null;

  const normalizedUrl = authServerUrl.replace(/\/+$/, '');

  return {
    authorization_endpoint: `${normalizedUrl}/authorize`,
    token_endpoint: `${normalizedUrl}/access_token`,
    // No registration_endpoint - server doesn't support DCR
    // No code_challenge_methods_supported - assume no PKCE unless specified
  };
};

export const extractAuthServerMetadata = metadata => {
  // Extract auth server metadata from the provided metadata (from mcp_authorization_required message)
  // No discovery fetches - metadata must be provided by backend
  let asMetadata = metadata?.oauth_authorization_server || metadata?.authorization_server || null;

  // Check if metadata itself contains endpoints (direct OIDC config)
  if (!asMetadata && metadata?.authorization_endpoint && metadata?.token_endpoint) {
    asMetadata = metadata;
  }

  // Check if asMetadata has the required endpoints
  const hasRequiredEndpoints = asMetadata?.authorization_endpoint && asMetadata?.token_endpoint;

  // Fallback: construct OAuth metadata from authorization_servers URL
  // This handles providers like GitHub that don't expose OAuth discovery endpoints
  // or when oauth_authorization_server is missing required endpoints (e.g., GitHub's OIDC-only metadata)
  if ((!asMetadata || !hasRequiredEndpoints) && metadata?.authorization_servers?.length > 0) {
    const constructedMetadata = constructOAuthMetadataFromServer(metadata.authorization_servers[0]);
    if (constructedMetadata) {
      // Merge with existing metadata but override scopes_supported with resource scopes if available
      asMetadata = {
        ...asMetadata,
        ...constructedMetadata,
      };
    }
  }

  if (!asMetadata) {
    throw new Error(McpAuthFlowConstants.MCP_OAUTH_ERRORS.NO_AUTH_SERVERS);
  }

  if (!asMetadata.authorization_endpoint || !asMetadata.token_endpoint) {
    throw new Error(McpAuthFlowConstants.MCP_OAUTH_ERRORS.MISSING_ENDPOINTS);
  }

  return asMetadata;
};

const DCR_REQUEST_DEFAULTS = {
  token_endpoint_auth_method: 'none',
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  client_name: 'ELITEA MCP Client',
  application_type: 'web',
};

/**
 * Register a dynamic OAuth client using the backend proxy API.
 * This avoids CORS issues when registering with external OAuth servers.
 *
 * @param {string} registrationEndpoint - The OAuth registration endpoint URL
 * @param {string} redirectUri - The redirect URI for the client
 * @param {number} projectId - The project ID for the proxy API
 * @returns {Promise<string>} - The client_id from the registration response
 */
export const registerDynamicClient = async (registrationEndpoint, redirectUri, projectId) => {
  // Import store and API dynamically to avoid circular dependencies
  const { default: store } = await import('@/[fsd]/app/store');
  const { mcpOAuthApi } = await import('@/api/mcpOAuth');

  const requestBody = {
    projectId: projectId || 1,
    registration_endpoint: registrationEndpoint,
    redirect_uris: [redirectUri],
    client_name: DCR_REQUEST_DEFAULTS.client_name,
    grant_types: DCR_REQUEST_DEFAULTS.grant_types,
    response_types: DCR_REQUEST_DEFAULTS.response_types,
    token_endpoint_auth_method: DCR_REQUEST_DEFAULTS.token_endpoint_auth_method,
    application_type: DCR_REQUEST_DEFAULTS.application_type,
  };

  const result = await store.dispatch(mcpOAuthApi.endpoints.registerMcpDynamicClient.initiate(requestBody));

  if (result.error) {
    const errorData = result.error.data || result.error;
    throw new Error(
      `Dynamic client registration failed: ${errorData.error_description || errorData.error || 'Unknown error'}`,
    );
  }

  const registration = result.data;
  if (!registration.client_id) {
    throw new Error('Registration response missing client_id');
  }

  return registration.client_id;
};
