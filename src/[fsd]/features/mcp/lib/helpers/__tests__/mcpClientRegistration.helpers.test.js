import { describe, expect, it } from 'vitest';

import asMetadata6689 from '../__fixtures__/asMetadata6689.json';
import { getOAuthClientRequirements } from '../mcpClientRegistration.helpers';

describe('getOAuthClientRequirements against the 20 recorded authorization servers (#6689)', () => {
  it.each(asMetadata6689.servers.map(server => [server.name, server.metadata, server.expected]))(
    '%s resolves to the recorded fields',
    (_name, metadata, expected) => {
      const requirements = getOAuthClientRequirements(metadata, undefined);

      expect(requirements.authFlow).toBe(expected.authFlow);
      expect(requirements.requiresClientSecret).toBe(expected.requiresClientSecret);
      expect(requirements.needClientId).toBe(expected.needClientId);
      expect(requirements.needClientSecret).toBe(expected.needClientSecret);
      expect(requirements.isClientSecretMandatory).toBe(expected.isClientSecretMandatory);
    },
  );
});

const findServerMetadata = name => asMetadata6689.servers.find(server => server.name === name).metadata;

describe('getOAuthClientRequirements backend-provided credential precedence', () => {
  it('does not need a Client ID when the backend already sends mcp_client_id (prebuilt GitHub)', () => {
    const requirements = getOAuthClientRequirements(findServerMetadata('GitHub'), {
      mcp_client_id: 'gh-app-id',
    });

    expect(requirements.needClientId).toBe(false);
    expect(requirements.requiresClientSecret).toBe(true);
    expect(requirements.needClientSecret).toBe(true);
  });

  it('does not need a Client Secret when the backend already sends mcp_client_secret (prebuilt GitHub)', () => {
    const requirements = getOAuthClientRequirements(findServerMetadata('GitHub'), {
      mcp_client_secret: 'gh-app-secret',
    });

    expect(requirements.needClientSecret).toBe(false);
    expect(requirements.requiresClientSecret).toBe(true);
  });

  it('does not need a Client Secret when the backend reports has_mcp_client_secret without echoing the value (SharePoint)', () => {
    const requirements = getOAuthClientRequirements(findServerMetadata('Entra v2 tenant'), {
      mcp_client_id: 'sharepoint-client-id',
      has_mcp_client_secret: true,
    });

    expect(requirements.needClientId).toBe(false);
    expect(requirements.needClientSecret).toBe(false);
    expect(requirements.requiresClientSecret).toBe(true);
  });

  it('still needs both fields when providedSettings is absent (SharePoint document, no backend settings)', () => {
    const requirements = getOAuthClientRequirements(findServerMetadata('Entra v2 tenant'), undefined);

    expect(requirements.needClientId).toBe(true);
    expect(requirements.needClientSecret).toBe(true);
  });
});

describe('getOAuthClientRequirements with an omitted token_endpoint_auth_methods_supported list', () => {
  it('treats the omitted list as confidential and requires a Client Secret (GitHub, no auth-methods field)', () => {
    const githubMetadata = findServerMetadata('GitHub');
    expect(githubMetadata.token_endpoint_auth_methods_supported).toBeUndefined();

    const requirements = getOAuthClientRequirements(githubMetadata, undefined);

    expect(requirements.requiresClientSecret).toBe(true);
    expect(requirements.needClientSecret).toBe(true);
  });

  it('treats the omitted list as confidential even with no registration_endpoint and no PKCE support', () => {
    const requirements = getOAuthClientRequirements(
      {
        authorization_endpoint: 'https://auth.example.com/authorize',
        token_endpoint: 'https://auth.example.com/token',
      },
      undefined,
    );

    expect(requirements.authFlow).toBe('standard');
    expect(requirements.requiresClientSecret).toBe(true);
    expect(requirements.needClientSecret).toBe(true);
    expect(requirements.needClientId).toBe(true);
  });
});

describe('getOAuthClientRequirements reads an omitted auth-methods list per question (#6689)', () => {
  const ENDPOINTS = {
    authorization_endpoint: 'https://auth.example.com/authorize',
    token_endpoint: 'https://auth.example.com/token',
  };

  it('lets registration issue a public client when the list is omitted', () => {
    const requirements = getOAuthClientRequirements(
      { ...ENDPOINTS, registration_endpoint: 'https://auth.example.com/register' },
      undefined,
    );

    expect(requirements.authFlow).toBe('dcr');
    expect(requirements.needClientId).toBe(false);
    expect(requirements.needClientSecret).toBe(false);
  });

  it('keeps the token endpoint confidential when the list is omitted and registration is unavailable', () => {
    const requirements = getOAuthClientRequirements(ENDPOINTS, undefined);

    expect(requirements.requiresClientSecret).toBe(true);
  });
});

describe('getOAuthClientRequirements detects OIDC the same way the authorization flow does (#6689)', () => {
  const ENDPOINTS = {
    authorization_endpoint: 'https://auth.example.com/authorize',
    token_endpoint: 'https://auth.example.com/token',
  };

  it('treats an issuer that offers the openid scope as OIDC even without a userinfo endpoint', () => {
    const requirements = getOAuthClientRequirements(
      { ...ENDPOINTS, issuer: 'https://auth.example.com', scopes_supported: ['openid', 'profile'] },
      undefined,
    );

    expect(requirements.authFlow).toBe('oidc');
  });

  it('does not treat a userinfo endpoint without the openid scope as OIDC', () => {
    const requirements = getOAuthClientRequirements(
      { ...ENDPOINTS, userinfo_endpoint: 'https://auth.example.com/userinfo', scopes_supported: ['repo'] },
      undefined,
    );

    expect(requirements.authFlow).toBe('standard');
  });
});
