// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { store } from '@/[fsd]/shared/config';
import { mcpOAuthApi } from '@/api/mcpOAuth';

import * as McpAuthHelpers from '../mcpAuth.helpers';
import { refreshAccessToken, startMcpAuthFlow } from '../mcpAuthFlow.helpers';
import * as McpAuthWindowHelpers from '../mcpAuthWindow.helpers';

vi.mock('@/[fsd]/shared/config', () => ({ store: { dispatch: vi.fn() } }));
vi.mock('@/api/toolkits', () => ({ toolkitsApi: {} }));
vi.mock('@/api/mcpOAuth', () => ({
  mcpOAuthApi: {
    endpoints: {
      exchangeMcpOAuthToken: { initiate: vi.fn(body => ({ exchange: body })) },
      refreshMcpOAuthToken: { initiate: vi.fn(body => ({ refresh: body })) },
      registerMcpDynamicClient: { initiate: vi.fn() },
    },
  },
}));
vi.mock('../mcpAuth.helpers', () => ({
  isPrebuildMcpType: () => false,
  canonicalizeServerUrl: url => url,
  getTokenInfo: vi.fn(),
  getRefreshToken: () => 'refresh-me',
  setAccessToken: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('../mcpAuthWindow.helpers', () => ({
  navigateAuthPopup: vi.fn(),
  createAuthorizationMonitor: (_authWindow, _state, onSuccess) => {
    onSuccess({ code: 'auth-code' });
    return () => {};
  },
}));

const SERVER_URL = 'https://mcp.monday.com/mcp';

const authorizationServer = authorizationEndpoint => ({
  issuer: 'https://auth.example.test',
  authorization_endpoint: authorizationEndpoint,
  token_endpoint: 'https://auth.example.test/token',
  code_challenge_methods_supported: ['S256'],
});

const authorize = async ({
  resource = SERVER_URL,
  authorizationEndpoint = 'https://auth.monday.com/oauth2/authorize',
} = {}) => {
  await startMcpAuthFlow({
    serverUrl: SERVER_URL,
    resourceMetadata: {
      authorization_servers: ['https://auth.example.test'],
      oauth_authorization_server: authorizationServer(authorizationEndpoint),
      resource,
    },
    clientId: 'registered-client',
    authWindow: { closed: false },
    projectId: 2,
  });
  const [, authUrl] = McpAuthWindowHelpers.navigateAuthPopup.mock.calls[0];
  const [exchangeBody] = mcpOAuthApi.endpoints.exchangeMcpOAuthToken.initiate.mock.calls[0];
  const [, , , , , , storedMetadata] = McpAuthHelpers.setAccessToken.mock.calls[0];
  return { authParams: new URL(authUrl).searchParams, exchangeBody, storedMetadata };
};

beforeEach(() => {
  vi.clearAllMocks();
  store.dispatch.mockImplementation(async () => ({ data: { access_token: 'issued', expires_in: 3600 } }));
});

describe('RFC 8707 resource indicator in the MCP OAuth flow (#6688)', () => {
  it('names the protected resource on the authorization request, the code exchange and the stored token', async () => {
    const { authParams, exchangeBody, storedMetadata } = await authorize();

    expect(authParams.get('resource')).toBe(SERVER_URL);
    expect(exchangeBody.resource).toBe(SERVER_URL);
    expect(storedMetadata.resource).toBe(SERVER_URL);
  });

  it('sends no resource when the protected resource metadata declares none', async () => {
    const { authParams, exchangeBody } = await authorize({ resource: null });

    expect(authParams.has('resource')).toBe(false);
    expect(exchangeBody.resource).toBeUndefined();
  });

  it('sends no resource to Microsoft Entra, whose v2 endpoints reject the parameter', async () => {
    const { authParams, exchangeBody } = await authorize({
      authorizationEndpoint: 'https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize',
    });

    expect(authParams.has('resource')).toBe(false);
    expect(exchangeBody.resource).toBeUndefined();
  });

  it('repeats the stored resource on a refresh', async () => {
    McpAuthHelpers.getTokenInfo.mockReturnValue({ resource: SERVER_URL });

    await refreshAccessToken({ serverUrl: SERVER_URL, tokenEndpoint: 'https://auth.example.test/token' });

    const [refreshBody] = mcpOAuthApi.endpoints.refreshMcpOAuthToken.initiate.mock.calls[0];
    expect(refreshBody.resource).toBe(SERVER_URL);
  });
});
