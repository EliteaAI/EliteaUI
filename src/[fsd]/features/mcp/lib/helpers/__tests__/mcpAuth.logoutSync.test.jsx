import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as McpAuthConstants from '@/[fsd]/features/mcp/lib/constants/mcAuth.constants';

vi.mock('@/[fsd]/features/mcp/lib/helpers/mcpAuthFlow.helpers', () => ({
  triggerProactiveRefresh: vi.fn(),
}));

const TOKEN_KEY = 'cfg-1:https://login.microsoftonline.com/tenant';
const SECOND_TOKEN_KEY = 'cfg-2:https://login.microsoftonline.com/tenant';
const HEROES_URL = 'https://mcp.example.com/mcp/heroes';
const STAFFING_URL = 'https://mcp.example.com/mcp/staffing';
const AUTHORIZATION_SERVER = 'https://login.example.com/oauth';
const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;
const originalCustomEvent = globalThis.CustomEvent;
let McpAuthHelpers;

const buildStorage = () => {
  const values = new Map();
  return {
    clear: () => values.clear(),
    getItem: key => (values.has(key) ? values.get(key) : null),
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
};

globalThis.window = {
  sessionStorage: buildStorage(),
  localStorage: buildStorage(),
  dispatchEvent: () => true,
};
globalThis.localStorage = globalThis.window.localStorage;

if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options?.detail;
    }
  };
}

beforeAll(async () => {
  McpAuthHelpers = await import('@/[fsd]/features/mcp/lib/helpers/mcpAuth.helpers');
});

afterAll(() => {
  globalThis.window = originalWindow;
  globalThis.localStorage = originalLocalStorage;
  globalThis.CustomEvent = originalCustomEvent;
});

afterEach(() => vi.restoreAllMocks());

const storeTokens = tokens => {
  window.sessionStorage.setItem(McpAuthConstants.MC_TOKENS_STORAGE_KEY, JSON.stringify(tokens));
};

const storeToken = ({ accessToken = 'stale-token', issuedAt = 100 } = {}) => {
  storeTokens({
    [TOKEN_KEY]: {
      access_token: accessToken,
      issued_at: issuedAt,
    },
  });
};

const storeLogoutMarker = (loggedOutAt, tokenKey = TOKEN_KEY) => {
  window.localStorage.setItem(McpAuthHelpers.getLogoutMarkerStorageKey(tokenKey), String(loggedOutAt));
};

describe('MCP cross-tab logout synchronization', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('removes a session token issued before a logout observed in another tab', () => {
    storeToken({ issuedAt: 100 });
    storeLogoutMarker(200);

    expect(McpAuthHelpers.getAccessToken(TOKEN_KEY)).toBeNull();
    expect(McpAuthHelpers.getAllTokens()).toEqual({});
    expect(JSON.parse(window.sessionStorage.getItem(McpAuthConstants.MC_TOKENS_STORAGE_KEY))).toEqual({});
  });

  it('keeps a token obtained after the most recent logout', () => {
    storeLogoutMarker(200);
    storeToken({ accessToken: 'fresh-token', issuedAt: 201 });

    expect(McpAuthHelpers.getAccessToken(TOKEN_KEY)).toBe('fresh-token');
  });

  it('timestamps a same-millisecond reauthorization after the logout marker', () => {
    storeLogoutMarker(200);
    vi.spyOn(Date, 'now').mockReturnValue(200);

    McpAuthHelpers.setAccessToken(TOKEN_KEY, 'reauthorized-token');

    expect(McpAuthHelpers.getAccessToken(TOKEN_KEY)).toBe('reauthorized-token');
    expect(McpAuthHelpers.getTokenInfo(TOKEN_KEY).issued_at).toBe(201);
  });

  it('publishes a durable marker when this tab logs out', () => {
    storeToken({ issuedAt: 100 });
    McpAuthHelpers.logout(TOKEN_KEY);

    const marker = Number(window.localStorage.getItem(McpAuthHelpers.getLogoutMarkerStorageKey(TOKEN_KEY)));
    expect(marker).toBeGreaterThan(0);
    expect(McpAuthHelpers.getAccessToken(TOKEN_KEY)).toBeNull();
  });

  it('keeps markers for concurrent logouts of different credentials independent', () => {
    storeTokens({
      [TOKEN_KEY]: { access_token: 'first-token', issued_at: 100 },
      [SECOND_TOKEN_KEY]: { access_token: 'second-token', issued_at: 100 },
    });

    McpAuthHelpers.logout(TOKEN_KEY);
    McpAuthHelpers.logout(SECOND_TOKEN_KEY);

    expect(
      Number(window.localStorage.getItem(McpAuthHelpers.getLogoutMarkerStorageKey(TOKEN_KEY))),
    ).toBeGreaterThan(0);
    expect(
      Number(window.localStorage.getItem(McpAuthHelpers.getLogoutMarkerStorageKey(SECOND_TOKEN_KEY))),
    ).toBeGreaterThan(0);
  });

  it('ignores a malformed cross-tab marker value', () => {
    storeToken({ issuedAt: 100 });
    window.localStorage.setItem(McpAuthHelpers.getLogoutMarkerStorageKey(TOKEN_KEY), 'invalid');

    expect(McpAuthHelpers.getAccessToken(TOKEN_KEY)).toBe('stale-token');
  });
});

describe('MCP OAuth family reuse', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  const loginToHeroes = () => {
    McpAuthHelpers.setAccessToken(
      HEROES_URL,
      'family-token',
      3600,
      'heroes-session',
      null,
      'family-refresh-token',
      {
        authorization_server: AUTHORIZATION_SERVER,
        resource_server_url: HEROES_URL,
        resource_scopes: 'openid profile',
      },
    );
  };

  it('reuses a token for another endpoint with the same origin and authorization server', () => {
    loginToHeroes();

    expect(
      McpAuthHelpers.reuseAuthFamilyToken({
        serverUrl: STAFFING_URL,
        authorizationServers: [AUTHORIZATION_SERVER],
        resourceScopes: ['openid'],
      }),
    ).toBe(true);
    expect(McpAuthHelpers.getAccessToken(STAFFING_URL)).toBe('family-token');
    expect(McpAuthHelpers.getSessionId(STAFFING_URL)).toBeNull();
  });

  it('preserves prebuilt toolkit keys when registering an auth family', () => {
    const toolkitType = 'mcp_Example Family';
    McpAuthHelpers.setAccessToken(
      HEROES_URL,
      'family-token',
      3600,
      null,
      null,
      null,
      {
        authorization_server: AUTHORIZATION_SERVER,
        resource_server_url: HEROES_URL,
        resource_scopes: 'openid',
      },
      toolkitType,
    );

    expect(McpAuthHelpers.getAccessToken(HEROES_URL, toolkitType)).toBe('family-token');
    expect(McpAuthHelpers.loadTokens()).not.toHaveProperty('mcp_example family');
  });

  it('does not share a bearer token with another MCP origin', () => {
    loginToHeroes();

    expect(
      McpAuthHelpers.reuseAuthFamilyToken({
        serverUrl: 'https://other.example.com/mcp/staffing',
        authorizationServers: [AUTHORIZATION_SERVER],
      }),
    ).toBe(false);
  });

  it('does not reuse a token when the target requires an ungranted scope', () => {
    loginToHeroes();

    expect(
      McpAuthHelpers.reuseAuthFamilyToken({
        serverUrl: STAFFING_URL,
        authorizationServers: [AUTHORIZATION_SERVER],
        resourceScopes: ['openid', 'staffing.write'],
      }),
    ).toBe(false);
  });

  it('falls back to OAuth after a family token is rejected by an endpoint', () => {
    loginToHeroes();
    const target = {
      serverUrl: STAFFING_URL,
      authorizationServers: [AUTHORIZATION_SERVER],
      resourceScopes: ['openid'],
    };
    expect(McpAuthHelpers.reuseAuthFamilyToken(target)).toBe(true);

    expect(McpAuthHelpers.reuseAuthFamilyToken(target)).toBe(false);
    expect(McpAuthHelpers.getAccessToken(STAFFING_URL)).toBeNull();
  });

  it('logs out every endpoint backed by the same family token', () => {
    loginToHeroes();
    McpAuthHelpers.reuseAuthFamilyToken({
      serverUrl: STAFFING_URL,
      authorizationServers: [AUTHORIZATION_SERVER],
      resourceScopes: ['openid'],
    });

    McpAuthHelpers.logout(HEROES_URL);

    expect(McpAuthHelpers.getAccessToken(HEROES_URL)).toBeNull();
    expect(McpAuthHelpers.getAccessToken(STAFFING_URL)).toBeNull();
  });

  it('keeps tokens in session storage while accepting live cross-tab updates', () => {
    const postedMessages = [];
    let channel;
    class FakeBroadcastChannel {
      constructor() {
        this.onmessage = null;
        channel = this;
      }

      postMessage(message) {
        postedMessages.push(message);
      }

      close() {}
    }
    window.BroadcastChannel = FakeBroadcastChannel;
    const stopSync = McpAuthHelpers.startTokenSync();

    loginToHeroes();

    expect(window.sessionStorage.getItem(McpAuthConstants.MC_TOKENS_STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(McpAuthConstants.MC_TOKENS_STORAGE_KEY)).toBeNull();
    expect(postedMessages[0]).toEqual({ type: 'request_state' });
    expect(postedMessages.some(message => message.type === 'token_upsert')).toBe(true);

    channel.onmessage({
      data: {
        type: 'token_upsert',
        key: STAFFING_URL,
        tokenInfo: { access_token: 'tab-token', issued_at: Date.now() + 1 },
      },
    });
    expect(McpAuthHelpers.getAccessToken(STAFFING_URL)).toBe('tab-token');

    channel.onmessage({ data: { type: 'token_remove', key: STAFFING_URL } });
    expect(McpAuthHelpers.getAccessToken(STAFFING_URL)).toBeNull();
    stopSync();
    delete window.BroadcastChannel;
  });
});
