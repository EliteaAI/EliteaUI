import {
  McpAuthHelpers,
  McpAuthWindowHelpers,
  McpCryptoHelpers,
  McpDiscoveryHelpers,
} from '@/[fsd]/features/mcp/lib/helpers';
import { mcpOAuthApi } from '@/api/mcpOAuth';
import RouteDefinitions, { getBasename } from '@/routes';

import { MCP_OAUTH_ERRORS } from '../constants/mcpAuthFlow.constants';

const getRedirectUri = () => {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const basename = getBasename();
  return `${baseUrl}${basename}${RouteDefinitions.McpAuthPage}`;
};

const resolveCredentials = (serverUrl, tokenInfo) => {
  const savedCredentials = McpAuthHelpers.getSavedCredentials(serverUrl);
  return {
    clientId: savedCredentials?.client_id || null,
    clientSecret: savedCredentials?.client_secret || null,
    tokenEndpoint: tokenInfo?.token_endpoint || null,
  };
};

const fetchToolkitCredentials = async tokenInfo => {
  try {
    const { default: store } = await import('@/[fsd]/app/store');
    const { toolkitsApi } = await import('@/api/toolkits');
    const result = await store.dispatch(
      toolkitsApi.endpoints.toolkitsDetails.initiate({
        projectId: tokenInfo.project_id,
        toolkitId: tokenInfo.toolkit_id,
      }),
    );
    if (!result.error && result.data?.settings) {
      const { client_id, client_secret, token_endpoint } = result.data.settings;
      return { clientId: client_id, clientSecret: client_secret, tokenEndpoint: token_endpoint };
    }
  } catch {
    // Ignore errors - credentials fetch is best-effort
  }
  return null;
};

const buildOAuthMetadata = (tokenInfo, clientId, clientSecret, projectId, toolkitId) => ({
  token_endpoint: tokenInfo.token_endpoint,
  client_id: clientId,
  client_secret: clientSecret,
  project_id: projectId || tokenInfo.project_id,
  toolkit_id: toolkitId || tokenInfo.toolkit_id,
  authorization_endpoint: tokenInfo.authorization_endpoint,
  revocation_endpoint: tokenInfo.revocation_endpoint,
  registration_endpoint: tokenInfo.registration_endpoint,
  issuer: tokenInfo.issuer,
  grant_types_supported: tokenInfo.grant_types_supported,
  code_challenge_methods_supported: tokenInfo.code_challenge_methods_supported,
});

// Trigger proactive (fire-and-forget) token refresh for near-expiry tokens
export const triggerProactiveRefresh = serverUrl => {
  // Mark as pending to prevent duplicate refresh attempts
  McpAuthHelpers.markRefreshPending(serverUrl);

  // Get token info to find the token endpoint and toolkit_id
  const tokenInfo = McpAuthHelpers.getTokenInfo(serverUrl);
  if (!tokenInfo?.refresh_token) {
    // Cannot refresh without refresh_token
    McpAuthHelpers.clearRefreshPending(serverUrl);
    return;
  }

  // Fire-and-forget async refresh
  (async () => {
    try {
      const credentials = resolveCredentials(serverUrl, tokenInfo);
      let { clientId, clientSecret, tokenEndpoint } = credentials;

      // Try fetching from toolkit API if no credentials found
      if (!clientId && tokenInfo?.toolkit_id && tokenInfo?.project_id) {
        const apiCredentials = await fetchToolkitCredentials(tokenInfo);
        if (apiCredentials) {
          clientId = apiCredentials.clientId;
          clientSecret = apiCredentials.clientSecret;
          tokenEndpoint = apiCredentials.tokenEndpoint || tokenEndpoint;
        }
      }

      // Fallback to stored token info
      if (!clientId && tokenInfo?.client_id) {
        clientId = tokenInfo.client_id;
        clientSecret = clientSecret || tokenInfo.client_secret;
      }

      if (!tokenEndpoint) {
        // eslint-disable-next-line no-console
        console.debug(`Skipping proactive refresh for ${serverUrl}: no token_endpoint`);
        return;
      }

      const { default: store } = await import('@/[fsd]/app/store');
      const requestBody = {
        projectId: tokenInfo.project_id || 1,
        grant_type: 'refresh_token',
        refresh_token: tokenInfo.refresh_token,
        token_endpoint: tokenEndpoint,
        client_id: clientId || undefined,
        client_secret: clientSecret || undefined,
        toolkit_id: tokenInfo.toolkit_id,
      };

      const tokenResult = await store.dispatch(
        mcpOAuthApi.endpoints.refreshMcpOAuthToken.initiate(requestBody),
      );

      if (tokenResult.error) {
        // eslint-disable-next-line no-console
        console.warn(`Proactive MCP token refresh failed for ${serverUrl}:`, tokenResult.error);
        // Don't logout on proactive refresh failure - token may still be valid
        return;
      }

      const tokenJson = tokenResult.data;
      if (tokenJson?.access_token) {
        const canonicalServer = McpAuthHelpers.canonicalizeServerUrl(serverUrl);
        const sessionId =
          tokenJson.session_id || tokenInfo.session_id || McpCryptoHelpers.generateSessionId();

        McpAuthHelpers.setAccessToken(
          canonicalServer,
          tokenJson.access_token,
          tokenJson.expires_in,
          sessionId,
          tokenJson.id_token,
          tokenJson.refresh_token || tokenInfo.refresh_token,
          buildOAuthMetadata(tokenInfo, clientId, clientSecret),
        );
        // eslint-disable-next-line no-console
        console.debug(`Proactively refreshed MCP token for ${serverUrl}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Proactive MCP token refresh error for ${serverUrl}:`, error.message);
    } finally {
      McpAuthHelpers.clearRefreshPending(serverUrl);
    }
  })();
};

export const refreshAccessToken = async options => {
  const { serverUrl, tokenEndpoint, clientId, clientSecret, projectId, toolkitId } = options;

  const refreshToken = McpAuthHelpers.getRefreshToken(serverUrl);
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const canonicalServer = McpAuthHelpers.canonicalizeServerUrl(serverUrl);

  const { default: store } = await import('@/[fsd]/app/store');
  const requestBody = {
    projectId: projectId || 1,
    token_endpoint: tokenEndpoint,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId || undefined,
    client_secret: clientSecret || undefined,
    toolkit_id: toolkitId || undefined,
  };

  const tokenResult = await store.dispatch(mcpOAuthApi.endpoints.refreshMcpOAuthToken.initiate(requestBody));

  if (tokenResult.error) {
    const errorData = tokenResult.error.data || tokenResult.error;
    // Clear stored tokens if refresh fails (token may be revoked)
    McpAuthHelpers.logout(serverUrl);
    throw new Error(errorData.error_description || errorData.error || 'Token refresh failed');
  }

  const tokenJson = tokenResult.data;

  if (!tokenJson.access_token) {
    throw new Error('No access token received from token refresh');
  }

  // Get existing session ID or generate new one
  const existingTokenInfo = McpAuthHelpers.getTokenInfo(serverUrl);
  const sessionId =
    tokenJson.session_id || existingTokenInfo?.session_id || McpCryptoHelpers.generateSessionId();

  // Store new tokens (refresh_token may or may not be returned - keep old one if not)
  McpAuthHelpers.setAccessToken(
    canonicalServer,
    tokenJson.access_token,
    tokenJson.expires_in,
    sessionId,
    tokenJson.id_token,
    tokenJson.refresh_token || refreshToken, // Keep old refresh token if not returned
    {
      token_endpoint: tokenEndpoint,
      client_id: clientId,
      client_secret: clientSecret,
      project_id: projectId,
      toolkit_id: toolkitId,
    },
  );

  return tokenJson;
};

export const getValidAccessToken = async options => {
  const { serverUrl, tokenEndpoint, clientId, clientSecret, projectId, toolkitId } = options;

  // Check if we have a valid token
  const accessToken = McpAuthHelpers.getAccessToken(serverUrl);
  if (accessToken && !McpAuthHelpers.needsRefresh(serverUrl)) {
    return accessToken;
  }

  // Try to refresh if we have a refresh token
  if (McpAuthHelpers.needsRefresh(serverUrl) && tokenEndpoint) {
    try {
      const result = await refreshAccessToken({
        serverUrl,
        tokenEndpoint,
        clientId,
        clientSecret,
        projectId,
        toolkitId,
      });
      return result.access_token;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to refresh MCP OAuth token:', error.message);
      // Return existing token if it hasn't fully expired yet
      const existingToken = McpAuthHelpers.getAccessToken(serverUrl);
      if (existingToken) {
        return existingToken;
      }
      return null;
    }
  }

  return accessToken;
};

const buildAuthorizationUrl = options => {
  const {
    authorizationEndpoint,
    clientId,
    redirectUri,
    state,
    nonce,
    codeChallenge,
    usePKCE,
    scope,
    isOIDC,
    prompt,
  } = options;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  if (usePKCE) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  if (isOIDC) {
    params.set('nonce', nonce);
  }

  if (scope) {
    params.set('scope', scope);
  }

  if (prompt) {
    params.set('prompt', prompt);
  }

  return `${authorizationEndpoint}?${params.toString()}`;
};

const waitForAuthorizationResult = (authWindow, state) => {
  return new Promise((resolve, reject) => {
    // Store cleanup function if needed
    return McpAuthWindowHelpers.createAuthorizationMonitor(authWindow, state, resolve, reject);
  });
};

export const startMcpAuthFlow = async options => {
  const {
    serverUrl,
    resourceMetadata,
    oauthMetadata: providedOauthMetadata,
    clientId: initialClientId,
    clientSecret,
    scope,
    authWindow: initialAuthWindow,
    projectId,
    toolkitId,
    toolkitType, // Pre-built MCP type (e.g., 'mcp_github') - used as storage key
  } = options;

  let clientId = initialClientId;
  let authWindow = initialAuthWindow;

  // Check if this is a pre-built MCP
  const isPrebuildMcp = McpAuthHelpers.isPrebuildMcpType(toolkitType);

  // For pre-built MCPs, serverUrl may not be provided (backend manages it)
  // For remote MCPs and config OAuth, serverUrl is required
  if (!serverUrl && !isPrebuildMcp) {
    throw new Error('Missing MCP server URL');
  }

  let shouldCloseOnError = false;

  // Open popup if not provided
  if (!authWindow) {
    authWindow = McpAuthWindowHelpers.openAuthPopup();
    if (!authWindow) {
      throw new Error(MCP_OAUTH_ERRORS.POPUP_BLOCKED + '. Please allow popups for this site and try again.');
    }
    shouldCloseOnError = true;
  }

  try {
    // Use metadata from mcp_authorization_required message (no frontend discovery)
    // Extract auth server metadata (must be provided by backend)
    const asMetadata = McpDiscoveryHelpers.extractAuthServerMetadata(resourceMetadata);

    const {
      authorization_endpoint: authorizationEndpoint,
      token_endpoint: tokenEndpoint,
      registration_endpoint: registrationEndpoint,
    } = asMetadata;

    // Check if server supports Dynamic Client Registration (DCR)
    const supportsDCR = Boolean(registrationEndpoint);

    // Track if we used DCR (needed for token exchange logic)
    let usedDCR = false;

    if (supportsDCR && !clientId) {
      // Flow 1: Server supports DCR and no client credentials provided
      // → Use Dynamic Client Registration flow via backend proxy
      const redirectUri = getRedirectUri();
      clientId = await McpDiscoveryHelpers.registerDynamicClient(
        registrationEndpoint,
        redirectUri,
        projectId,
      );
      usedDCR = true;
    } else if (!supportsDCR && !clientId) {
      // Flow 2: Server does NOT support DCR and no client credentials provided
      // → Cannot proceed, client must register manually and provide credentials
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        MCP_OAUTH_ERRORS.MISSING_CLIENT_ID +
          '. Server does not support Dynamic Client Registration. Please register an OAuth application manually and provide client credentials.',
      );
    }
    // Flow 3: Client credentials provided (with or without DCR support)
    // → Use standard OAuth flow with provided credentials

    // Generate security parameters
    const state = McpCryptoHelpers.randomString(32);
    const nonce = McpCryptoHelpers.randomString(32);
    const redirectUri = getRedirectUri();
    const isOIDC = McpCryptoHelpers.isOIDCFlow(asMetadata);

    // Use PKCE if server supports it (regardless of client secret)
    // Many servers require PKCE even for confidential clients
    const serverSupportsPKCE = asMetadata.code_challenge_methods_supported?.includes('S256');
    const usePKCE = serverSupportsPKCE || !clientSecret;
    let codeVerifier, codeChallenge;

    if (usePKCE) {
      codeVerifier = McpCryptoHelpers.randomString(64);
      codeChallenge = await McpCryptoHelpers.sha256(codeVerifier);
    }

    // Normalize scope
    const normalizedScope = McpCryptoHelpers.normalizeScope(scope, isOIDC);

    const buildingOptions = {
      authorizationEndpoint,
      clientId,
      redirectUri,
      state,
      nonce,
      codeChallenge,
      usePKCE,
      scope: normalizedScope,
      isOIDC,
      // Force re-consent on OIDC servers so the token reflects the app's current permissions.
      // Without this, the auth server silently reuses the cached consent grant
      // and issues a token with old scopes even after app permissions are updated.
      // Only set for OIDC servers — non-OIDC OAuth servers (GitHub, GitLab, etc.)
      // don't define the prompt parameter and may reject it.
      prompt: isOIDC ? 'consent' : undefined,
    };
    // Build authorization URL
    const authUrl = buildAuthorizationUrl(buildingOptions);

    // Navigate popup to auth URL
    McpAuthWindowHelpers.navigateAuthPopup(authWindow, authUrl);

    // Wait for authorization result (popup will return the authorization code via postMessage)
    const result = await waitForAuthorizationResult(authWindow, state);

    // Result should contain the authorization code from the popup
    if (!result.code) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('No authorization code received from popup');
    }

    // Exchange authorization code for tokens via backend proxy
    // This uses the app's authenticated API to avoid CORS issues
    const { default: store } = await import('@/[fsd]/app/store');

    // Determine which credentials to send:
    // - If we used DCR: Always send the dynamically registered client_id
    // - If pre-built MCP WITHOUT DCR: Don't send credentials (backend looks them up via toolkit_type)
    // - If remote MCP: Send whatever credentials were provided
    const shouldSendCredentials = usedDCR || !isPrebuildMcp;

    const requestBody = {
      projectId: projectId || 1,
      token_endpoint: tokenEndpoint,
      grant_type: 'authorization_code',
      code: result.code,
      redirect_uri: redirectUri,
      // Send client_id only if: (1) we used DCR, or (2) it's not a pre-built MCP
      client_id: shouldSendCredentials ? clientId || undefined : undefined,
      // Send client_secret only if: (1) it's not a pre-built MCP, or (2) we used DCR (rare)
      client_secret: shouldSendCredentials ? clientSecret || undefined : undefined,
      code_verifier: usePKCE ? codeVerifier : undefined,
      scope: normalizedScope || undefined,
      toolkit_id: toolkitId || undefined,
      toolkit_type: isPrebuildMcp ? toolkitType : undefined,
    };
    const tokenResult = await store.dispatch(
      mcpOAuthApi.endpoints.exchangeMcpOAuthToken.initiate(requestBody),
    );

    if (tokenResult.error) {
      const errorData = tokenResult.error.data || tokenResult.error;
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(errorData.error_description || errorData.error || 'Token exchange failed');
    }

    const tokenJson = tokenResult.data;

    if (!tokenJson.access_token) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('No access token received from token exchange');
    }

    // Store token - don't generate session_id client-side
    // Session IDs should come from the MCP server during initialize, not be generated here
    // For SSE servers, the session_id will be generated when first connecting
    const sessionId = tokenJson.session_id || null;

    // Use storageKey for pre-built MCPs (toolkitType), serverUrl for remote MCPs and config OAuth
    McpAuthHelpers.setAccessToken(
      serverUrl,
      tokenJson.access_token,
      tokenJson.expires_in,
      sessionId,
      tokenJson.id_token,
      tokenJson.refresh_token,
      {
        // Core fields for token refresh
        token_endpoint: tokenEndpoint,
        client_id: clientId,
        client_secret: clientSecret,
        project_id: projectId,
        toolkit_id: toolkitId,
        // Additional OAuth metadata from mcp_authorization_required message
        // These are useful for future operations (revocation, re-auth, etc.)
        ...(providedOauthMetadata && {
          authorization_endpoint: providedOauthMetadata.authorization_endpoint,
          revocation_endpoint: providedOauthMetadata.revocation_endpoint,
          registration_endpoint: providedOauthMetadata.registration_endpoint,
          issuer: providedOauthMetadata.issuer,
          grant_types_supported: providedOauthMetadata.grant_types_supported,
          code_challenge_methods_supported: providedOauthMetadata.code_challenge_methods_supported,
        }),
      },
      toolkitType, // Pass toolkitType for pre-built MCPs
    );

    return tokenJson;
  } catch (error) {
    if (shouldCloseOnError && authWindow && !authWindow.closed) {
      // Optionally close popup on error
    }
    throw error;
  }
};
