// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, renderHook } from '@testing-library/react';

const socketHandlers = vi.hoisted(() => ({}));

vi.mock('@/[fsd]/shared/config/reducerRegistry', () => ({ registerReducer: vi.fn() }));
vi.mock('@/[fsd]/features/auth/lib/hooks', () => ({
  useSocket: (event, handler) => {
    socketHandlers[event] = handler;
    return { emit: vi.fn() };
  },
}));
vi.mock('@/[fsd]/features/auth/lib/constants', () => ({
  SessionConstants: { SEND_NO_RESPONSE_CODE: 'send_no_response' },
}));
vi.mock('@/common/constants', () => ({
  ROLES: { User: 'user', Assistant: 'assistant' },
  sioEvents: { chat_predict: 'chat_predict', socket_validation_error: 'socket_validation_error' },
}));
vi.mock('@/common/utils', () => ({ convertJsonToString: value => (value ? String(value) : '') }));

const { default: sendFailuresReducer, actions } =
  await import('@/[fsd]/features/chat/model/sendFailures.slice');
const { useApplyChatSendFailures, useChatSendOutcomeTracker } =
  await import('@/[fsd]/features/chat/lib/hooks/useChatSendFailures.hooks');

const makeStore = () => configureStore({ reducer: { chatSendFailures: sendFailuresReducer } });

const wrapperFor = store => {
  const Wrapper = props => <Provider store={store}>{props.children}</Provider>;
  Wrapper.displayName = 'Wrapper';
  return Wrapper;
};

const failuresOf = (store, uuid) => store.getState().chatSendFailures.failuresByConversation[uuid];

describe('useChatSendOutcomeTracker', () => {
  let store;

  beforeEach(() => {
    store = makeStore();
    renderHook(() => useChatSendOutcomeTracker(), { wrapper: wrapperFor(store) });
    store.dispatch(actions.trackSend({ questionId: 'q1', conversationUuid: 'A', question: 'hi' }));
  });

  afterEach(() => cleanup());

  it('keeps a refusal for a chat the user has left', () => {
    store.dispatch(actions.setOpenConversation({ conversationUuid: 'B' }));
    act(() => socketHandlers.socket_validation_error({ message_id: 'q1', content: 'busy' }));

    expect(failuresOf(store, 'A').q1).toEqual(expect.objectContaining({ error: 'busy', question: 'hi' }));
  });

  it('leaves a refusal of the open chat to that chat', () => {
    store.dispatch(actions.setOpenConversation({ conversationUuid: 'A' }));
    act(() => socketHandlers.socket_validation_error({ message_id: 'q1', content: 'busy' }));

    expect(failuresOf(store, 'A')).toBeUndefined();
    expect(store.getState().chatSendFailures.pendingSends.q1).toBeUndefined();
  });

  it('does not treat a missing answer from a room the user left as a failure', () => {
    store.dispatch(actions.setOpenConversation({ conversationUuid: 'B' }));
    act(() =>
      socketHandlers.socket_validation_error({
        message_id: 'q1',
        content: 'no answer',
        code: 'send_no_response',
      }),
    );

    expect(failuresOf(store, 'A')).toBeUndefined();
  });

  it('settles a send once the run has started', () => {
    act(() => socketHandlers.chat_predict({ type: 'start_task', content: { question_id: 'q1' } }));
    expect(store.getState().chatSendFailures.pendingSends.q1).toBeUndefined();
  });

  it('ignores frames of sends it does not track', () => {
    act(() => socketHandlers.socket_validation_error({ message_id: 'other', content: 'busy' }));
    expect(store.getState().chatSendFailures.failuresByConversation).toEqual({});
  });
});

describe('useApplyChatSendFailures', () => {
  afterEach(() => cleanup());

  it('shows a kept failure once the chat is loaded, then clears it', () => {
    const store = makeStore();
    store.dispatch(actions.recordFailure({ questionId: 'q1', conversationUuid: 'A', error: 'busy' }));
    let history = [{ id: 'q1', role: 'user' }];
    const chatHistory = history;
    const setChatHistory = vi.fn(update => {
      history = update(history);
    });

    const { rerender } = renderHook(props => useApplyChatSendFailures(props), {
      wrapper: wrapperFor(store),
      initialProps: { conversationUuid: 'A', isLoaded: false, chatHistory, setChatHistory },
    });
    expect(setChatHistory).not.toHaveBeenCalled();
    expect(store.getState().chatSendFailures.openConversationUuid).toBeNull();

    rerender({ conversationUuid: 'A', isLoaded: true, chatHistory, setChatHistory });

    expect(history[1]).toEqual(expect.objectContaining({ question_id: 'q1', exception: 'busy' }));
    expect(failuresOf(store, 'A')).toBeUndefined();
    expect(store.getState().chatSendFailures.openConversationUuid).toBe('A');
  });

  it('keeps a failure it cannot place yet', () => {
    const store = makeStore();
    store.dispatch(actions.recordFailure({ questionId: 'q1', conversationUuid: 'A', error: 'busy' }));
    const setChatHistory = vi.fn();

    renderHook(
      () =>
        useApplyChatSendFailures({ conversationUuid: 'A', isLoaded: true, chatHistory: [], setChatHistory }),
      { wrapper: wrapperFor(store) },
    );

    expect(setChatHistory).not.toHaveBeenCalled();
    expect(failuresOf(store, 'A').q1).toBeDefined();
  });

  it('does not touch another chat', () => {
    const store = makeStore();
    store.dispatch(actions.recordFailure({ questionId: 'q1', conversationUuid: 'A', error: 'busy' }));
    const setChatHistory = vi.fn();

    renderHook(() => useApplyChatSendFailures({ conversationUuid: 'B', isLoaded: true, setChatHistory }), {
      wrapper: wrapperFor(store),
    });

    expect(setChatHistory).not.toHaveBeenCalled();
    expect(failuresOf(store, 'A').q1).toBeDefined();
  });
});
