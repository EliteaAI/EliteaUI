// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

let errorHandler = null;

vi.mock('@/[fsd]/features/auth/lib/hooks', () => ({
  useSocket: (_event, handler) => {
    errorHandler = handler;
    return { emit: vi.fn() };
  },
}));

const { useRejectedSendRecovery } = await import('../useRejectedSendRecovery.hooks');

const createInput = (content = '') => ({
  getInputContent: vi.fn(() => content),
  setValue: vi.fn(),
  focus: vi.fn(),
});

const setup = input => {
  const toastError = vi.fn();
  const chatInput = { current: input };
  const activeConversationRef = { current: { uuid: 'conv-a' } };
  const { result } = renderHook(() =>
    useRejectedSendRecovery({ chatInput, toastError, activeConversationRef }),
  );
  const rememberSend = (questionId, text, conversationUuid = 'conv-a') =>
    result.current.rememberSend(questionId, text, conversationUuid);
  return { toastError, rememberSend, activeConversationRef };
};

describe('useRejectedSendRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('shows the error and puts the text back after the server rejects an unauthenticated socket', () => {
    const input = createInput();
    const { toastError, rememberSend } = setup(input);
    rememberSend('q1', 'hello there');

    act(() => errorHandler({ code: 'socket_unauthenticated', message_id: 'q1', content: 'Not authorized' }));

    expect(toastError).toHaveBeenCalledWith('Not authorized');
    expect(input.setValue).toHaveBeenCalledWith('hello there');
    expect(input.focus).toHaveBeenCalledTimes(1);
  });

  it('does the same when the send got no response at all', () => {
    const input = createInput();
    const { toastError, rememberSend } = setup(input);
    rememberSend('q1', 'hello there');

    act(() => errorHandler({ code: 'send_no_response', message_id: 'q1', content: 'No response' }));

    expect(toastError).toHaveBeenCalledWith('No response');
    expect(input.setValue).toHaveBeenCalledWith('hello there');
  });

  it('does not overwrite what the user has typed in the meantime', () => {
    const input = createInput('a new draft');
    const { toastError, rememberSend } = setup(input);
    rememberSend('q1', 'hello there');

    act(() => errorHandler({ code: 'socket_unauthenticated', message_id: 'q1', content: 'Not authorized' }));

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(input.setValue).not.toHaveBeenCalled();
  });

  it('leaves other validation errors to the existing handlers', () => {
    const input = createInput();
    const { toastError, rememberSend } = setup(input);
    rememberSend('q1', 'hello there');

    act(() => errorHandler({ message_id: 'q1', content: 'This message has already been submitted' }));

    expect(toastError).not.toHaveBeenCalled();
    expect(input.setValue).not.toHaveBeenCalled();
  });

  it('ignores a failure of a send that another chat instance made', () => {
    const input = createInput();
    const { toastError } = setup(input);

    act(() =>
      errorHandler({ code: 'socket_unauthenticated', message_id: 'other', content: 'Not authorized' }),
    );

    // Every mounted chat listens on the shared socket; only the one that sent it may react
    expect(toastError).not.toHaveBeenCalled();
    expect(input.setValue).not.toHaveBeenCalled();
    expect(input.focus).not.toHaveBeenCalled();
  });

  it('puts the text back without taking focus when the send got no response', () => {
    const input = createInput();
    const { rememberSend } = setup(input);
    rememberSend('q1', 'hello there');

    act(() => errorHandler({ code: 'send_no_response', message_id: 'q1', content: 'No response' }));

    // The message might still arrive, so the user is not nudged to resend
    expect(input.setValue).toHaveBeenCalledWith('hello there');
    expect(input.focus).not.toHaveBeenCalled();
  });

  it('does not put the text into another conversation the user switched to', () => {
    const input = createInput();
    const { toastError, rememberSend, activeConversationRef } = setup(input);
    rememberSend('q1', 'hello there', 'conv-a');
    activeConversationRef.current = { uuid: 'conv-b' };

    act(() => errorHandler({ code: 'send_no_response', message_id: 'q1', content: 'No response' }));

    // the user still hears about it, because this instance did send the message
    expect(toastError).toHaveBeenCalledWith('No response');
    expect(input.setValue).not.toHaveBeenCalled();
    expect(input.focus).not.toHaveBeenCalled();
  });

  it('does not restore into a conversation that was left and is no longer open', () => {
    const input = createInput();
    const { rememberSend, activeConversationRef } = setup(input);
    rememberSend('q1', 'hello there', 'conv-a');
    activeConversationRef.current = null;

    act(() => errorHandler({ code: 'socket_unauthenticated', message_id: 'q1', content: 'x' }));

    expect(input.setValue).not.toHaveBeenCalled();
  });

  it('still restores when the send created the conversation that is now on screen', () => {
    const input = createInput();
    const { rememberSend, activeConversationRef } = setup(input);
    rememberSend('q1', 'first message', 'new-conv');
    activeConversationRef.current = { uuid: 'new-conv' };

    act(() => errorHandler({ code: 'socket_unauthenticated', message_id: 'q1', content: 'x' }));

    expect(input.setValue).toHaveBeenCalledWith('first message');
  });

  it('restores a rejected text only once', () => {
    const input = createInput();
    const { rememberSend } = setup(input);
    rememberSend('q1', 'hello there');

    act(() => errorHandler({ code: 'socket_unauthenticated', message_id: 'q1', content: 'x' }));
    act(() => errorHandler({ code: 'socket_unauthenticated', message_id: 'q1', content: 'x' }));

    expect(input.setValue).toHaveBeenCalledTimes(1);
  });

  it('keeps only the most recent sends', () => {
    const input = createInput();
    const { rememberSend } = setup(input);
    for (let i = 0; i < 12; i += 1) rememberSend(`q${i}`, `text ${i}`);

    act(() => errorHandler({ code: 'socket_unauthenticated', message_id: 'q0', content: 'x' }));
    expect(input.setValue).not.toHaveBeenCalled();

    act(() => errorHandler({ code: 'socket_unauthenticated', message_id: 'q11', content: 'x' }));
    expect(input.setValue).toHaveBeenCalledWith('text 11');
  });
});
