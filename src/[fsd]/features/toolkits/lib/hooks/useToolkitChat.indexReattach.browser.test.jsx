import { act } from 'react';

import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTIVE_INDEX_CONFLICT_MESSAGE } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexExecution.helpers';

import { useToolkitChat } from './useToolkitChat.hooks';

const mocks = vi.hoisted(() => ({
  addParticipant: vi.fn(),
  convertConversationToChatHistory: vi.fn(),
  createConversation: vi.fn(),
  createToolkitConversation: vi.fn(),
  generateChatMessage: vi.fn(),
  history: vi.fn(),
  onActiveIndexReattach: vi.fn(),
  refetchIndexesList: vi.fn(),
  startIndexData: vi.fn(),
  stopIndex: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  traceNewIndex: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'recovery-placeholder'),
}));

vi.mock('@/[fsd]/app/providers', () => ({
  useToolkitSocketContext: () => ({ isAuthCheckSession: false }),
}));

vi.mock('@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers', () => ({
  generateChatMessageBasedOnResponse: args => mocks.generateChatMessage(args),
  generateIndexDataPayload: args => args,
  generateMockMessageTemplate: (content, participant_id) => ({ content, participant_id }),
  generateWelcomeMessage: () => ({ id: 'welcome', content: 'Welcome' }),
}));

vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({
  useIndexHistory: options => mocks.history(options),
}));

vi.mock('@/[fsd]/features/toolkits/lib/helpers', () => ({
  ToolkitsHelpers: {
    prettifyToolkitConversation: messages => messages,
  },
}));

vi.mock('@/[fsd]/features/toolkits/lib/helpers/toolkitConversation.helpers', () => ({
  createToolkitConversationWithParticipant: args => mocks.createToolkitConversation(args),
  findToolkitParticipant: () => ({ id: 9 }),
}));

vi.mock('@/[fsd]/shared/lib/utils/llmSettings.utils', () => ({
  generateLLMSettings: () => ({}),
  resetLLMSettingsForModel: () => ({}),
}));

vi.mock('@/api', () => ({
  useAddParticipantIntoConversationMutation: () => [mocks.addParticipant],
  useConversationCreateMutation: () => [mocks.createConversation],
  useListModelsQuery: () => ({ data: { items: [], total: 0 }, isSuccess: true }),
  useStartIndexDataMutation: () => [mocks.startIndexData],
  useStopIndexingItemMutation: () => [mocks.stopIndex, { isLoading: false }],
}));

vi.mock('@/common/convertChatConversationMessages', () => ({
  convertConversationToChatHistory: (...args) => mocks.convertConversationToChatHistory(...args),
}));

vi.mock('@/common/messagePayloadUtils', () => ({
  generateMessagePayload: args => args,
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 7,
}));

vi.mock('@/hooks/useSocket', () => ({
  default: () => ({ emit: vi.fn() }),
  useManualSocket: () => ({ emit: vi.fn() }),
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({
    toastError: mocks.toastError,
    toastSuccess: mocks.toastSuccess,
  }),
}));

class FakeEventSource {
  static instances = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = new Map();
    this.closed = false;
    this.readyState = FakeEventSource.OPEN;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    this.listeners.set(type, [...listeners, listener]);
  }

  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }

  emit(type, data) {
    for (const listener of this.listeners.get(type) || []) listener({ type, data: JSON.stringify(data) });
  }

  reject(readyState, status) {
    this.readyState = readyState;
    const event = { type: 'error', status };
    this.onerror?.(event);
    for (const listener of this.listeners.get('error') || []) listener(event);
  }
}

const baseIndex = {
  id: 41,
  metadata: {
    collection: 'docs',
    index_configuration: { index_name: 'docs' },
    state: 'completed',
  },
};

const activeIndexFor = (taskId, metadata = {}) => ({
  id: 42,
  metadata: {
    collection: 'docs',
    index_configuration: { index_name: 'docs' },
    state: 'in_progress',
    task_id: taskId,
    conversation_id: 88,
    index_generation: 16,
    ...metadata,
  },
});

const baseProps = {
  toolkitId: 11,
  runTool: 'search',
  isValidForm: true,
  toolInputVariables: { index_name: 'docs' },
  index: baseIndex,
  indexConfigOverride: null,
  traceNewIndex: mocks.traceNewIndex,
  refetchIndexesList: mocks.refetchIndexesList,
  cancelIndexingCallback: vi.fn(),
  values: {},
  modes: [],
  onMcpAuthRequired: vi.fn(),
  onActiveIndexReattach: mocks.onActiveIndexReattach,
  initialConversation: null,
};

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('useToolkitChat active index reattachment', () => {
  let container;
  let root;
  let current;
  let hookProps;

  const Harness = () => {
    current = useToolkitChat(hookProps);
    return null;
  };

  const renderHook = async (props = baseProps) => {
    hookProps = props;
    await act(async () => {
      root.render(<Harness />);
      await flush();
    });
  };

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    current = null;
    FakeEventSource.instances = [];
    globalThis.EventSource = FakeEventSource;
    sessionStorage.clear();
    vi.clearAllMocks();

    mocks.createToolkitConversation.mockResolvedValue({ id: 71, uuid: 'conversation-new' });
    mocks.history.mockReturnValue({
      conversationDetails: null,
      traceSteps: null,
      needGenerateProgressingIndexHistory: false,
      setProgressingIndexHistoryRecovered: vi.fn(),
    });
    mocks.convertConversationToChatHistory.mockReturnValue([]);
    mocks.generateChatMessage.mockImplementation(({ message, chatHistory }) => [
      ...chatHistory.filter(item => item.id !== message.message_id),
      {
        id: message.message_id,
        task_id: message.content?.task_id,
        content: message.content,
      },
    ]);
    mocks.onActiveIndexReattach.mockReturnValue(true);
    mocks.refetchIndexesList.mockResolvedValue({ data: [] });
    mocks.stopIndex.mockReturnValue({ unwrap: () => Promise.resolve() });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    sessionStorage.clear();
    vi.restoreAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('reattaches an exact Run conflict without storage and stops that authoritative task', async () => {
    const taskId = '0123456789abcdef0123456789abcdef';
    const activeIndex = activeIndexFor(taskId);
    mocks.refetchIndexesList.mockResolvedValue({ data: [activeIndex] });
    mocks.startIndexData.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: {
            error: ACTIVE_INDEX_CONFLICT_MESSAGE,
            task_id: taskId,
          },
        }),
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable', 'SecurityError');
    });

    await renderHook();
    await act(async () => {
      current.handleIndexData();
      await flush();
    });

    expect(FakeEventSource.instances).toHaveLength(1);
    const source = FakeEventSource.instances[0];
    expect(source.url).toMatch(`/executions/7/${taskId}/events`);
    expect(source.options).toEqual({ withCredentials: true });
    expect(mocks.refetchIndexesList).toHaveBeenCalledOnce();
    expect(mocks.onActiveIndexReattach).toHaveBeenCalledWith(activeIndex);
    expect(mocks.traceNewIndex.mock.calls.some(([, metadata]) => metadata.task_id === taskId)).toBe(false);
    expect(current.isRunning).toBe(true);

    await act(async () => {
      await current.onCancelIndexing();
      await flush();
    });
    expect(mocks.stopIndex).toHaveBeenCalledWith({
      projectId: 7,
      toolkitId: 11,
      indexName: 'docs',
      taskId,
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Stop requested');

    await act(async () => {
      source.emit('index.ingest.completed', { status: 'ok', message: 'Indexed 10 files' });
      await flush();
    });
    expect(source.closed).toBe(true);
    expect(current.isRunning).toBe(false);
    expect(current.chatHistory.filter(message => message.id === 'recovery-placeholder')).toEqual([
      expect.objectContaining({
        content: '✅ Indexed 10 files',
        task_id: taskId,
        isLoading: false,
        isStreaming: false,
      }),
    ]);
  });

  it('uses validated server metadata as an explicit Create Index navigation signal', async () => {
    const taskId = '11111111111111111111111111111111';
    const activeIndex = activeIndexFor(taskId);
    mocks.refetchIndexesList.mockResolvedValue({ data: [activeIndex] });
    mocks.startIndexData.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: {
            error: ACTIVE_INDEX_CONFLICT_MESSAGE,
            task_id: taskId,
          },
        }),
    });

    await renderHook({
      ...baseProps,
      index: {
        id: 'new_index',
        metadata: { collection: 'New Index', state: '' },
      },
      modes: ['create_index'],
    });
    await act(async () => {
      current.handleIndexData();
      await flush();
    });

    expect(mocks.refetchIndexesList).toHaveBeenCalledOnce();
    expect(mocks.onActiveIndexReattach).toHaveBeenCalledWith(activeIndex);
    expect(FakeEventSource.instances).toHaveLength(0);
    expect(current.chatHistory).toEqual([]);
  });

  it.each([
    [
      'a generic 409',
      {
        status: 409,
        data: { error: 'Conflict' },
      },
    ],
    [
      'a malformed active response',
      {
        status: 409,
        data: { error: ACTIVE_INDEX_CONFLICT_MESSAGE, task_id: 'task-1', extra: true },
      },
    ],
    [
      'an authorization failure',
      {
        status: 403,
        data: {
          error: ACTIVE_INDEX_CONFLICT_MESSAGE,
          task_id: '0123456789abcdef0123456789abcdef',
        },
      },
    ],
  ])('does not reattach %s', async (_, error) => {
    mocks.startIndexData.mockReturnValue({ unwrap: () => Promise.reject(error) });

    await renderHook();
    await act(async () => {
      current.handleIndexData();
      await flush();
    });

    expect(FakeEventSource.instances).toHaveLength(0);
    expect(mocks.refetchIndexesList).not.toHaveBeenCalled();
    expect(current.isRunning).toBe(false);
    expect(current.chatHistory.at(-1)?.content).toContain('Failed to execute tool');
  });

  it('opens another-tab execution from authoritative metadata when storage is cleared', async () => {
    const taskId = '22222222222222222222222222222222';
    const activeIndex = activeIndexFor(taskId);

    await renderHook({
      ...baseProps,
      index: activeIndex,
    });

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0].url).toMatch(`/executions/7/${taskId}/events`);
    expect(JSON.parse(sessionStorage.getItem('elitea:index-execution:7:11:docs'))).toMatchObject({
      taskId,
      reattachingExistingExecution: true,
      generation: 16,
    });

    await act(async () => {
      await current.onCancelIndexing();
      await flush();
    });
    expect(mocks.stopIndex).toHaveBeenCalledWith(expect.objectContaining({ taskId }));
  });

  it('overrides a stale storage task with the authoritative active task', async () => {
    const staleTaskId = '33333333333333333333333333333333';
    const activeTaskId = '44444444444444444444444444444444';
    sessionStorage.setItem(
      'elitea:index-execution:7:11:docs',
      JSON.stringify({
        taskId: staleTaskId,
        messageId: 'stale-message',
        reattachingExistingExecution: true,
      }),
    );

    await renderHook({
      ...baseProps,
      index: activeIndexFor(activeTaskId),
    });

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0].url).toMatch(`/executions/7/${activeTaskId}/events`);
    expect(FakeEventSource.instances[0].url).not.toContain(staleTaskId);
    expect(JSON.parse(sessionStorage.getItem('elitea:index-execution:7:11:docs'))).toMatchObject({
      taskId: activeTaskId,
      reattachingExistingExecution: true,
    });

    await act(async () => {
      await current.onCancelIndexing();
      await flush();
    });
    expect(mocks.stopIndex).toHaveBeenCalledWith(expect.objectContaining({ taskId: activeTaskId }));
  });

  it('does not let a stale storage hint reopen server metadata that is not active', async () => {
    sessionStorage.setItem(
      'elitea:index-execution:7:11:docs',
      JSON.stringify({
        taskId: '77777777777777777777777777777777',
        messageId: 'stale-message',
        reattachingExistingExecution: true,
      }),
    );

    await renderHook();

    expect(FakeEventSource.instances).toHaveLength(0);
    expect(current.isRunning).toBe(false);
    expect(sessionStorage.getItem('elitea:index-execution:7:11:docs')).toBeNull();
  });

  it('keeps CONNECTING reattachment streams reconnectable but clears a 403/CLOSED stream', async () => {
    const taskId = '55555555555555555555555555555555';
    mocks.refetchIndexesList.mockResolvedValue({ data: [activeIndexFor(taskId)] });
    mocks.startIndexData.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: {
            error: ACTIVE_INDEX_CONFLICT_MESSAGE,
            task_id: taskId,
          },
        }),
    });
    await renderHook();
    await act(async () => {
      current.handleIndexData();
      await flush();
    });
    const source = FakeEventSource.instances[0];

    await act(async () => {
      source.reject(FakeEventSource.CONNECTING);
      await flush();
    });
    expect(source.closed).toBe(false);
    expect(current.isRunning).toBe(true);
    expect(mocks.refetchIndexesList).toHaveBeenCalledOnce();

    await act(async () => {
      source.reject(FakeEventSource.CLOSED, 403);
      await flush();
    });
    expect(source.closed).toBe(true);
    expect(current.isRunning).toBe(false);
    expect(current.isIndexing).toBe(false);
    expect(mocks.refetchIndexesList).toHaveBeenCalledTimes(2);
    expect(current.chatHistory).toEqual([
      expect.objectContaining({
        task_id: taskId,
        content: '⚠️ Live indexing updates are unavailable. Refreshing the current index status.',
        isLoading: false,
        isStreaming: false,
      }),
    ]);
    expect(sessionStorage.getItem('elitea:index-execution:7:11:docs')).toBeNull();
  });

  it('recovers the stored execution and its durable Activity history after a reload', async () => {
    const taskId = 'fedcba9876543210fedcba9876543210';
    sessionStorage.setItem(
      'elitea:index-execution:7:11:docs',
      JSON.stringify({
        taskId,
        messageId: 'recovery-placeholder',
        reattachingExistingExecution: true,
      }),
    );
    const historyMessage = {
      id: 'durable-message',
      task_id: taskId,
      content: '20 files processed',
    };
    mocks.history.mockReturnValue({
      conversationDetails: { id: 88, uuid: 'conversation-original' },
      traceSteps: [],
      needGenerateProgressingIndexHistory: true,
      setProgressingIndexHistoryRecovered: vi.fn(),
    });
    mocks.convertConversationToChatHistory.mockReturnValue([historyMessage]);

    await renderHook({
      ...baseProps,
      index: {
        ...baseIndex,
        metadata: {
          ...baseIndex.metadata,
          state: 'in_progress',
          task_id: taskId,
          conversation_id: 88,
        },
      },
    });

    expect(mocks.history).toHaveBeenCalledWith({
      shouldRecover: 88,
      conversationId: 88,
    });
    expect(FakeEventSource.instances).toHaveLength(1);
    expect(current.chatHistory).toEqual([historyMessage]);
    expect(current.isRunning).toBe(true);

    await act(async () => {
      FakeEventSource.instances[0].emit('index.ingest.completed', {
        status: 'ok',
        message: 'Indexed 20 files',
      });
      await flush();
    });

    expect(current.chatHistory).toHaveLength(1);
    expect(current.chatHistory[0]).toMatchObject({
      id: 'durable-message',
      task_id: taskId,
      content: '✅ Indexed 20 files',
    });
  });

  it('does not let delayed Activity recovery overwrite a terminal SSE settlement', async () => {
    const taskId = '66666666666666666666666666666666';
    const activeIndex = activeIndexFor(taskId, { index_generation: 17 });
    const recoveredHistory = {
      id: 'delayed-history',
      task_id: taskId,
      content: 'stale in-progress Activity',
    };
    const recoveredSetter = vi.fn();
    let resolveDelayedHistory;
    const delayedHistory = new Promise(resolve => {
      resolveDelayedHistory = resolve;
    });

    await renderHook({
      ...baseProps,
      index: activeIndex,
    });
    const source = FakeEventSource.instances[0];
    await act(async () => {
      source.emit('index.ingest.completed', { status: 'ok', message: 'Indexed terminal result' });
      await flush();
    });
    expect(current.chatHistory.find(message => message.task_id === taskId)).toMatchObject({
      task_id: taskId,
      content: '✅ Indexed terminal result',
    });

    resolveDelayedHistory({
      conversationDetails: { id: 88, uuid: 'conversation-original' },
      traceSteps: [],
      needGenerateProgressingIndexHistory: true,
      setProgressingIndexHistoryRecovered: recoveredSetter,
    });
    mocks.history.mockReturnValue(await delayedHistory);
    mocks.convertConversationToChatHistory.mockReturnValue([recoveredHistory]);
    await renderHook({
      ...baseProps,
      index: activeIndex,
    });

    expect(recoveredSetter).toHaveBeenCalledWith(true);
    expect(current.chatHistory.find(message => message.task_id === taskId)).toMatchObject({
      task_id: taskId,
      content: '✅ Indexed terminal result',
    });
    expect(current.isRunning).toBe(false);
  });

  it('keeps a newly admitted terminal result when metadata later advances to the new generation', async () => {
    const taskId = '88888888888888888888888888888888';
    mocks.startIndexData.mockReturnValue({
      unwrap: () => Promise.resolve({ task_id: taskId }),
    });

    await renderHook({
      ...baseProps,
      index: {
        ...baseIndex,
        metadata: {
          ...baseIndex.metadata,
          index_generation: 16,
        },
      },
    });
    await act(async () => {
      current.handleIndexData();
      await flush();
    });
    expect(FakeEventSource.instances).toHaveLength(1);

    await act(async () => {
      FakeEventSource.instances[0].emit('index.ingest.completed', {
        status: 'ok',
        message: 'Indexed the new generation',
      });
      await flush();
    });
    expect(current.chatHistory.find(message => message.task_id === taskId)).toMatchObject({
      task_id: taskId,
      content: '✅ Indexed the new generation',
    });

    const recoveredSetter = vi.fn();
    mocks.history.mockReturnValue({
      conversationDetails: { id: 88 },
      traceSteps: [],
      needGenerateProgressingIndexHistory: true,
      setProgressingIndexHistoryRecovered: recoveredSetter,
    });
    mocks.convertConversationToChatHistory.mockReturnValue([
      {
        id: 'stale-new-generation-history',
        task_id: taskId,
        content: 'stale in-progress Activity',
      },
    ]);
    await renderHook({
      ...baseProps,
      index: activeIndexFor(taskId, { index_generation: 17 }),
    });

    expect(recoveredSetter).toHaveBeenCalledWith(true);
    expect(FakeEventSource.instances).toHaveLength(1);
    expect(current.chatHistory.find(message => message.task_id === taskId)).toMatchObject({
      task_id: taskId,
      content: '✅ Indexed the new generation',
    });
    expect(current.isRunning).toBe(false);
  });
});
