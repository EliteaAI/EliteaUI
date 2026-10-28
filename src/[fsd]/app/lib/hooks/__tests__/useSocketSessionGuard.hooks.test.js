// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

let sessionExpired = false;
const dispatch = vi.fn(action => {
  if (action.type === 'settings/setSessionExpired') sessionExpired = action.payload;
});
let isStreaming = false;
let runActiveCount = 0;
const store = {
  getState: () => ({ settings: { sessionExpired, runActiveCount, navBlocker: { isStreaming } } }),
};
const probeSession = vi.fn();
let reauthListener = null;
const stopReauthListener = vi.fn();

vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useStore: () => store,
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
  const socketHandlers = {};
  const socket = {
    io: {
      on: vi.fn((event, handler) => {
        managerHandlers[event] = handler;
      }),
      off: vi.fn(),
    },
    connect: vi.fn(),
    on: vi.fn((event, handler) => {
      socketHandlers[event] = handler;
    }),
    off: vi.fn(),
  };
  socket.disconnect = vi.fn(() => socket);
  return { socket, managerHandlers, socketHandlers };
};

const expiredAction = { type: 'settings/setSessionExpired', payload: true };
const aliveAction = { type: 'settings/setSessionExpired', payload: false };

describe('useSocketSessionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reauthListener = null;
    sessionExpired = false;
    isStreaming = false;
    runActiveCount = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    cleanup();
  });

  const setVisibility = state => {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  };

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

  it('re-handshakes when the session flag was set outside the hook and the session is alive', async () => {
    probeSession.mockResolvedValue('alive');
    sessionExpired = true;
    const { socket, managerHandlers } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    await act(async () => managerHandlers.reconnect());

    expect(dispatch).toHaveBeenCalledWith(aliveAction);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('resets the visibility throttle when the socket changes', async () => {
    probeSession.mockResolvedValue('alive');
    const { socket: firstSocket } = createSocket();
    const { socket: secondSocket } = createSocket();
    const { rerender } = renderHook(({ socket }) => useSocketSessionGuard(socket), {
      initialProps: { socket: firstSocket },
    });

    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    rerender({ socket: secondSocket });
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));

    expect(probeSession).toHaveBeenCalledTimes(2);
  });

  it('re-handshakes when the tab returns after a long time hidden, even though the session is alive', async () => {
    vi.useFakeTimers();
    probeSession.mockResolvedValue('alive');
    const { socket } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    act(() => setVisibility('hidden'));
    vi.setSystemTime(Date.now() + 6 * 60 * 1000);
    await act(async () => setVisibility('visible'));

    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('does not re-handshake after a short time hidden', async () => {
    vi.useFakeTimers();
    probeSession.mockResolvedValue('alive');
    const { socket } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    act(() => setVisibility('hidden'));
    vi.setSystemTime(Date.now() + 30 * 1000);
    await act(async () => setVisibility('visible'));

    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('keeps a streaming run alive across a long hidden period', async () => {
    vi.useFakeTimers();
    isStreaming = true;
    probeSession.mockResolvedValue('alive');
    const { socket } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    act(() => setVisibility('hidden'));
    vi.setSystemTime(Date.now() + 6 * 60 * 1000);
    await act(async () => setVisibility('visible'));

    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('keeps a run alive across a long hidden period when only the run-active counter knows about it', async () => {
    vi.useFakeTimers();
    runActiveCount = 1;
    probeSession.mockResolvedValue('alive');
    const { socket } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    act(() => setVisibility('hidden'));
    vi.setSystemTime(Date.now() + 6 * 60 * 1000);
    await act(async () => setVisibility('visible'));

    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('re-handshakes when the server rejects a send from an anonymous socket', async () => {
    probeSession.mockResolvedValue('alive');
    const { socket, socketHandlers } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    await act(async () => socketHandlers.socket_validation_error({ code: 'socket_unauthenticated' }));

    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('asks for a new login instead of re-handshaking when the rejection came from an expired session', async () => {
    probeSession.mockResolvedValue('expired');
    const { socket, socketHandlers } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    await act(async () => socketHandlers.socket_validation_error({ code: 'socket_unauthenticated' }));

    expect(dispatch).toHaveBeenCalledWith(expiredAction);
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('ignores validation errors without the unauthenticated code', async () => {
    const { socket, socketHandlers } = createSocket();
    renderHook(() => useSocketSessionGuard(socket));

    await act(async () => socketHandlers.socket_validation_error({ content: 'bad payload' }));

    expect(probeSession).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const { socket, managerHandlers } = createSocket();
    const { unmount } = renderHook(() => useSocketSessionGuard(socket));

    unmount();

    expect(stopReauthListener).toHaveBeenCalledTimes(1);
    expect(socket.io.off).toHaveBeenCalledWith('reconnect', managerHandlers.reconnect);
  });
});
