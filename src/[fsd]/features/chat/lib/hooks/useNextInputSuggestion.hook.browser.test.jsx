import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sioEvents, SocketMessageType } from '@/common/constants';

import { useNextInputSuggestion } from './useNextInputSuggestion.hook';

const socketHandlers = vi.hoisted(() => new Map());

vi.mock('@/hooks/useSocket', () => ({
  default: (eventName, handler) => socketHandlers.set(eventName, handler),
}));

describe('useNextInputSuggestion', () => {
  let container;
  let root;
  let props;
  let result;

  const Harness = () => {
    result = useNextInputSuggestion(props);
    return null;
  };

  const renderHook = async nextProps => {
    props = nextProps;
    await act(async () => root.render(<Harness />));
  };

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    socketHandlers.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('uses the same event type for durable SSE projection and Socket.IO delivery', () => {
    expect(SocketMessageType.NextInputSuggestionReady).toBe(sioEvents.next_input_suggestion_ready);
  });

  it('buffers a first-turn SSE suggestion until its assistant message reaches history', async () => {
    const chatHistoryRef = { current: [{ id: 'question-1' }] };
    const getInputContent = vi.fn(() => '');
    await renderHook({
      chatHistory: chatHistoryRef.current,
      chatHistoryRef,
      conversationUuid: 'conversation-1',
      getInputContent,
    });

    await act(async () =>
      socketHandlers.get(sioEvents.next_input_suggestion_ready)?.({
        stream_id: 'execution-1',
        message_id: 'answer-1',
        suggestion: 'Show a deployment example',
      }),
    );
    expect(result.suggestion).toBeNull();

    chatHistoryRef.current = [...chatHistoryRef.current, { id: 'answer-1' }];
    await renderHook({
      chatHistory: chatHistoryRef.current,
      chatHistoryRef,
      conversationUuid: 'conversation-1',
      getInputContent,
    });

    expect(result.suggestion).toBe('Show a deployment example');
  });

  it('preserves a first-turn hint when New Chat adopts the matching durable conversation UUID', async () => {
    const chatHistoryRef = { current: [{ id: 'question-1' }] };
    const getInputContent = vi.fn(() => '');
    await renderHook({
      chatHistory: chatHistoryRef.current,
      chatHistoryRef,
      conversationUuid: undefined,
      getInputContent,
    });

    await act(async () =>
      socketHandlers.get(sioEvents.next_input_suggestion_ready)?.({
        stream_id: 'conversation-1',
        message_id: 'answer-1',
        suggestion: 'Show a retry example',
      }),
    );
    expect(result.suggestion).toBeNull();

    chatHistoryRef.current = [...chatHistoryRef.current, { id: 'answer-1' }];
    await renderHook({
      chatHistory: chatHistoryRef.current,
      chatHistoryRef,
      conversationUuid: 'conversation-1',
      getInputContent,
    });

    expect(result.suggestion).toBe('Show a retry example');
  });

  it('shows the first-turn hint after hydration replaces the local assistant message identity', async () => {
    const chatHistoryRef = { current: [{ id: 'hydrated-answer-id' }] };
    const getInputContent = vi.fn(() => '');
    await renderHook({
      chatHistory: chatHistoryRef.current,
      chatHistoryRef,
      conversationUuid: 'conversation-1',
      getInputContent,
    });

    await act(async () =>
      socketHandlers.get(sioEvents.next_input_suggestion_ready)?.({
        stream_id: 'conversation-1',
        message_id: 'pre-hydration-answer-id',
        suggestion: 'Show a production example',
      }),
    );

    expect(result.suggestion).toBe('Show a production example');
  });

  it('does not use the conversation fallback for a different chat', async () => {
    const chatHistoryRef = { current: [{ id: 'hydrated-answer-id' }] };
    const getInputContent = vi.fn(() => '');
    await renderHook({
      chatHistory: chatHistoryRef.current,
      chatHistoryRef,
      conversationUuid: 'conversation-1',
      getInputContent,
    });

    await act(async () =>
      socketHandlers.get(sioEvents.next_input_suggestion_ready)?.({
        stream_id: 'conversation-2',
        message_id: 'different-answer-id',
        suggestion: 'Stale suggestion',
      }),
    );

    expect(result.suggestion).toBeNull();
  });

  it('clears a buffered suggestion when the conversation changes', async () => {
    const chatHistoryRef = { current: [{ id: 'question-1' }] };
    const getInputContent = vi.fn(() => '');
    await renderHook({
      chatHistory: chatHistoryRef.current,
      chatHistoryRef,
      conversationUuid: 'conversation-1',
      getInputContent,
    });

    await act(async () =>
      socketHandlers.get(sioEvents.next_input_suggestion_ready)?.({
        message_id: 'answer-1',
        suggestion: 'Stale suggestion',
      }),
    );
    await renderHook({
      chatHistory: [{ id: 'answer-1' }],
      chatHistoryRef: { current: [{ id: 'answer-1' }] },
      conversationUuid: 'conversation-2',
      getInputContent,
    });

    expect(result.suggestion).toBeNull();
  });
});
