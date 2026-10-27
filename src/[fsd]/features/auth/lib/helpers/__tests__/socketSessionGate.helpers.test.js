import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const openAuthPopup = vi.fn();

vi.mock('../authPopup.helpers', () => ({
  openAuthPopup: (...args) => openAuthPopup(...args),
}));

const { SessionConstants } = await import('@/[fsd]/features/auth/lib/constants');
const { emitWithSessionGate } = await import('../socketSessionGate.helpers');

const { SESSION_EXPIRED_MESSAGE, SEND_NO_RESPONSE_MESSAGE, SEND_RESPONSE_TIMEOUT_MS } = SessionConstants;

const createSocket = errorListeners => ({
  emit: vi.fn(() => true),
  listeners: vi.fn(() => errorListeners),
});

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('emitWithSessionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits immediately while the session is valid', () => {
    const socket = createSocket([]);

    const result = emitWithSessionGate({
      socket,
      event: 'chat_predict',
      payload: { question_id: 'q1' },
      isSessionExpired: false,
    });

    expect(result).toBe(true);
    expect(socket.emit).toHaveBeenCalledWith('chat_predict', { question_id: 'q1' });
    expect(openAuthPopup).not.toHaveBeenCalled();
  });

  it('does not gate events that do not start a run', () => {
    const socket = createSocket([]);

    emitWithSessionGate({ socket, event: 'chat_leave_rooms', payload: [], isSessionExpired: true });

    expect(socket.emit).toHaveBeenCalledWith('chat_leave_rooms', []);
    expect(openAuthPopup).not.toHaveBeenCalled();
  });

  it('re-authenticates synchronously, then emits after a successful login', async () => {
    const socket = createSocket([]);
    openAuthPopup.mockResolvedValue();

    const result = emitWithSessionGate({
      socket,
      event: 'chat_predict',
      payload: { question_id: 'q1' },
      isSessionExpired: true,
    });

    expect(result).toBe(false);
    expect(openAuthPopup).toHaveBeenCalledTimes(1);
    expect(socket.emit).not.toHaveBeenCalled();

    await flushPromises();

    expect(socket.emit).toHaveBeenCalledWith('chat_predict', { question_id: 'q1' });
  });

  it('settles the reply placeholder through validation error listeners when login is abandoned', async () => {
    const errorListener = vi.fn();
    const socket = createSocket([errorListener]);
    openAuthPopup.mockRejectedValue(new Error('Popup closed'));

    emitWithSessionGate({
      socket,
      event: 'chat_predict',
      payload: { question_id: 'q1', conversation_uuid: 'conv-1' },
      isSessionExpired: true,
    });
    await flushPromises();

    expect(socket.emit).not.toHaveBeenCalled();
    expect(socket.listeners).toHaveBeenCalledWith('socket_validation_error');
    expect(errorListener).toHaveBeenCalledWith({
      event: 'chat_predict',
      type: 'error',
      content: SESSION_EXPIRED_MESSAGE,
      stream_id: 'conv-1',
      message_id: 'q1',
    });
  });

  it('uses message_id for continue events', async () => {
    const errorListener = vi.fn();
    const socket = createSocket([errorListener]);
    openAuthPopup.mockRejectedValue(new Error('Popup closed'));

    emitWithSessionGate({
      socket,
      event: 'chat_continue_predict',
      payload: { message_id: 'm1' },
      isSessionExpired: true,
    });
    await flushPromises();

    expect(errorListener).toHaveBeenCalledWith(expect.objectContaining({ message_id: 'm1' }));
  });
});

describe('emitWithSessionGate response watchdog', () => {
  const createWatchedSocket = errorListener => {
    const anyListeners = new Set();
    const socket = {
      active: true,
      emit: vi.fn(() => true),
      listeners: vi.fn(() => [errorListener]),
      onAny: vi.fn(listener => anyListeners.add(listener)),
      offAny: vi.fn(listener => anyListeners.delete(listener)),
      connect: vi.fn(),
    };
    socket.disconnect = vi.fn(() => socket);
    return { socket, receive: (event, frame) => anyListeners.forEach(listener => listener(event, frame)) };
  };

  const send = socket =>
    emitWithSessionGate({
      socket,
      event: 'chat_predict',
      payload: { question_id: 'q1', conversation_uuid: 'conv-1' },
      isSessionExpired: false,
    });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('settles the placeholder and re-handshakes when the server never answers', () => {
    const errorListener = vi.fn();
    const { socket } = createWatchedSocket(errorListener);

    send(socket);
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS);

    expect(errorListener).toHaveBeenCalledWith({
      event: 'chat_predict',
      type: 'error',
      content: SEND_NO_RESPONSE_MESSAGE,
      stream_id: 'conv-1',
      message_id: 'q1',
      code: 'send_no_response',
    });
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    expect(socket.offAny).toHaveBeenCalledTimes(1);
  });

  it('stops waiting once any frame for the same stream arrives', () => {
    const errorListener = vi.fn();
    const { socket, receive } = createWatchedSocket(errorListener);

    send(socket);
    receive('chat_predict', { type: 'start_task', stream_id: 'conv-1' });
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS * 2);

    expect(errorListener).not.toHaveBeenCalled();
    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.offAny).toHaveBeenCalledTimes(1);
  });

  it('keeps waiting when only a frame of another stream arrives', () => {
    const errorListener = vi.fn();
    const { socket, receive } = createWatchedSocket(errorListener);

    send(socket);
    receive('chat_predict', { type: 'start_task', stream_id: 'conv-2' });
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS);

    expect(errorListener).toHaveBeenCalledTimes(1);
  });

  it('does not revive a socket that was disconnected on purpose', () => {
    const { socket } = createWatchedSocket(vi.fn());
    socket.active = false;

    send(socket);
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS);

    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('does not watch events that do not start a run', () => {
    const { socket } = createWatchedSocket(vi.fn());

    emitWithSessionGate({
      socket,
      event: 'chat_enter_room',
      payload: { conversation_uuid: 'conv-1' },
      isSessionExpired: false,
    });

    expect(socket.onAny).not.toHaveBeenCalled();
  });
});
