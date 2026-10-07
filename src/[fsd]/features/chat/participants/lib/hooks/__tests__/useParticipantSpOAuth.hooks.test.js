// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useParticipantSpOAuth } from '../useParticipantSpOAuth.hooks';

const useResolvedSharepointConfig = vi.fn();
const useMcpTokenChange = vi.fn();

vi.mock('@/[fsd]/features/sharepoint', () => ({
  useResolvedSharepointConfig: (...args) => useResolvedSharepointConfig(...args),
}));

vi.mock('@/[fsd]/features/mcp', () => ({
  useMcpTokenChange: (...args) => useMcpTokenChange(...args),
}));

const SP_CREDENTIAL = { site_url: 'https://contoso.sharepoint.com', configuration_uuid: 'uuid-1' };

const renderSpHook = () =>
  renderHook(() =>
    useParticipantSpOAuth({
      participant: { entity_settings: { toolkit_type: 'sharepoint' } },
      originalDetails: { settings: { sharepoint_configuration: { elitea_title: 'sp-cred' } } },
      entity_meta: { project_id: 2 },
      isToolkitParticipant: true,
    }),
  ).result.current;

describe('useParticipantSpOAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMcpTokenChange.mockReturnValue({ isLoggedIn: false });
  });

  it('does not ask for login when the credential is app-only (no OAuth discovery endpoint)', () => {
    useResolvedSharepointConfig.mockReturnValue({
      spConfig: SP_CREDENTIAL,
      oauthEndpoint: '',
      connectionTokenKey: 'uuid-1:https://contoso.sharepoint.com',
    });

    const { spConfig, spOAuthLoggedOut } = renderSpHook();

    expect(spOAuthLoggedOut).toBe(false);
    expect(spConfig).toBeNull();
  });

  it('asks for login when the credential is delegated and the user has no token', () => {
    useResolvedSharepointConfig.mockReturnValue({
      spConfig: SP_CREDENTIAL,
      oauthEndpoint: 'https://login.microsoftonline.com/tenant',
      connectionTokenKey: 'uuid-1:https://login.microsoftonline.com/tenant',
    });

    const { spConfig, spOAuthLoggedOut } = renderSpHook();

    expect(spOAuthLoggedOut).toBe(true);
    expect(spConfig).toBe(SP_CREDENTIAL);
  });

  it('clears the login prompt once the delegated user is logged in', () => {
    useResolvedSharepointConfig.mockReturnValue({
      spConfig: SP_CREDENTIAL,
      oauthEndpoint: 'https://login.microsoftonline.com/tenant',
      connectionTokenKey: 'uuid-1:https://login.microsoftonline.com/tenant',
    });
    useMcpTokenChange.mockReturnValue({ isLoggedIn: true });

    expect(renderSpHook().spOAuthLoggedOut).toBe(false);
  });
});
