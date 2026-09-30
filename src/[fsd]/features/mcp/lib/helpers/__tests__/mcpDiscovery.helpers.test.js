import { describe, expect, it, vi } from 'vitest';

import { McpAuthFlowConstants } from '@/[fsd]/features/mcp/lib/constants';

import { extractAuthServerMetadata } from '../mcpDiscovery.helpers';

vi.mock('@/[fsd]/shared/config/store', () => ({ default: { dispatch: vi.fn() } }));
vi.mock('@/api/mcpOAuth', () => ({
  mcpOAuthApi: { endpoints: { registerMcpDynamicClient: { initiate: vi.fn() } } },
}));

const { MISSING_ENDPOINTS, NO_AUTH_SERVERS } = McpAuthFlowConstants.MCP_OAUTH_ERRORS;

describe('extractAuthServerMetadata', () => {
  it('passes complete oauth_authorization_server metadata through unchanged', () => {
    const asMetadata = {
      issuer: 'https://access.stripe.com/mcp',
      authorization_endpoint: 'https://access.stripe.com/mcp/oauth2/authorize',
      token_endpoint: 'https://access.stripe.com/mcp/oauth2/token',
      registration_endpoint: 'https://access.stripe.com/mcp/oauth2/register',
    };
    const metadata = { oauth_authorization_server: asMetadata };

    expect(extractAuthServerMetadata(metadata)).toBe(asMetadata);
  });

  it('passes complete authorization_server metadata through unchanged', () => {
    const asMetadata = {
      issuer: 'https://mcp.miro.com/',
      authorization_endpoint: 'https://miro.com/oauth/authorize',
      token_endpoint: 'https://api.miro.com/v1/oauth/token',
    };
    const metadata = { authorization_server: asMetadata };

    expect(extractAuthServerMetadata(metadata)).toBe(asMetadata);
  });

  it('accepts a metadata object that itself carries both endpoints', () => {
    const asMetadata = {
      authorization_endpoint: 'https://github.com/login/oauth/authorize',
      token_endpoint: 'https://github.com/login/oauth/access_token',
    };

    expect(extractAuthServerMetadata(asMetadata)).toBe(asMetadata);
  });

  it('throws NO_AUTH_SERVERS when the resource metadata has no authorization-server document', () => {
    expect(() =>
      extractAuthServerMetadata({ authorization_servers: ['https://access.stripe.com/mcp'] }),
    ).toThrow(NO_AUTH_SERVERS);
  });

  it('throws NO_AUTH_SERVERS when metadata is null', () => {
    expect(() => extractAuthServerMetadata(null)).toThrow(NO_AUTH_SERVERS);
  });

  it('throws MISSING_ENDPOINTS instead of fabricating an authorization_endpoint', () => {
    const metadata = {
      oauth_authorization_server: {
        issuer: 'https://access.stripe.com/mcp',
        token_endpoint: 'https://access.stripe.com/mcp/oauth2/token',
      },
    };

    expect(() => extractAuthServerMetadata(metadata)).toThrow(MISSING_ENDPOINTS);
  });

  it('throws MISSING_ENDPOINTS instead of fabricating a token_endpoint', () => {
    const metadata = {
      oauth_authorization_server: {
        issuer: 'https://access.stripe.com/mcp',
        authorization_endpoint: 'https://access.stripe.com/mcp/oauth2/authorize',
      },
    };

    expect(() => extractAuthServerMetadata(metadata)).toThrow(MISSING_ENDPOINTS);
  });

  it('throws MISSING_ENDPOINTS for a partial authorization_server document rather than filling it in', () => {
    const metadata = {
      authorization_server: {
        issuer: 'https://mcp.miro.com/',
        authorization_endpoint: 'https://miro.com/oauth/authorize',
      },
    };

    expect(() => extractAuthServerMetadata(metadata)).toThrow(MISSING_ENDPOINTS);
  });
});
