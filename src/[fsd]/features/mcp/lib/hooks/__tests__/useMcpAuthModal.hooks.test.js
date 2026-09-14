// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useMcpAuthModal } from '../useMcpAuthModal.hooks';

const { reuseAuthFamilyToken } = vi.hoisted(() => ({
  reuseAuthFamilyToken: vi.fn(),
}));

vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: {
    isPrebuildMcpType: type => type?.startsWith('mcp_') && type !== 'mcp',
    reuseAuthFamilyToken,
  },
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 30,
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastSuccess: vi.fn() }),
}));

const TOOLKIT_TYPE = 'mcp_Epam Delivery Central';
const SERVER_URL = 'https://mcp.example.com/mcp/delivery_central';
const AUTHORIZATION_SERVER = 'https://login.example.com/oauth';
const AUTH_MESSAGE = {
  response_metadata: {
    server_url: SERVER_URL,
    resource_metadata: {
      authorization_servers: [AUTHORIZATION_SERVER],
    },
  },
};

describe('useMcpAuthModal existing preconfigured MCP reuse', () => {
  beforeEach(() => {
    reuseAuthFamilyToken.mockReset().mockReturnValue(false);
  });

  it('targets the toolkit key and stays modal-free when family reuse succeeds', () => {
    reuseAuthFamilyToken.mockReturnValue(true);
    const { result } = renderHook(() =>
      useMcpAuthModal({
        values: { id: 924, type: TOOLKIT_TYPE, settings: {} },
      }),
    );

    act(() => {
      result.current.handleMcpAuthRequired(AUTH_MESSAGE);
    });

    expect(reuseAuthFamilyToken).toHaveBeenCalledWith({
      serverUrl: SERVER_URL,
      tokenStorageKey: TOOLKIT_TYPE,
      authorizationServers: [AUTHORIZATION_SERVER],
      resourceScopes: undefined,
    });
    expect(result.current.showModal).toBe(false);
  });

  it('opens OAuth when the automatic first login cannot reuse a family token', () => {
    const { result } = renderHook(() =>
      useMcpAuthModal({
        values: { id: 924, type: TOOLKIT_TYPE, settings: {} },
      }),
    );

    act(() => {
      result.current.handleMcpAuthRequired(AUTH_MESSAGE);
    });

    expect(result.current.showModal).toBe(true);
  });
});
