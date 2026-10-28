import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const openAuthPopup = vi.fn();

vi.mock('../authPopup.helpers', () => ({
  openAuthPopup: (...args) => openAuthPopup(...args),
}));

const { SessionConstants } = await import('@/[fsd]/features/auth/lib/constants');
const { emitWithSessionGate } = await import('../socketSessionGate.helpers');

const {
  SESSION_EXPIRED_MESSAGE,
  SEND_NO_RESPONSE_MESSAGE,
  SEND_RESPONSE_TIMEOUT_MS,
  SEND_RESPONSE_GIVE_UP_MS,
} = SessionConstants;

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
  const createWatchedSocket = (errorListener, { connected = false } = {}) => {
    const anyListeners = new Set();
    const socket = {
      active: true,
      connected,
      sendBuffer: [],
      io: { engine: { _hasPingExpired: () => false } },
      // like socket.io: an emit that cannot be delivered waits in the send buffer
      emit: vi.fn((event, payload) => {
        if (!socket.connected) socket.sendBuffer?.push({ data: [event, payload] });
        return socket;
      }),
      listeners: vi.fn(() => [errorListener]),
      onAny: vi.fn(listener => anyListeners.add(listener)),
      offAny: vi.fn(listener => anyListeners.delete(listener)),
      connect: vi.fn(),
    };
    socket.disconnect = vi.fn(() => socket);
    return { socket, receive: (event, frame) => anyListeners.forEach(listener => listener(event, frame)) };
  };

  const send = (socket, payload = { question_id: 'q1', conversation_uuid: 'conv-1' }) =>
    emitWithSessionGate({ socket, event: 'chat_predict', payload, isSessionExpired: false });

  const expectedFailure = {
    event: 'chat_predict',
    type: 'error',
    content: SEND_NO_RESPONSE_MESSAGE,
    stream_id: 'conv-1',
    message_id: 'q1',
    code: 'send_no_response',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('settles the placeholder and re-handshakes at once when the socket has lost its connection', () => {
    const errorListener = vi.fn();
    const { socket } = createWatchedSocket(errorListener, { connected: false });

    send(socket);
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS);

    expect(errorListener).toHaveBeenCalledWith(expectedFailure);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    expect(socket.offAny).toHaveBeenCalledTimes(1);
  });

  it('keeps waiting on a healthy socket, because a slow start is not a failure', () => {
    const errorListener = vi.fn();
    const { socket } = createWatchedSocket(errorListener, { connected: true });

    send(socket);
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS + 1000);

    expect(errorListener).not.toHaveBeenCalled();
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('lets a slow start finish: its first frame arriving late ends the wait without any failure', () => {
    const errorListener = vi.fn();
    const { socket, receive } = createWatchedSocket(errorListener, { connected: true });

    send(socket);
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS + 20 * 1000);
    receive('chat_predict', { type: 'start_task', stream_id: 'conv-1' });
    vi.advanceTimersByTime(SEND_RESPONSE_GIVE_UP_MS * 2);

    expect(errorListener).not.toHaveBeenCalled();
    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.offAny).toHaveBeenCalledTimes(1);
  });

  it('gives up on a healthy socket after the longer limit, so the placeholder cannot spin forever', () => {
    const errorListener = vi.fn();
    const { socket } = createWatchedSocket(errorListener, { connected: true });

    send(socket);
    vi.advanceTimersByTime(SEND_RESPONSE_GIVE_UP_MS - 1);
    expect(errorListener).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(errorListener).toHaveBeenCalledWith(expectedFailure);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('reports a socket that was healthy at first but dropped while it waited', () => {
    const errorListener = vi.fn();
    const { socket } = createWatchedSocket(errorListener, { connected: true });

    send(socket);
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS);
    socket.connected = false;
    vi.advanceTimersByTime(SEND_RESPONSE_GIVE_UP_MS - SEND_RESPONSE_TIMEOUT_MS);

    expect(errorListener).toHaveBeenCalledTimes(1);
  });

  it('treats a connected socket whose ping expired as lost', () => {
    const errorListener = vi.fn();
    const { socket } = createWatchedSocket(errorListener, { connected: true });
    socket.io.engine._hasPingExpired = () => true;

    send(socket);
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS);

    expect(errorListener).toHaveBeenCalledTimes(1);
  });

  it('drops the send it gave up on from the socket buffer, so it cannot arrive after the error', () => {
    const { socket } = createWatchedSocket(vi.fn(), { connected: false });
    const payload = { question_id: 'q1', conversation_uuid: 'conv-1' };
    const unrelated = { data: ['chat_enter_room', { conversation_uuid: 'conv-1' }] };
    const otherSend = { data: ['chat_predict', { question_id: 'q2', conversation_uuid: 'conv-1' }] };
    socket.sendBuffer.push(unrelated, otherSend);

    send(socket, payload);
    expect(socket.sendBuffer).toHaveLength(3);
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS);

    // only this send's own packet goes; other buffered packets are still delivered after the reconnect
    expect(socket.sendBuffer).toEqual([unrelated, otherSend]);
  });

  it('copes with a socket.io build that has no send buffer', () => {
    const errorListener = vi.fn();
    const { socket } = createWatchedSocket(errorListener, { connected: false });
    delete socket.sendBuffer;

    send(socket);
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS);

    expect(errorListener).toHaveBeenCalledWith(expectedFailure);
  });

  it('stops waiting once any frame for the same stream arrives', () => {
    const errorListener = vi.fn();
    const { socket, receive } = createWatchedSocket(errorListener, { connected: false });

    send(socket);
    receive('chat_predict', { type: 'start_task', stream_id: 'conv-1' });
    vi.advanceTimersByTime(SEND_RESPONSE_GIVE_UP_MS * 2);

    expect(errorListener).not.toHaveBeenCalled();
    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.offAny).toHaveBeenCalledTimes(1);
  });

  it('keeps waiting when only a frame of another stream arrives', () => {
    const errorListener = vi.fn();
    const { socket, receive } = createWatchedSocket(errorListener, { connected: false });

    send(socket);
    receive('chat_predict', { type: 'start_task', stream_id: 'conv-2' });
    vi.advanceTimersByTime(SEND_RESPONSE_TIMEOUT_MS);

    expect(errorListener).toHaveBeenCalledTimes(1);
  });

  it('does not revive a socket that was disconnected on purpose', () => {
    const { socket } = createWatchedSocket(vi.fn(), { connected: false });
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
