// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTokenInfo, setAccessToken } from '../mcpAuth.helpers';

vi.hoisted(() => {
  const buildStorage = () => {
    const values = new Map();
    return {
      clear: () => values.clear(),
      getItem: key => (values.has(key) ? values.get(key) : null),
      removeItem: key => values.delete(key),
      setItem: (key, value) => values.set(key, String(value)),
    };
  };
  Object.defineProperty(globalThis, 'localStorage', { value: buildStorage(), configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: buildStorage(), configurable: true });
});

vi.mock('@/[fsd]/features/mcp/lib/helpers/mcpAuthFlow.helpers', () => ({
  triggerProactiveRefresh: vi.fn(),
}));

const SERVER_URL = 'https://mcp.monday.com/mcp';

const signIn = oauthMeta => setAccessToken(SERVER_URL, 'access', 3600, null, null, 'refresh', oauthMeta);

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  signIn({ token_endpoint: 'https://auth.example.test/token', resource: SERVER_URL });
});

describe('stored resource indicator across re-authorization and refresh (#6688)', () => {
  it('drops the stored resource when a fresh authorization sends none', () => {
    signIn({ token_endpoint: 'https://auth.example.test/token', resource: undefined });

    expect(getTokenInfo(SERVER_URL).resource).toBeUndefined();
  });

  it('replaces the stored resource with the one a fresh authorization sends', () => {
    signIn({ token_endpoint: 'https://auth.example.test/token', resource: 'https://mcp.monday.com/mcp/v2' });

    expect(getTokenInfo(SERVER_URL).resource).toBe('https://mcp.monday.com/mcp/v2');
  });

  it('keeps the stored resource through a refresh that does not restate it', () => {
    signIn({ token_endpoint: 'https://auth.example.test/token' });

    expect(getTokenInfo(SERVER_URL).resource).toBe(SERVER_URL);
  });
});
