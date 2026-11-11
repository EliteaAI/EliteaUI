// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

const shared = vi.hoisted(() => ({ handlers: {}, getConversationDetail: null }));

vi.mock('@/[fsd]/features/auth/lib/hooks', () => ({
  useSocket: (event, handler) => {
    shared.handlers[event] = handler;
  },
}));
vi.mock('@/[fsd]/features/chat/api/chatApi', () => ({
  useLazyConversationDetailsQuery: () => [shared.getConversationDetail],
}));
vi.mock('@/common/constants', () => ({
  DefaultConversationName: 'New Chat',
  SocketMessageType: {
    AgentResponse: 'agent_response',
    AgentException: 'agent_exception',
    Error: 'error',
    LlmError: 'llm_error',
  },
  sioEvents: { chat_predict: 'chat_predict' },
}));

const { useCreatedAwayConversationName } =
  await import('@/[fsd]/features/chat/lib/hooks/useCreatedAwayConversationName.hooks');

// stream_id is the backend's task id, so it never matches the chat
const frame = (type, questionId = 'q1') =>
  act(async () => shared.handlers.chat_predict({ type, question_id: questionId, stream_id: 'task-1' }));

const setup = () => {
  const onNameResolved = vi.fn();
  const { result } = renderHook(() => useCreatedAwayConversationName({ projectId: 2, onNameResolved }));
  return { onNameResolved, watch: result.current.watchConversationName };
};

describe('useCreatedAwayConversationName', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    shared.handlers = {};
    shared.getConversationDetail = vi.fn(async () => ({ data: { name: 'Lighthouses' } }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('fetches the generated name once the run of a watched chat ends', async () => {
    const { onNameResolved, watch } = setup();
    watch({ id: 42, uuid: 'uuid-1', questionId: 'q1' });

    await frame('agent_llm_chunk');
    expect(shared.getConversationDetail).not.toHaveBeenCalled();

    await frame('agent_response');

    expect(shared.getConversationDetail).toHaveBeenCalledWith({ projectId: 2, id: 42, messages_limit: 1 });
    expect(onNameResolved).toHaveBeenCalledWith({
      conversation_id: 42,
      conversation_uuid: 'uuid-1',
      name: 'Lighthouses',
    });
  });

  it('ignores runs of chats it does not watch', async () => {
    const { onNameResolved, watch } = setup();
    watch({ id: 42, uuid: 'uuid-1', questionId: 'q1' });

    await frame('agent_response', 'q-other');

    expect(shared.getConversationDetail).not.toHaveBeenCalled();
    expect(onNameResolved).not.toHaveBeenCalled();
  });

  it('retries while the name is still the default, then reports what it has', async () => {
    shared.getConversationDetail = vi.fn(async () => ({ data: { name: 'New Chat' } }));
    const { onNameResolved, watch } = setup();
    watch({ id: 42, uuid: 'uuid-1', questionId: 'q1' });

    await frame('error');
    expect(onNameResolved).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    await act(async () => vi.advanceTimersByTimeAsync(3000));

    expect(shared.getConversationDetail).toHaveBeenCalledTimes(3);
    expect(onNameResolved).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Chat' }));
  });

  it('resolves a chat only once', async () => {
    const { onNameResolved, watch } = setup();
    watch({ id: 42, uuid: 'uuid-1', questionId: 'q1' });

    await frame('agent_response');
    await frame('agent_response');

    expect(onNameResolved).toHaveBeenCalledTimes(1);
  });
});
