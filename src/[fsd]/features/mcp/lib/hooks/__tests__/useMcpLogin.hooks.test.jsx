// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useMcpLogin } from '../useMcpLogin.hooks';

const mocks = vi.hoisted(() => ({
  runAuthCheck: vi.fn(),
  setConnectionVerified: vi.fn(),
  claimAutomaticHeaderCheck: vi.fn(),
  authCheckOptions: null,
  isLoggedIn: false,
}));

vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: {
    isPrebuildMcpType: type => type?.startsWith('mcp_'),
    setConnectionVerified: mocks.setConnectionVerified,
    claimAutomaticHeaderCheck: mocks.claimAutomaticHeaderCheck,
  },
}));

vi.mock('../useMcpTokenChange.hooks', () => ({
  useMcpTokenChange: () => ({ isLoggedIn: mocks.isLoggedIn }),
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 30,
}));

vi.mock('../useMcpAuthModal.hooks', () => ({
  useMcpAuthModal: () => ({ getModalProps: () => ({}), handleMcpAuthRequired: vi.fn() }),
}));

vi.mock('../useMcpAuthCheck.hooks', () => ({
  useMcpAuthCheck: options => {
    mocks.authCheckOptions = options;
    return { runAuthCheck: mocks.runAuthCheck, isRunning: false };
  },
}));

const remoteMcp = {
  id: 925,
  type: 'mcp',
  settings: { url: 'https://example.com/mcp', headers: { Authorization: 'secret-reference' } },
};

describe('useMcpLogin configured header verification', () => {
  beforeEach(() => {
    mocks.runAuthCheck.mockReset();
    mocks.setConnectionVerified.mockReset();
    mocks.claimAutomaticHeaderCheck.mockReset().mockReturnValue(true);
    mocks.authCheckOptions = null;
    mocks.isLoggedIn = false;
  });

  it('checks a saved remote MCP once and marks it connected only after success', () => {
    const { rerender } = renderHook(() =>
      useMcpLogin({ values: remoteMcp, autoVerifyConfiguredHeaders: true }),
    );

    expect(mocks.runAuthCheck).toHaveBeenCalledExactlyOnceWith({ silent: true });
    expect(mocks.setConnectionVerified).not.toHaveBeenCalled();

    rerender();
    expect(mocks.runAuthCheck).toHaveBeenCalledTimes(1);

    act(() => mocks.authCheckOptions.onSuccess());
    expect(mocks.setConnectionVerified).toHaveBeenCalledWith('https://example.com/mcp');
  });

  it('does not check without configured headers or when already logged in', () => {
    renderHook(() =>
      useMcpLogin({
        values: { ...remoteMcp, settings: { url: remoteMcp.settings.url } },
        autoVerifyConfiguredHeaders: true,
      }),
    );
    expect(mocks.runAuthCheck).not.toHaveBeenCalled();

    mocks.isLoggedIn = true;
    renderHook(() => useMcpLogin({ values: remoteMcp, autoVerifyConfiguredHeaders: true }));
    expect(mocks.runAuthCheck).not.toHaveBeenCalled();
  });

  it('leaves injected login flows in control', () => {
    renderHook(() =>
      useMcpLogin({
        values: remoteMcp,
        authConfig: { onLogin: vi.fn() },
        autoVerifyConfiguredHeaders: true,
      }),
    );

    expect(mocks.runAuthCheck).not.toHaveBeenCalled();
    expect(mocks.claimAutomaticHeaderCheck).not.toHaveBeenCalled();
  });

  it('does not repeat a failed automatic check when the card remounts', () => {
    mocks.claimAutomaticHeaderCheck.mockReturnValueOnce(true).mockReturnValue(false);

    const firstCard = renderHook(() => useMcpLogin({ values: remoteMcp, autoVerifyConfiguredHeaders: true }));
    firstCard.unmount();
    renderHook(() => useMcpLogin({ values: remoteMcp, autoVerifyConfiguredHeaders: true }));

    expect(mocks.runAuthCheck).toHaveBeenCalledExactlyOnceWith({ silent: true });
    expect(mocks.claimAutomaticHeaderCheck).toHaveBeenCalledTimes(2);
  });
});
