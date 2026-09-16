// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook, waitFor } from '@testing-library/react';

const indexHistoryRef = vi.hoisted(() => ({ current: false }));
// Stable identity: the recovery effect lists this in its deps, so a fresh function
// per render re-runs it after every setState and spins the render loop.
const setProgressingIndexHistoryRecovered = vi.hoisted(() => () => {});

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
  useIndexHistory: () => ({
    setProgressingIndexHistoryRecovered,
    // Drives the transcript-recovery effect, which is the only way into the
    // send-gate latch below.
    needGenerateProgressingIndexHistory: indexHistoryRef.current,
  }),
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

describe('useToolkitChat — the send gate latches on liveness, not on chrome', () => {
  // `stale` is a five-minute display heuristic that also fires while a healthy run is
  // mid-promote. Latching on it there skips joining the trace room, so the live
  // transcript is missing until the next poll; `reclaimable` is the flag that means
  // the run is actually dead.
  const progressingIndex = over => ({
    metadata: { state: 'in_progress', conversation_id: 'conv-1' },
    ...over,
  });

  const renderRecovery = index => {
    indexHistoryRef.current = true;
    const { result } = renderChat({ index, modes: ['testTools'] });
    return result;
  };

  afterEach(() => {
    indexHistoryRef.current = false;
  });

  it('latches for a run that is only display-stale', () => {
    const result = renderRecovery(progressingIndex({ stale: true, reclaimable: false }));

    expect(result.current.isRunning).toBe(true);
  });

  it('does not latch for a run that is genuinely reclaimable', () => {
    // Latching here would make the recovery Reindex a silent no-op.
    const result = renderRecovery(progressingIndex({ stale: true, reclaimable: true }));

    expect(result.current.isRunning).toBe(false);
  });

  it('latches for a healthy run', () => {
    const result = renderRecovery(progressingIndex({ stale: false, reclaimable: false }));

    expect(result.current.isRunning).toBe(true);
  });

  it('falls back to stale when the backend sends no control flag', () => {
    const result = renderRecovery(progressingIndex({ stale: true }));

    expect(result.current.isRunning).toBe(false);
  });
});
