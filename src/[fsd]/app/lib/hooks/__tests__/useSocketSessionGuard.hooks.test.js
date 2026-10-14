// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

const dispatch = vi.fn();
const probeSession = vi.fn();
let reauthListener = null;
const stopReauthListener = vi.fn();

vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
}));

vi.mock('@/slices/settings.js', () => ({
  actions: {
    setSessionExpired: payload => ({ type: 'settings/setSessionExpired', payload }),
  },
}));

vi.mock('@/[fsd]/features/auth/lib/helpers', () => ({
  AuthPopupHelpers: {
    onReauthenticated: listener => {
      reauthListener = listener;
      return stopReauthListener;
    },
  },
  SessionProbeHelpers: {
    probeSession: (...args) => probeSession(...args),
  },
}));

const { useSocketSessionGuard } = await import('../useSocketSessionGuard.hooks');

const createSocket = () => {
  const managerHandlers = {};
  const socket = {
    io: {
      on: vi.fn((event, handler) => {
        managerHandlers[event] = handler;
      }),
      off: vi.fn(),
    },
    connect: vi.fn(),
  };
  socket.disconnect = vi.fn(() => socket);
  return { socket, managerHandlers };
};

const expiredAction = { type: 'settings/setSessionExpired', payload: true };
const aliveAction = { type: 'settings/setSessionExpired', payload: false };

describe('useSocketSessionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reauthListener = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('does nothing until the socket exists', () => {
    renderHook(() => useSocketSessionGuard(null));

    expect(reauthListener).toBeNull();
  });

  it('flags the session as expired when a reconnect happened with an expired session', async () => {
    probeSession.mockResolvedValue('expired');
    const { socket, managerHandlers } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    act(() => managerHandlers.reconnect());

    await waitFor(() => expect(dispatch).toHaveBeenCalledWith(expiredAction));
  });

  it('clears the flag without re-handshaking when the session stayed alive', async () => {
    probeSession.mockResolvedValue('alive');
    const { socket, managerHandlers } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    act(() => managerHandlers.reconnect());

    await waitFor(() => expect(dispatch).toHaveBeenCalledWith(aliveAction));
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('re-handshakes the socket when the session was renewed in another tab', async () => {
    probeSession.mockResolvedValueOnce('expired').mockResolvedValueOnce('alive');
    const { socket, managerHandlers } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    await act(async () => managerHandlers.reconnect());
    expect(dispatch).toHaveBeenCalledWith(expiredAction);
    expect(socket.disconnect).not.toHaveBeenCalled();

    await act(async () => managerHandlers.reconnect());

    expect(dispatch).toHaveBeenLastCalledWith(aliveAction);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('leaves the flag alone when the session check is inconclusive', async () => {
    probeSession.mockResolvedValue('unknown');
    const { socket, managerHandlers } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    await act(async () => managerHandlers.reconnect());

    expect(probeSession).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('re-handshakes the socket after a successful re-login', () => {
    const { socket } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    act(() => reauthListener());

    expect(dispatch).toHaveBeenCalledWith(aliveAction);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('checks the session when the tab becomes visible, at most once per minute', async () => {
    probeSession.mockResolvedValue('alive');
    const { socket } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));

    expect(probeSession).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', () => {
    const { socket, managerHandlers } = createSocket();
    const { unmount } = renderHook(() => useSocketSessionGuard(socket));

    unmount();

    expect(stopReauthListener).toHaveBeenCalledTimes(1);
    expect(socket.io.off).toHaveBeenCalledWith('reconnect', managerHandlers.reconnect);
  });
});
