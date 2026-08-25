// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook, waitFor } from '@testing-library/react';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const createToolkitConversationWithParticipant = vi.fn();

vi.mock('@/[fsd]/features/toolkits/lib/helpers/toolkitConversation.helpers', () => ({
  createToolkitConversationWithParticipant,
  findToolkitParticipant: () => null,
}));

vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({
  useIndexHistory: () => ({ setProgressingIndexHistoryRecovered: vi.fn() }),
}));

vi.mock('@/[fsd]/features/toolkits/lib/helpers', () => ({
  ToolkitsHelpers: { prettifyToolkitConversation: messages => messages },
}));

vi.mock('@/[fsd]/shared/lib/context', () => ({
  useToolkitSocketContext: () => ({ isAuthCheckSession: false }),
}));

vi.mock('@/[fsd]/shared/config/store', () => ({
  default: { getState: () => ({}), dispatch: vi.fn(), subscribe: () => () => {} },
}));

vi.mock('@/api', () => ({
  useAddParticipantIntoConversationMutation: () => [vi.fn()],
  useConversationCreateMutation: () => [vi.fn()],
  useListModelsQuery: () => ({ data: { items: [], total: 0 }, isSuccess: true }),
  useStopIndexingItemMutation: () => [vi.fn(), { isLoading: false }],
}));

const socketHandlerRef = { current: null };

vi.mock('@/hooks/useSocket', () => ({
  default: (_event, handler) => {
    socketHandlerRef.current = handler;
    return { emit: vi.fn() };
  },
  useManualSocket: () => ({ emit: vi.fn() }),
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 1 }));

vi.mock('@/common/convertChatConversationMessages', () => ({
  convertConversationToChatHistory: () => [],
}));

vi.mock('@/common/messagePayloadUtils', () => ({ generateMessagePayload: () => ({}) }));

const { useToolkitChat } = await import('../useToolkitChat.hooks');

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const renderChat = (over = {}) =>
  renderHook(() =>
    useToolkitChat({
      toolkitId: '1',
      runTool: 'search_index',
      isValidForm: true,
      toolInputVariables: { query: 'a' },
      values: { type: 'artifact', settings: {} },
      modes: ['testTools'],
      ...over,
    }),
  );

beforeEach(() => vi.clearAllMocks());

describe('useToolkitChat conversation ownership', () => {
  it('abandons a conversation whose creation outlived the tool it was started for', async () => {
    const pending = deferred();
    createToolkitConversationWithParticipant.mockReturnValueOnce(pending.promise);

    const { result } = renderChat();

    act(() => result.current.handleRunTool());
    await waitFor(() => expect(createToolkitConversationWithParticipant).toHaveBeenCalled());

    act(() => result.current.handleClearActiveConversation());

    await act(async () => {
      pending.resolve({ id: 7, uuid: 'stale' });
      await pending.promise;
    });

    expect(result.current.activeConversation).toBeNull();
  });

  it('keeps a conversation nothing cleared while it was being created', async () => {
    const pending = deferred();
    createToolkitConversationWithParticipant.mockReturnValueOnce(pending.promise);

    const { result } = renderChat();

    act(() => result.current.handleRunTool());
    await waitFor(() => expect(createToolkitConversationWithParticipant).toHaveBeenCalled());

    await act(async () => {
      pending.resolve({ id: 7, uuid: 'live' });
      await pending.promise;
    });

    expect(result.current.activeConversation).toEqual({ id: 7, uuid: 'live' });
  });
});

describe('useToolkitChat run ownership', () => {
  const INDEX = { id: 5, metadata: { collection: 'docs', index_configuration: { index_name: 'docs' } } };

  const startIndexRunAbandonedByAuthRetry = async () => {
    const abandoned = deferred();
    createToolkitConversationWithParticipant
      .mockReturnValueOnce(abandoned.promise)
      .mockReturnValueOnce(deferred().promise);

    const traceNewIndex = vi.fn();
    const { result } = renderChat({ traceNewIndex, index: INDEX });

    act(() => result.current.handleIndexData());
    await waitFor(() => expect(createToolkitConversationWithParticipant).toHaveBeenCalledTimes(1));

    act(() => socketHandlerRef.current({ type: 'mcp_authorization_required' }));
    expect(result.current.isRunning).toBe(false);

    act(() => result.current.handleIndexData());
    await waitFor(() => expect(createToolkitConversationWithParticipant).toHaveBeenCalledTimes(2));
    expect(result.current.isRunning).toBe(true);

    traceNewIndex.mockClear();

    const settle = async () => {
      await act(async () => {
        abandoned.reject(new Error('gone'));
        await abandoned.promise.catch(() => {});
      });
    };

    return { result, traceNewIndex, settle };
  };

  it('leaves a newer run alone when an abandoned run finally fails', async () => {
    const { result, settle } = await startIndexRunAbandonedByAuthRetry();

    await settle();

    expect(result.current.isRunning).toBe(true);
  });

  it('does not stamp the index failed while a newer run owns it', async () => {
    const { traceNewIndex, settle } = await startIndexRunAbandonedByAuthRetry();

    await settle();

    expect(traceNewIndex).not.toHaveBeenCalled();
  });

  it('does not report the abandoned failure in the newer run transcript', async () => {
    const { result, settle } = await startIndexRunAbandonedByAuthRetry();
    const before = result.current.chatHistory.length;

    await settle();

    expect(result.current.chatHistory).toHaveLength(before);
  });
});
