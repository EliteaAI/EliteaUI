import { beforeEach, describe, expect, it, vi } from 'vitest';

const openAuthPopup = vi.fn();

vi.mock('../authPopup.helpers', () => ({
  openAuthPopup: (...args) => openAuthPopup(...args),
}));

const { SessionConstants } = await import('@/[fsd]/features/auth/lib/constants');
const { emitWithSessionGate } = await import('../socketSessionGate.helpers');

const { SESSION_EXPIRED_MESSAGE } = SessionConstants;

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
