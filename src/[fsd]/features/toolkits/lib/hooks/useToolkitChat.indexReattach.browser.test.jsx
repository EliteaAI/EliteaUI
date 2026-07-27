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

  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = new Map();
    this.closed = false;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    this.listeners.set(type, [...listeners, listener]);
  }

  close() {
    this.closed = true;
  }

  emit(type, data) {
    for (const listener of this.listeners.get(type) || []) listener({ type, data: JSON.stringify(data) });
  }

  reject(status) {
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

  const renderHook = async (props = baseProps) => {
    const Harness = () => {
      current = useToolkitChat(props);
      return null;
    };
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
    mocks.refetchIndexesList.mockResolvedValue(undefined);
    mocks.stopIndex.mockReturnValue({ unwrap: () => Promise.resolve() });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    sessionStorage.clear();
    vi.restoreAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it('reattaches an exact authorized conflict without storage, survives SSE 403, and stops that task', async () => {
    const taskId = '0123456789abcdef0123456789abcdef';
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
    expect(
      mocks.traceNewIndex.mock.calls.some(
        ([, metadata]) =>
          metadata.task_id === taskId &&
          metadata.conversation_id === undefined &&
          metadata.conversation_uuid === undefined,
      ),
    ).toBe(true);
    expect(current.isRunning).toBe(true);

    await act(async () => {
      source.reject(403);
      await flush();
    });
    expect(source.closed).toBe(false);
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
});
