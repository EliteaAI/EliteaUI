// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useParticipantOpenApiOAuth } from '../useParticipantOpenApiOAuth.hooks';

const useResolvedOpenApiConfig = vi.fn();
const useMcpTokenChange = vi.fn();

vi.mock('@/[fsd]/features/openapi/lib/hooks', () => ({
  useResolvedOpenApiConfig: (...args) => useResolvedOpenApiConfig(...args),
}));

vi.mock('@/[fsd]/features/mcp', () => ({
  useMcpTokenChange: (...args) => useMcpTokenChange(...args),
}));

const OAUTH_ENDPOINT = 'https://github.com/login/oauth';
const NO_REFERENCE = { openApiConfig: null, oauthEndpoint: '', tokenKey: '' };

const renderOpenApiHook = settings =>
  renderHook(() =>
    useParticipantOpenApiOAuth({
      participant: { entity_settings: { toolkit_type: 'openapi' } },
      originalDetails: { settings },
      entity_meta: { project_id: 2 },
      isToolkitParticipant: true,
    }),
  ).result.current;

describe('useParticipantOpenApiOAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMcpTokenChange.mockReturnValue({ isLoggedIn: false });
  });

  it('does not ask for login when the referenced credential uses a bearer token', () => {
    useResolvedOpenApiConfig.mockReturnValue({
      openApiConfig: { auth_type: 'bearer', configuration_uuid: 'uuid-1' },
      oauthEndpoint: '',
      tokenKey: '',
    });

    const { openApiConfig, openApiOAuthLoggedOut } = renderOpenApiHook({
      openapi_configuration: { elitea_title: 'github-bearer' },
    });

    expect(openApiOAuthLoggedOut).toBe(false);
    expect(openApiConfig).toBeNull();
  });

  it('asks for login when the referenced credential is delegated and the user has no token', () => {
    const credential = { oauth_discovery_endpoint: OAUTH_ENDPOINT, configuration_uuid: 'uuid-1' };
    useResolvedOpenApiConfig.mockReturnValue({
      openApiConfig: credential,
      oauthEndpoint: OAUTH_ENDPOINT,
      tokenKey: `uuid-1:${OAUTH_ENDPOINT}`,
    });

    const { openApiConfig, openApiOAuthLoggedOut } = renderOpenApiHook({
      openapi_configuration: { elitea_title: 'github-oauth' },
    });

    expect(openApiOAuthLoggedOut).toBe(true);
    expect(openApiConfig).toBe(credential);
  });

  it('does not ask for login when inline settings carry no OAuth discovery endpoint', () => {
    useResolvedOpenApiConfig.mockReturnValue(NO_REFERENCE);

    expect(renderOpenApiHook({ spec: '{}' }).openApiOAuthLoggedOut).toBe(false);
  });

  it('asks for login when inline settings carry an OAuth discovery endpoint', () => {
    useResolvedOpenApiConfig.mockReturnValue(NO_REFERENCE);

    expect(renderOpenApiHook({ oauth_discovery_endpoint: OAUTH_ENDPOINT }).openApiOAuthLoggedOut).toBe(true);
  });
});
