// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useMcpLogin } from '../useMcpLogin.hooks';

const mocks = vi.hoisted(() => ({
  runAuthCheck: vi.fn(),
  setConnectionVerified: vi.fn(),
  claimAutomaticHeaderCheck: vi.fn(),
  getAccessToken: vi.fn(),
  authCheckOptions: null,
  isLoggedIn: false,
  isRunning: false,
  isVerifying: false,
}));

vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: {
    isPrebuildMcpType: type => type?.startsWith('mcp_'),
    setConnectionVerified: mocks.setConnectionVerified,
    claimAutomaticHeaderCheck: mocks.claimAutomaticHeaderCheck,
    getAccessToken: mocks.getAccessToken,
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
    return {
      runAuthCheck: (...args) => mocks.runAuthCheck(...args),
      isRunning: mocks.isRunning,
      isVerifying: mocks.isVerifying,
    };
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
    mocks.getAccessToken.mockReset().mockReturnValue(null);
    mocks.authCheckOptions = null;
    mocks.isLoggedIn = false;
    mocks.isRunning = false;
    mocks.isVerifying = false;
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

    mocks.getAccessToken.mockReturnValue('existing-token');
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

  it('does not recheck half-edited headers after the initial automatic attempt', () => {
    const { rerender } = renderHook(
      ({ values }) => useMcpLogin({ values, autoVerifyConfiguredHeaders: true }),
      { initialProps: { values: remoteMcp } },
    );

    rerender({
      values: {
        ...remoteMcp,
        settings: { ...remoteMcp.settings, headers: { Authorization: 'partially-edited' } },
      },
    });

    expect(mocks.runAuthCheck).toHaveBeenCalledExactlyOnceWith({ silent: true });
    expect(mocks.claimAutomaticHeaderCheck).toHaveBeenCalledTimes(1);
  });

  it('checks a different toolkit when a card instance is reused', () => {
    const { rerender } = renderHook(
      ({ values }) => useMcpLogin({ values, autoVerifyConfiguredHeaders: true }),
      { initialProps: { values: remoteMcp } },
    );
    const nextMcp = {
      ...remoteMcp,
      id: 926,
      settings: { ...remoteMcp.settings, url: 'https://other.example.com/mcp' },
    };

    rerender({ values: nextMcp });
    rerender({ values: { ...nextMcp } });

    expect(mocks.runAuthCheck).toHaveBeenCalledTimes(2);
    expect(mocks.claimAutomaticHeaderCheck).toHaveBeenNthCalledWith(
      2,
      30,
      926,
      'https://other.example.com/mcp',
    );
  });

  it('checks the new toolkit even while the reused card reports the previous login state', () => {
    mocks.getAccessToken.mockImplementation(url =>
      url === remoteMcp.settings.url ? 'existing-token' : null,
    );
    mocks.isLoggedIn = true;
    const { rerender } = renderHook(
      ({ values }) => useMcpLogin({ values, autoVerifyConfiguredHeaders: true }),
      { initialProps: { values: remoteMcp } },
    );
    expect(mocks.runAuthCheck).not.toHaveBeenCalled();

    rerender({
      values: {
        ...remoteMcp,
        id: 926,
        settings: { ...remoteMcp.settings, url: 'https://other.example.com/mcp' },
      },
    });
    expect(mocks.runAuthCheck).toHaveBeenCalledExactlyOnceWith({ silent: true });
  });

  it('does not reconnect automatically after logout in the same mount', () => {
    mocks.getAccessToken.mockReturnValue('existing-token');
    const { rerender } = renderHook(() =>
      useMcpLogin({ values: remoteMcp, autoVerifyConfiguredHeaders: true }),
    );

    mocks.getAccessToken.mockReturnValue(null);
    rerender();

    expect(mocks.runAuthCheck).not.toHaveBeenCalled();
  });

  it('keeps the manual login state separate from background verification', () => {
    mocks.isVerifying = true;
    const { result } = renderHook(() => useMcpLogin({ values: remoteMcp }));

    expect(result.current.isRunning).toBe(false);
    expect(result.current.isVerifying).toBe(true);

    act(() => result.current.onLogin({ stopPropagation: vi.fn() }));
    expect(mocks.runAuthCheck).toHaveBeenCalledExactlyOnceWith();
  });
});
