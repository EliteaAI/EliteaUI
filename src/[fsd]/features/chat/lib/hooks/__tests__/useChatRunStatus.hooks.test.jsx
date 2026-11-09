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
vi.mock('@/common/constants', () => ({ sioEvents: { chat_run_status: 'chat_run_status' } }));

const { default: runStatusReducer } = await import('@/[fsd]/features/chat/model/runStatus.slice');
const { default: sendFailuresReducer, actions: sendFailuresActions } =
  await import('@/[fsd]/features/chat/model/sendFailures.slice');
const { useChatRunStatusSocket, useConversationRunStatus, useMarkConversationRunSeen } =
  await import('@/[fsd]/features/chat/lib/hooks/useChatRunStatus.hooks');

const P = 7;
const makeStore = () =>
  configureStore({ reducer: { chatRunStatus: runStatusReducer, chatSendFailures: sendFailuresReducer } });

const wrapperFor = store => {
  const Wrapper = props => <Provider store={store}>{props.children}</Provider>;
  Wrapper.displayName = 'Wrapper';
  return Wrapper;
};

const frame = (status, uuid = 'A') => ({
  project_id: P,
  conversation_id: 1,
  conversation_uuid: uuid,
  message_group_uuid: 'm1',
  status,
});

describe('useChatRunStatusSocket', () => {
  let store;

  beforeEach(() => {
    store = makeStore();
    renderHook(() => useChatRunStatusSocket(), { wrapper: wrapperFor(store) });
  });

  afterEach(() => cleanup());

  it('spins while a chat runs and leaves a dot when it ends away from the screen', () => {
    const { result } = renderHook(() => useConversationRunStatus(P, { uuid: 'A' }), {
      wrapper: wrapperFor(store),
    });
    act(() => socketHandlers.chat_run_status(frame('running')));
    expect(result.current).toEqual({ isRunning: true, unread: null });
    act(() => socketHandlers.chat_run_status(frame('finished')));
    expect(result.current).toEqual({ isRunning: false, unread: 'new_response' });
  });

  it('no dot for the chat that is open', () => {
    store.dispatch(sendFailuresActions.setOpenConversation({ conversationUuid: 'A' }));
    act(() => socketHandlers.chat_run_status(frame('finished')));
    expect(store.getState().chatRunStatus.byProject[P].A.unread).toBeNull();
  });

  it('ignores a malformed frame', () => {
    act(() => socketHandlers.chat_run_status({ status: 'running' }));
    act(() => socketHandlers.chat_run_status(undefined));
    expect(store.getState().chatRunStatus.byProject).toEqual({});
  });
});

describe('useConversationRunStatus', () => {
  afterEach(() => cleanup());

  it('uses the list field until a socket frame arrives', () => {
    const { result } = renderHook(() => useConversationRunStatus(P, { uuid: 'A', has_running_task: true }), {
      wrapper: wrapperFor(makeStore()),
    });
    expect(result.current).toEqual({ isRunning: true, unread: null });
  });
});

describe('useMarkConversationRunSeen', () => {
  afterEach(() => cleanup());

  it('clears the dot of the chat once it is open', () => {
    const store = makeStore();
    renderHook(() => useChatRunStatusSocket(), { wrapper: wrapperFor(store) });
    act(() => socketHandlers.chat_run_status(frame('waiting')));
    expect(store.getState().chatRunStatus.byProject[P].A.unread).toBe('waiting');
    renderHook(() => useMarkConversationRunSeen(P, 'A'), { wrapper: wrapperFor(store) });
    expect(store.getState().chatRunStatus.byProject[P].A.unread).toBeNull();
  });
});
