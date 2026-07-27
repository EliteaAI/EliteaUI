import { afterEach, describe, expect, it, vi } from 'vitest';

import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { generateChatMessageBasedOnResponse } from '@/[fsd]/features/toolkits/indexes/lib/helpers/indexChat.helpers';
import { notifyTaskComplete, notifyTaskError } from '@/[fsd]/shared/lib/utils/soundNotification.utils';
import { SocketMessageType } from '@/common/constants';

import {
  INDEX_EXECUTION_COMPLETED_EVENT,
  INDEX_EXECUTION_FAILED_EVENT,
  parseIndexExecutionEvent,
  parseIndexNodeEvent,
} from './indexExecution.helpers';

vi.mock('@/[fsd]/shared/lib/utils/soundNotification.utils', () => ({
  notifyTaskComplete: vi.fn(),
  notifyTaskError: vi.fn(),
}));
vi.mock('@/common/utils', () => ({
  convertJsonToString: value => (typeof value === 'string' ? value : JSON.stringify(value)),
}));

const loadingHistory = () => [
  {
    id: 'message-1',
    content: 'Indexing in progress',
    isLoading: true,
    isStreaming: true,
    toolActions: [],
  },
];

const renderNodeEvent = (payload, onFinish = vi.fn()) => {
  const message = parseIndexNodeEvent(JSON.stringify(payload), 'message-1');
  const history = generateChatMessageBasedOnResponse({
    message,
    chatHistory: loadingHistory(),
    onFinish,
    allowTerminalSideEffects: false,
  });
  return { history, onFinish };
};

describe('SSE indexing terminal authority', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps an early agent_response display-only until execution.failed arrives', () => {
    const { history, onFinish } = renderNodeEvent({
      type: SocketMessageType.AgentResponse,
      message_id: 'message-1',
      content: 'The agent finished its indexing step.',
      response_metadata: { finish_reason: 'stop' },
    });

    expect(history[0].content).toBe('The agent finished its indexing step.');
    expect(onFinish).not.toHaveBeenCalled();
    expect(notifyTaskComplete).not.toHaveBeenCalled();
    expect(
      parseIndexExecutionEvent(
        INDEX_EXECUTION_FAILED_EVENT,
        JSON.stringify({ code: 'WORKER_FAILED', safe_message: 'The durable execution failed.' }),
      ),
    ).toEqual({
      state: IndexStatuses.fail,
      content: '❌ The durable execution failed.',
    });
  });

  it.each([SocketMessageType.AgentException, SocketMessageType.AgentToolError])(
    'keeps an early %s display-only until successful completion arrives',
    type => {
      const { onFinish } = renderNodeEvent({
        type,
        message_id: 'message-1',
        content: 'A nonterminal node reported an error.',
        response_metadata: {},
      });

      expect(onFinish).not.toHaveBeenCalled();
      expect(notifyTaskError).not.toHaveBeenCalled();
      expect(
        parseIndexExecutionEvent(
          INDEX_EXECUTION_COMPLETED_EVENT,
          JSON.stringify({ status: 'ok', message: 'Indexed 12 files.' }),
        ),
      ).toEqual({
        state: IndexStatuses.success,
        content: '✅ Indexed 12 files.',
      });
    },
  );

  it('ignores a malformed NodeEvent without producing a terminal transition', () => {
    const onFinish = vi.fn();

    expect(parseIndexNodeEvent('{', 'message-1')).toBeNull();
    expect(onFinish).not.toHaveBeenCalled();
    expect(notifyTaskComplete).not.toHaveBeenCalled();
    expect(notifyTaskError).not.toHaveBeenCalled();
  });

  it('settles a normal run from index.ingest.completed', () => {
    expect(
      parseIndexExecutionEvent(
        INDEX_EXECUTION_COMPLETED_EVENT,
        JSON.stringify({ status: 'ok', message: 'Indexing completed.' }),
      ),
    ).toEqual({
      state: IndexStatuses.success,
      content: '✅ Indexing completed.',
    });
  });

  it('preserves terminal side effects for the default Socket.IO renderer path', () => {
    const onFinish = vi.fn();

    generateChatMessageBasedOnResponse({
      message: {
        type: SocketMessageType.AgentResponse,
        message_id: 'message-1',
        content: 'The Socket.IO task completed.',
        response_metadata: { finish_reason: 'stop' },
      },
      chatHistory: loadingHistory(),
      onFinish,
    });

    expect(onFinish).toHaveBeenCalledOnce();
    expect(onFinish).toHaveBeenCalledWith(IndexStatuses.success);
    expect(notifyTaskComplete).toHaveBeenCalledOnce();
  });
});
