// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { withOfflineAccess } from '@/[fsd]/features/mcp/lib/helpers/mcpAuthFlow.helpers';

import { hasSavedMcpLogin, isLoginForServer } from '../useMcpSavedLogin.hooks';

describe('#7643 saved MCP login helpers', () => {
  it('matches a login only to its own server (canonical URL)', () => {
    const credential = { data: { url: 'https://MCP.example.com/mcp/' } };
    expect(isLoginForServer(credential, 'https://mcp.example.com/mcp')).toBe(true);
    expect(isLoginForServer(credential, 'https://other.example.com/mcp')).toBe(false);
    expect(isLoginForServer(undefined, 'https://mcp.example.com/mcp')).toBe(false);
  });

  it('treats only a stored refresh token as a saved login', () => {
    expect(hasSavedMcpLogin({ data: { refresh_token: '*****' } })).toBe(true);
    expect(hasSavedMcpLogin({ data: {} })).toBe(false);
  });

  it('asks for offline_access only where the server offers it', () => {
    expect(withOfflineAccess('read', { scopes_supported: ['read', 'offline_access'] })).toBe(
      'read offline_access',
    );
    expect(withOfflineAccess('read offline_access', { scopes_supported: ['offline_access'] })).toBe(
      'read offline_access',
    );
    expect(withOfflineAccess('read', { scopes_supported: ['read'] })).toBe('read');
    expect(withOfflineAccess('', { scopes_supported: ['offline_access'] })).toBe('offline_access');
  });
});
