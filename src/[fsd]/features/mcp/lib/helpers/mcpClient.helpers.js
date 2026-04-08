import { McpClientConstants } from '@/[fsd]/features/mcp/lib/constants';

export const fetchJson = async (
  url,
  options = {},
  timeout = McpClientConstants.MCP_CLIENT_DEFAULTS.TIMEOUT,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...options.headers },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

export const extractBaseUrl = serverUrl => {
  try {
    const u = new URL(serverUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    return serverUrl.replace(/^(https?:\/\/[^/]+).*/, '$1');
  }
};

export const discoverOAuthMetadata = async baseUrl => {
  for (const path of McpClientConstants.MCP_OAUTH_DISCOVERY_PATHS) {
    try {
      const metadata = await fetchJson(`${baseUrl}${path}`);
      return {
        authorization_endpoint: metadata.authorization_endpoint,
        token_endpoint: metadata.token_endpoint,
        scopes_supported: metadata.scopes_supported || ['read', 'write'],
        grant_types_supported: metadata.grant_types_supported || ['authorization_code'],
      };
    } catch {
      // Try next path
    }
  }
  throw new Error('OAuth metadata discovery failed');
};

export const normalizeMetadata = (metadata, authMethod, discoveredVia) => {
  const normalized = {
    ...metadata,
    discoveredVia,
    authMethod,
    capabilities: metadata.capabilities || metadata.capabilities_supported || metadata.features || [],
    version: metadata.version || '1.0',
  };
  if (!normalized.authorization_servers && metadata.authorization_server) {
    normalized.authorization_servers = [metadata.authorization_server];
  }
  return normalized;
};

export const discoverMcpMetadata = async baseUrl => {
  for (const path of McpClientConstants.MCP_DISCOVERY_PATHS) {
    try {
      const metadata = await fetchJson(`${baseUrl}${path}`);
      if (metadata) {
        const authMethod = metadata.authMethod || metadata.auth_method || metadata.auth || 'oauth';
        return normalizeMetadata(metadata, authMethod, McpClientConstants.MCP_DISCOVERY_TYPES.MCP);
      }
    } catch {
      // Try next path
    }
  }
  return null;
};

export const probeEndpoint = async (url, headers = {}) => {
  try {
    const res = await fetch(url, { method: 'GET', headers });
    return { ok: res.ok, status: res.status, headers: res.headers };
  } catch {
    return { ok: false, status: null, headers: { get: () => null } };
  }
};

export const testApiKeyEndpoints = async baseUrl => {
  for (const endpoint of McpClientConstants.MCP_API_KEY_TEST_ENDPOINTS) {
    const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const unauth = await probeEndpoint(url);

    if (unauth.ok) continue;

    for (const headerName of McpClientConstants.MCP_API_KEY_HEADERS) {
      const withKey = await probeEndpoint(url, { [headerName]: 'test-key' });
      if (withKey.ok) return true;
    }

    const wwwAuth = unauth.headers.get('www-authenticate') || '';
    if ((unauth.status === 401 || unauth.status === 403) && /api|key|token/i.test(wwwAuth)) {
      return true;
    }
  }
  throw new Error('No API key endpoints found');
};

export const discoverServerCapabilities = async serverUrl => {
  const baseUrl = extractBaseUrl(serverUrl);

  try {
    const mcpMetadata = await discoverMcpMetadata(baseUrl);
    if (mcpMetadata) return mcpMetadata;
  } catch {
    // Fall through to OAuth discovery
  }

  try {
    const oauthMetadata = await discoverOAuthMetadata(baseUrl);
    return normalizeMetadata(oauthMetadata, 'oauth', McpClientConstants.MCP_DISCOVERY_TYPES.OAUTH);
  } catch {
    // Fall through to API key detection
  }

  try {
    await testApiKeyEndpoints(baseUrl);
    return normalizeMetadata({}, 'api_key', McpClientConstants.MCP_DISCOVERY_TYPES.API_KEY);
  } catch {
    // Fall through to open access
  }

  return normalizeMetadata({}, 'open', McpClientConstants.MCP_DISCOVERY_TYPES.OPEN);
};
