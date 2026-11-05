// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

vi.mock('react-redux', () => ({ useStore: () => ({ getState: () => ({}) }) }));
vi.mock('@/services/tracing', () => ({ generateTraceId: () => 'trace' }));
vi.mock('../../helpers', () => ({ SocketSessionGateHelpers: { emitWithSessionGate: vi.fn() } }));

const { SocketContext } = await import('@/[fsd]/shared/lib/context');
const { useSocket } = await import('@/[fsd]/features/auth/lib/hooks/useSocket.hooks');

// Mirrors socket.io: off(event) without a handler drops every listener of the event
const createSocket = () => {
  const listeners = {};
  return {
    connected: true,
    disconnected: false,
    on: (event, fn) => {
      listeners[event] = [...(listeners[event] || []), fn];
    },
    off: (event, fn) => {
      listeners[event] = fn ? (listeners[event] || []).filter(l => l !== fn) : [];
    },
    listeners: event => listeners[event] || [],
  };
};

const wrapperFor = socket => {
  const Wrapper = props => <SocketContext.Provider value={socket}>{props.children}</SocketContext.Provider>;
  Wrapper.displayName = 'Wrapper';
  return Wrapper;
};

describe('useSocket', () => {
  afterEach(() => cleanup());

  it('keeps the listeners of other hooks when an emit-only hook unmounts', () => {
    const socket = createSocket();
    const handler = vi.fn();
    renderHook(() => useSocket('chat_predict', handler), { wrapper: wrapperFor(socket) });
    const emitOnly = renderHook(() => useSocket('chat_predict'), { wrapper: wrapperFor(socket) });

    emitOnly.unmount();

    expect(socket.listeners('chat_predict')).toEqual([handler]);
  });

  it('removes its own listener on unmount', () => {
    const socket = createSocket();
    const handler = vi.fn();
    const { unmount } = renderHook(() => useSocket('chat_predict', handler), { wrapper: wrapperFor(socket) });

    unmount();

    expect(socket.listeners('chat_predict')).toEqual([]);
  });
});
