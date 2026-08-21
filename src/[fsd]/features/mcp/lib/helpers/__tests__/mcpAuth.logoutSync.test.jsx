import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as McpAuthConstants from '@/[fsd]/features/mcp/lib/constants/mcAuth.constants';

vi.mock('@/[fsd]/features/mcp/lib/helpers/mcpAuthFlow.helpers', () => ({
  triggerProactiveRefresh: vi.fn(),
}));

const TOKEN_KEY = 'cfg-1:https://login.microsoftonline.com/tenant';
const SECOND_TOKEN_KEY = 'cfg-2:https://login.microsoftonline.com/tenant';
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
