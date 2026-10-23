// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook, waitFor } from '@testing-library/react';

const indexHistoryRef = vi.hoisted(() => ({ current: false }));
const modelsResponseRef = vi.hoisted(() => ({ current: { items: [], total: 0 } }));
const recoveredConversationRef = vi.hoisted(() => ({ current: undefined }));
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
    conversationDetails: recoveredConversationRef.current,
    setProgressingIndexHistoryRecovered,
    // Drives the transcript-recovery effect, which is the only way into the
    // send-gate latch below.
    needGenerateProgressingIndexHistory: indexHistoryRef.current,
  }),
}));

vi.mock('@/[fsd]/features/toolkits/lib/helpers', async () => ({
  ToolkitsHelpers: { prettifyToolkitConversation: messages => messages },
  ToolkitChatHelpers: await vi.importActual('@/[fsd]/features/toolkits/lib/helpers/toolkitChat.helpers'),
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
  useListModelsQuery: () => ({ data: modelsResponseRef.current, isSuccess: true }),
  useStopIndexingItemMutation: () => [vi.fn(), { isLoading: false }],
}));

const socketHandlerRef = { current: null };
const validationErrorHandlerRef = { current: null };
const socketEmit = vi.fn();
const leaveRoomsEmit = vi.fn();

vi.mock('@/[fsd]/features/auth/lib/hooks/useSocket.hooks', () => ({
  useSocket: (event, handler) => {
    if (event === 'socket_validation_error') validationErrorHandlerRef.current = handler;
    else socketHandlerRef.current = handler;
    return { emit: socketEmit };
  },
  useManualSocket: event => ({ emit: event === 'chat_leave_rooms' ? leaveRoomsEmit : vi.fn() }),
}));

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
}));

vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 1 }));

vi.mock('@/common/convertChatConversationMessages', () => ({
  convertConversationToChatHistory: () => [],
}));

vi.mock('@/common/messagePayloadUtils', () => ({ generateMessagePayload: () => ({}) }));

const { useToolkitChat } = await import('../useToolkitChat.hooks');
const { ToolkitChatModesEnum } = await import('@/[fsd]/features/toolkits/lib/constants');

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

beforeEach(() => {
  vi.clearAllMocks();
  modelsResponseRef.current = { items: [], total: 0 };
  recoveredConversationRef.current = undefined;
});

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
    const { result } = renderChat({
      traceNewIndex,
      index: INDEX,
      initialConversation: { id: 1, uuid: 'conv-created' },
    });

    act(() => result.current.handleIndexData());
    await waitFor(() => expect(createToolkitConversationWithParticipant).toHaveBeenCalledTimes(1));

    act(() => socketHandlerRef.current({ type: 'mcp_authorization_required', stream_id: 'conv-created' }));
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

describe('useToolkitChat validation errors', () => {
  const startRun = async () => {
    createToolkitConversationWithParticipant.mockResolvedValueOnce({ id: 7, uuid: 'conv-7' });

    const view = renderChat({ traceNewIndex: vi.fn() });

    act(() => view.result.current.handleRunTool());
    await waitFor(() => expect(socketEmit).toHaveBeenCalled());
    expect(view.result.current.isRunning).toBe(true);

    return view;
  };

  it('settles the run when the server rejects it', async () => {
    const { result } = await startRun();

    act(() =>
      validationErrorHandlerRef.current({
        type: 'error',
        stream_id: 'conv-7',
        content: 'Your session has expired. Please sign in again and resend the message.',
      }),
    );

    expect(result.current.isRunning).toBe(false);
    expect(JSON.stringify(result.current.chatHistory)).toContain('Your session has expired');
  });

  it('settles the run when the rejection arrives during the emit itself', async () => {
    socketEmit.mockImplementationOnce(() => {
      validationErrorHandlerRef.current({ type: 'error', stream_id: 'conv-7', content: 'rejected on send' });
    });
    createToolkitConversationWithParticipant.mockResolvedValueOnce({ id: 7, uuid: 'conv-7' });

    const { result } = renderChat({ traceNewIndex: vi.fn() });

    act(() => result.current.handleRunTool());
    await waitFor(() => expect(socketEmit).toHaveBeenCalled());

    await waitFor(() => expect(result.current.isRunning).toBe(false));
    expect(JSON.stringify(result.current.chatHistory)).toContain('rejected on send');
  });

  it('ignores rejections of other conversations', async () => {
    const { result } = await startRun();

    act(() => validationErrorHandlerRef.current({ type: 'error', stream_id: 'other', content: 'nope' }));

    expect(result.current.isRunning).toBe(true);
  });

  it('ignores rejections once the task has started', async () => {
    const { result } = await startRun();

    act(() =>
      socketHandlerRef.current({ type: 'start_task', stream_id: 'conv-7', content: { task_id: 't1' } }),
    );
    act(() => validationErrorHandlerRef.current({ type: 'error', stream_id: 'conv-7', content: 'late' }));

    expect(JSON.stringify(result.current.chatHistory)).not.toContain('late');
  });
});

describe('useToolkitChat model preselection', () => {
  const ALPHABETICALLY_FIRST = { name: 'bedrock-luna', project_id: 1, default: false };
  const PROJECT_DEFAULT = { name: 'sonnet', project_id: 1, default: true };
  const PROJECT_LOW_TIER = { name: 'haiku', project_id: 1, default: false };
  const INDEX = { id: 5, metadata: { collection: 'docs', index_configuration: { index_name: 'docs' } } };

  beforeEach(() => {
    modelsResponseRef.current = {
      items: [ALPHABETICALLY_FIRST, PROJECT_DEFAULT, PROJECT_LOW_TIER],
      total: 3,
      low_tier_default_model_name: 'haiku',
      low_tier_default_model_project_id: 1,
    };
  });

  it('preselects the project Low-tier model for an index run', () => {
    const { result } = renderChat({ modes: [], index: INDEX, runTool: 'index_data' });

    expect(result.current.selectedModel).toBe(PROJECT_LOW_TIER);
  });

  it('preselects the project Low-tier model when creating an index', () => {
    const { result } = renderChat({ modes: [ToolkitChatModesEnum.createIndex], runTool: 'index_data' });

    expect(result.current.selectedModel).toBe(PROJECT_LOW_TIER);
  });

  it('preselects the project Low-tier model for a search against an index', () => {
    const { result } = renderChat({ modes: [ToolkitChatModesEnum.testTools], index: INDEX });

    expect(result.current.selectedModel).toBe(PROJECT_LOW_TIER);
  });

  it('keeps the project Default for the toolkit Test panel', () => {
    const { result } = renderChat({ modes: [ToolkitChatModesEnum.testTools] });

    expect(result.current.selectedModel).toBe(PROJECT_DEFAULT);
  });

  it('falls back to the project Default for an index run when no Low-tier model is set', () => {
    modelsResponseRef.current = {
      ...modelsResponseRef.current,
      low_tier_default_model_name: '',
      low_tier_default_model_project_id: '',
    };

    const { result } = renderChat({ modes: [], index: INDEX, runTool: 'index_data' });

    expect(result.current.selectedModel).toBe(PROJECT_DEFAULT);
  });
});

describe('useToolkitChat only follows the runs it owns', () => {
  const COMPLETED_INDEX = { id: 5, metadata: { collection: 'docs', state: 'success' } };
  const progressLine = streamId => ({
    type: 'chunk',
    stream_id: streamId,
    message_id: `${streamId}-message`,
    content: `Indexed document from ${streamId}`,
    response_metadata: {},
  });

  const startRun = async over => {
    createToolkitConversationWithParticipant.mockResolvedValueOnce({ id: 7, uuid: 'own-run' });
    const view = renderChat(over);

    act(() => view.result.current.handleRunTool());
    await waitFor(() => expect(socketEmit).toHaveBeenCalled());

    return view;
  };

  it('ignores progress of another index run', () => {
    const { result } = renderChat({ index: COMPLETED_INDEX, modes: [] });
    const before = result.current.chatHistory;

    act(() => socketHandlerRef.current(progressLine('other-index-run')));

    expect(result.current.chatHistory).toEqual(before);
  });

  it('does not adopt the task of another index run', () => {
    const traceNewIndex = vi.fn();
    const { result } = renderChat({ index: COMPLETED_INDEX, modes: [], traceNewIndex });

    act(() =>
      socketHandlerRef.current({
        type: 'start_task',
        stream_id: 'other-index-run',
        content: { task_id: 'b' },
      }),
    );

    expect(result.current.canStopIndexing).toBe(false);
    expect(traceNewIndex).not.toHaveBeenCalled();
  });

  it('shows progress of the run it started', async () => {
    const { result } = await startRun();

    act(() => socketHandlerRef.current(progressLine('own-run')));

    expect(JSON.stringify(result.current.chatHistory)).toContain('Indexed document from own-run');
  });

  it('shows progress of the run handed over by the create form', () => {
    const { result } = renderChat({ initialConversation: { id: 3, uuid: 'created-run' }, modes: [] });

    act(() => socketHandlerRef.current(progressLine('created-run')));

    expect(JSON.stringify(result.current.chatHistory)).toContain('Indexed document from created-run');
  });

  it('shows progress of the in-progress run it recovered', () => {
    recoveredConversationRef.current = { id: 4, uuid: 'recovered-run' };
    const { result } = renderChat({ index: COMPLETED_INDEX, modes: [] });

    act(() => socketHandlerRef.current(progressLine('recovered-run')));

    expect(JSON.stringify(result.current.chatHistory)).toContain('Indexed document from recovered-run');
  });

  it('leaves the rooms of its runs when it unmounts', async () => {
    const { unmount } = await startRun({ initialConversation: { id: 3, uuid: 'created-run' } });

    leaveRoomsEmit.mockClear();
    unmount();

    expect(leaveRoomsEmit).toHaveBeenCalledWith([
      { conversation_uuid: 'created-run' },
      { conversation_uuid: 'own-run' },
    ]);
  });

  it('leaves no room when it never followed a run', () => {
    const { unmount } = renderChat({ index: COMPLETED_INDEX, modes: [] });

    unmount();

    expect(leaveRoomsEmit).not.toHaveBeenCalled();
  });
});
