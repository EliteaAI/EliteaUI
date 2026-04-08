import { McpAuthConstants } from '@/[fsd]/features/mcp/lib/constants';

const REFRESH_CHECK_INTERVAL_MS = 60 * 1000; // Check for refresh needs every 60 seconds
const REFRESH_DELAY_BETWEEN_REQUESTS_MS = 2000; // 2 seconds between refresh requests
const PROACTIVE_REFRESH_THRESHOLD = 0.75; // Refresh at 75% of token lifetime

const pendingRefreshes = new Set();
let lastRefreshCheckTime = 0;
let refreshQueue = [];
let isProcessingRefreshQueue = false;

const safeParse = value => {
  try {
    return JSON.parse(value || '{}');
  } catch {
    return {};
  }
};

const isStorageAvailable = () => typeof window !== 'undefined' && window.sessionStorage;

const saveToStorage = (key, data) => {
  if (!isStorageAvailable()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(data || {}));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
};

/**
 * Check if a toolkit type is a pre-built MCP (e.g., mcp_github, mcp_context7)
 * @param {string} toolkitType - The toolkit type to check
 * @returns {boolean} True if it's a pre-built MCP type
 */
export const isPrebuildMcpType = toolkitType => {
  return (
    typeof toolkitType === 'string' &&
    toolkitType.startsWith(McpAuthConstants.MCP_PREBUILD_PREFIX) &&
    toolkitType !== 'mcp' // 'mcp' alone is remote MCP, not pre-built
  );
};

/**
 * Check if a key is a credential-scoped composite key.
 * Composite keys have the form "<credential_uuid>:<url>" where <url> contains "://".
 * Used to isolate OAuth tokens per credential (e.g. two SharePoint credentials
 * sharing the same oauth_discovery_endpoint / tenant).
 * @param {string} key
 * @returns {boolean}
 */
const isCredentialScopedKey = key => {
  if (!key || !key.includes('://')) return false;
  // Split on the first "://" — if the prefix before it contains ':'
  // then there is a credential UUID before the URL scheme.
  // e.g. "abc-123:https" → prefix has ':', so it's composite.
  // e.g. "https" → no ':', plain URL.
  const prefix = key.split('://')[0];
  return prefix.includes(':');
};

/**
 * Get the storage key for MCP tokens/credentials.
 * For pre-built MCPs (mcp_github, etc.), uses toolkitType as key.
 * For credential-scoped keys (<uuid>:<url>), returns as-is (no canonicalization).
 * For all other MCPs (remote and config OAuth), uses canonicalized serverUrl as key.
 * @param {Object} params - Parameters object
 * @param {string} [params.serverUrl] - The MCP server URL
 * @param {string} [params.toolkitType] - The toolkit type (for pre-built MCPs)
 * @returns {string|null} The storage key or null if none provided
 */
export const getStorageKey = ({ serverUrl, toolkitType } = {}) => {
  // Pre-built MCP: use toolkitType as key (e.g., 'mcp_github')
  if (isPrebuildMcpType(toolkitType)) {
    return toolkitType;
  }
  // Credential-scoped composite key: return as-is so the backend can
  // match it by configuration_uuid:oauth_discovery_endpoint.
  if (serverUrl && isCredentialScopedKey(serverUrl)) {
    return serverUrl;
  }
  // Remote MCP and config OAuth: use canonicalized serverUrl as key
  if (serverUrl) {
    return canonicalizeServerUrl(serverUrl);
  }
  return null;
};

/**
 * Dispatch a custom event to notify components when MCP tokens change.
 * @param {string} keyOrServerUrl - The storage key (toolkitType or serverUrl) that changed
 * @param {'login' | 'logout'} type - The type of change
 */
const dispatchTokenChangeEvent = (keyOrServerUrl, type) => {
  if (typeof window === 'undefined') return;
  // Determine the canonical key: pre-built MCP types and credential-scoped
  // composite keys are used as-is; plain server URLs are canonicalized.
  let key;
  if (isPrebuildMcpType(keyOrServerUrl)) {
    key = keyOrServerUrl;
  } else if (isCredentialScopedKey(keyOrServerUrl)) {
    key = keyOrServerUrl;
  } else {
    key = canonicalizeServerUrl(keyOrServerUrl);
  }
  const event = new CustomEvent(McpAuthConstants.MCP_TOKEN_CHANGE_EVENT, {
    detail: { serverUrl: key, type },
  });
  window.dispatchEvent(event);
};

const loadFromStorage = key => {
  if (!isStorageAvailable()) return {};
  return safeParse(window.sessionStorage.getItem(key));
};

// Token storage
const saveTokens = tokens => saveToStorage(McpAuthConstants.MC_TOKENS_STORAGE_KEY, tokens);
const loadTokens = () => loadFromStorage(McpAuthConstants.MC_TOKENS_STORAGE_KEY);

// Credentials storage
const saveCredentials = credentials =>
  saveToStorage(McpAuthConstants.MCP_CREDENTIALS_STORAGE_KEY, credentials);
const loadCredentials = () => loadFromStorage(McpAuthConstants.MCP_CREDENTIALS_STORAGE_KEY);

// Ignored servers storage - servers that user chose to "continue" without auth
const saveIgnoredServers = servers =>
  saveToStorage(McpAuthConstants.MCP_IGNORED_SERVERS_STORAGE_KEY, servers);
const loadIgnoredServers = () => loadFromStorage(McpAuthConstants.MCP_IGNORED_SERVERS_STORAGE_KEY);

export const canonicalizeServerUrl = url => {
  // Credential-scoped composite keys ("<uuid>:<url>") must not be parsed as
  // a URL — the UUID prefix would be misinterpreted as a protocol scheme.
  if (isCredentialScopedKey(url)) return url;
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(':', '').toLowerCase();
    const host = parsed.hostname.toLowerCase();
    const port = parsed.port ? `:${parsed.port}` : '';
    const path = parsed.pathname || '';
    const normalized = `${scheme}://${host}${port}${path}`;
    // Prefer no trailing slash unless path is meaningful
    return normalized.endsWith('/') && (path === '/' || path === '') ? normalized.slice(0, -1) : normalized;
  } catch {
    return url;
  }
};

const isExpired = tokenInfo => !!tokenInfo?.expires_at && Date.now() > Number(tokenInfo.expires_at);

const needsProactiveRefresh = tokenInfo => {
  if (!tokenInfo?.expires_at || !tokenInfo?.issued_at) return false;

  const expiresAt = Number(tokenInfo.expires_at);
  const issuedAt = Number(tokenInfo.issued_at);
  const totalLifetime = expiresAt - issuedAt;
  const threshold = issuedAt + totalLifetime * PROACTIVE_REFRESH_THRESHOLD;
  return Date.now() > threshold;
};

export const getTokenInfo = (serverUrl, toolkitType) => {
  const tokens = loadTokens();
  const key = getStorageKey({ serverUrl, toolkitType });
  if (!key) return null;
  return tokens[key] || null;
};

export const getSavedCredentials = (serverUrl, toolkitType) => {
  const credentials = loadCredentials();
  const key = getStorageKey({ serverUrl, toolkitType });
  if (!key) return null;
  return credentials[key] || null;
};

export const setSavedCredentials = ({ serverUrl, clientId, clientSecret, toolkitType } = {}) => {
  const credentials = loadCredentials();
  const key = getStorageKey({ serverUrl, toolkitType });
  if (!key) return;
  credentials[key] = { client_id: clientId, client_secret: clientSecret };
  saveCredentials(credentials);
};

export const removeSavedCredentials = (serverUrl, toolkitType) => {
  const credentials = loadCredentials();
  const key = getStorageKey({ serverUrl, toolkitType });
  if (!key) return;
  if (credentials[key]) {
    delete credentials[key];
    saveCredentials(credentials);
  }
};

export const getAccessToken = (serverUrl, toolkitType) => {
  const tokenInfo = getTokenInfo(serverUrl, toolkitType);
  if (!tokenInfo || isExpired(tokenInfo)) return null;
  return tokenInfo.access_token || null;
};

export const getRefreshToken = (serverUrl, toolkitType) => {
  const tokenInfo = getTokenInfo(serverUrl, toolkitType);
  return tokenInfo?.refresh_token || null;
};

export const getSessionId = (serverUrl, toolkitType) => {
  const tokenInfo = getTokenInfo(serverUrl, toolkitType);
  if (!tokenInfo || isExpired(tokenInfo)) return null;
  return tokenInfo.session_id || null;
};

export const needsRefresh = (serverUrl, toolkitType) => {
  const tokenInfo = getTokenInfo(serverUrl, toolkitType);
  if (!tokenInfo) return false;
  return (isExpired(tokenInfo) || needsProactiveRefresh(tokenInfo)) && !!tokenInfo.refresh_token;
};

export const setSessionId = (serverUrl, sessionId, toolkitType) => {
  const tokens = loadTokens();
  const key = getStorageKey({ serverUrl, toolkitType });
  if (!key) return;
  if (tokens[key]) {
    tokens[key].session_id = sessionId;
    saveTokens(tokens);
  }
};

export const setAccessToken = (
  serverUrl,
  accessToken,
  expiresInSec,
  sessionId,
  idToken,
  refreshToken,
  oauthMeta = {},
  toolkitType,
) => {
  const tokens = loadTokens();
  const key = getStorageKey({ serverUrl, toolkitType });
  if (!key) return;
  const now = Date.now();
  const expiresAt = expiresInSec ? now + Number(expiresInSec) * 1000 : null;

  // Preserve existing metadata for refresh scenarios
  const existingToken = tokens[key] || {};

  // Helper to get value with fallback to existing
  const getOrExisting = field => oauthMeta[field] || existingToken[field];

  tokens[key] = {
    // Core token data
    access_token: accessToken,
    issued_at: oauthMeta.issued_at || now,
    expires_at: expiresAt,
    // Optional token data
    ...(sessionId && { session_id: sessionId }),
    ...(idToken && { id_token: idToken }),
    ...(refreshToken && { refresh_token: refreshToken }),
    // OAuth metadata for token refresh
    token_endpoint: getOrExisting('token_endpoint'),
    client_id: getOrExisting('client_id'),
    client_secret: getOrExisting('client_secret'),
    project_id: getOrExisting('project_id'),
    toolkit_id: getOrExisting('toolkit_id'),
    // Store toolkit_type for pre-built MCPs to enable proper refresh
    toolkit_type: toolkitType || getOrExisting('toolkit_type'),
    // Additional OAuth metadata
    authorization_endpoint: getOrExisting('authorization_endpoint'),
    revocation_endpoint: getOrExisting('revocation_endpoint'),
    registration_endpoint: getOrExisting('registration_endpoint'),
    issuer: getOrExisting('issuer'),
    grant_types_supported: getOrExisting('grant_types_supported'),
    code_challenge_methods_supported: getOrExisting('code_challenge_methods_supported'),
  };

  saveTokens(tokens);

  // Notify components that token has changed
  dispatchTokenChangeEvent(key, 'login');

  // Remove from ignored servers when a new token is provided
  const ignoredServers = loadIgnoredServers();
  if (ignoredServers[key]) {
    delete ignoredServers[key];
    saveIgnoredServers(ignoredServers);
  }
};

export const logout = (serverUrl, toolkitType) => {
  const tokens = loadTokens();
  const key = getStorageKey({ serverUrl, toolkitType });
  if (!key) return;
  if (tokens[key]) {
    delete tokens[key];
    saveTokens(tokens);
    // Notify components that token has been removed
    dispatchTokenChangeEvent(key, 'logout');
  }
};

// =============================================================================
// Refresh Queue Management
// =============================================================================

export const markRefreshPending = (serverUrl, toolkitType) => {
  const key = getStorageKey({ serverUrl, toolkitType });
  if (key) pendingRefreshes.add(key);
};

export const clearRefreshPending = (serverUrl, toolkitType) => {
  const key = getStorageKey({ serverUrl, toolkitType });
  if (key) pendingRefreshes.delete(key);
};

export const getServersNeedingRefresh = () => {
  const tokens = loadTokens();
  const serversToRefresh = [];

  Object.entries(tokens).forEach(([storageKey, tokenInfo]) => {
    // For pre-built MCPs, storageKey is the toolkit_type (e.g., 'mcp_github')
    // For remote MCPs, storageKey is the canonical server URL
    const hasRequiredFields =
      tokenInfo?.refresh_token && tokenInfo?.access_token && tokenInfo?.toolkit_id && tokenInfo?.project_id;
    const shouldRefresh = !isExpired(tokenInfo) && needsProactiveRefresh(tokenInfo);
    const notPending = !pendingRefreshes.has(storageKey);

    if (hasRequiredFields && shouldRefresh && notPending) {
      serversToRefresh.push(storageKey);
    }
  });

  return serversToRefresh;
};

const processRefreshQueue = async triggerProactiveRefresh => {
  if (isProcessingRefreshQueue || refreshQueue.length === 0) return;

  isProcessingRefreshQueue = true;

  while (refreshQueue.length > 0) {
    const storageKey = refreshQueue.shift();

    // Skip if already being processed
    if (pendingRefreshes.has(storageKey)) continue;

    try {
      triggerProactiveRefresh(storageKey);
    } catch {
      // Ignore errors - refresh is best-effort
    }

    // Delay between requests to avoid traffic storm
    if (refreshQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, REFRESH_DELAY_BETWEEN_REQUESTS_MS));
    }
  }

  isProcessingRefreshQueue = false;
};

const addToRefreshQueue = storageKeys => {
  storageKeys.forEach(storageKey => {
    const alreadyQueued = refreshQueue.includes(storageKey);
    if (!alreadyQueued) {
      refreshQueue.push(storageKey);
    }
  });
};

export const getAllTokens = () => {
  const tokens = loadTokens();
  const result = {};

  // Collect valid tokens - BE expects Dict[str, Dict] (URL -> {access_token, session_id})
  // session_id is important for maintaining stateful MCP connections
  Object.entries(tokens).forEach(([key, value]) => {
    if (
      !isExpired(value) &&
      value?.access_token &&
      value.access_token !== McpAuthConstants.MCP_CONNECTION_VERIFIED
    ) {
      result[key] = {
        access_token: value.access_token,
        session_id: value.session_id || null,
      };
    }
  });

  // Rate-limited refresh check
  const now = Date.now();
  if (now - lastRefreshCheckTime < REFRESH_CHECK_INTERVAL_MS) {
    return result;
  }
  lastRefreshCheckTime = now;

  // Trigger proactive refresh for near-expiry tokens (fire-and-forget)
  const serversToRefresh = getServersNeedingRefresh();
  if (serversToRefresh.length > 0) {
    addToRefreshQueue(serversToRefresh);

    // Dynamic import to avoid circular dependency
    import('./mcpAuthFlow.helpers')
      .then(({ triggerProactiveRefresh }) => processRefreshQueue(triggerProactiveRefresh))
      .catch(() => {
        // Ignore import errors - refresh is best-effort
        refreshQueue = [];
      });
  }

  return result;
};

/**
 * Add a server to the ignored list (user chose to continue without auth)
 * The server will be ignored until a valid token is provided
 */
export const addIgnoredServer = serverUrl => {
  const ignoredServers = loadIgnoredServers();
  const key = canonicalizeServerUrl(serverUrl);
  ignoredServers[key] = {
    ignored_at: Date.now(),
    server_url: serverUrl,
  };
  saveIgnoredServers(ignoredServers);
};

/**
 * Remove a server from the ignored list (called when new token is provided)
 */
export const removeIgnoredServer = serverUrl => {
  const ignoredServers = loadIgnoredServers();
  const key = canonicalizeServerUrl(serverUrl);
  if (ignoredServers[key]) {
    delete ignoredServers[key];
    saveIgnoredServers(ignoredServers);
  }
};

/**
 * Check if a server is in the ignored list
 */
export const isServerIgnored = serverUrl => {
  const ignoredServers = loadIgnoredServers();
  const key = canonicalizeServerUrl(serverUrl);
  return !!ignoredServers[key];
};

/**
 * Get all ignored servers
 */
export const getIgnoredServers = () => {
  const ignoredServers = loadIgnoredServers();
  return Object.keys(ignoredServers);
};

/**
 * Get filtered ignored MCP servers list.
 * Returns:
 * 1. All explicitly ignored servers that don't have valid tokens
 * 2. All MCP servers from the provided list that don't have valid tokens
 *
 * @param {string[]} mcpServerUrls - Optional list of MCP server URLs to check for valid tokens
 */
export const getFilteredIgnoredServers = (mcpServerUrls = []) => {
  const tokens = loadTokens();
  const authenticatedServerUrls = Object.keys(tokens);

  // Get all ignored servers from storage
  const ignoredServers = loadIgnoredServers();
  const allIgnoredServerUrls = Object.keys(ignoredServers);
  if (!allIgnoredServerUrls?.length) {
    return [];
  }

  // Filter out servers that now have valid tokens
  const ignoredWithoutTokens = allIgnoredServerUrls.filter(
    serverUrl =>
      !authenticatedServerUrls.some(
        authUrl => canonicalizeServerUrl(authUrl) === canonicalizeServerUrl(serverUrl),
      ),
  );

  // Also include MCP servers from the provided list that don't have valid tokens
  const mcpServersWithoutValidTokens = mcpServerUrls.filter(serverUrl => {
    if (!serverUrl) return false;
    // Check if this server has a valid (non-expired) token
    return getAccessToken(serverUrl) === null;
  });

  // Combine and deduplicate using canonical URLs
  const allIgnored = [...ignoredWithoutTokens];
  mcpServersWithoutValidTokens.forEach(url => {
    const canonicalUrl = canonicalizeServerUrl(url);
    if (!allIgnored.some(existing => canonicalizeServerUrl(existing) === canonicalUrl)) {
      allIgnored.push(url);
    }
  });

  return allIgnored;
};

/**
 * Clear all ignored servers
 */
export const clearIgnoredServers = () => {
  saveIgnoredServers({});
};

/**
 * Mark a server/toolkit as "connection verified" for header-based auth MCP servers
 * that don't require OAuth tokens on the client side.
 * This stores a minimal marker that makes getAccessToken return truthy,
 * triggering UI updates via useMcpTokenChange.
 *
 * @param {string} serverUrl - The MCP server URL (for remote MCPs)
 * @param {string} [toolkitType] - The toolkit type (for pre-built MCPs like mcp_github)
 */
export const setConnectionVerified = (serverUrl, toolkitType) => {
  const tokens = loadTokens();
  const key = getStorageKey({ serverUrl, toolkitType });
  if (!key) return;

  // Only set if no existing token (don't overwrite real OAuth tokens)
  if (getAccessToken(serverUrl, toolkitType)) {
    return;
  }

  const now = Date.now();
  // Store a marker with a long expiry (24 hours) - this is just a "verified" flag
  // The actual auth is handled by backend headers
  tokens[key] = {
    access_token: McpAuthConstants.MCP_CONNECTION_VERIFIED,
    issued_at: now,
    expires_at: now + 24 * 60 * 60 * 1000, // 24 hours
    connection_verified: true,
    // Store toolkit_type for pre-built MCPs
    ...(toolkitType && { toolkit_type: toolkitType }),
  };

  saveTokens(tokens);

  // Notify components that connection status has changed
  dispatchTokenChangeEvent(key, 'login');

  // Remove from ignored servers
  const ignoredServers = loadIgnoredServers();
  if (ignoredServers[key]) {
    delete ignoredServers[key];
    saveIgnoredServers(ignoredServers);
  }
};
