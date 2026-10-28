// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { SocketMessageType } from '@/common/constants';

import { generateChatMessageBasedOnResponse } from '../indexChat.helpers';

vi.hoisted(() => {
  vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/');
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const running = () => ({
  id: 'msg-1',
  role: 'assistant',
  content: '🔄 Testing tool...',
  isLoading: true,
  isStreaming: true,
  toolActions: [],
});

// What the worker emits for a toolkit run it refused for governance (indexer_test_toolkit.test_error, C-1009)
const REFUSAL = {
  code: 'DENIED_DEVELOPMENT_CREDENTIAL',
  error: 'This credential needs a grant before a draft can use it.',
};

describe('a toolkit run the worker refused for governance (#7229)', () => {
  it('becomes the refusal card (no headline, the payload as the exception) and hands the refusal to the run', () => {
    const onFinish = vi.fn();
    const [msg] = generateChatMessageBasedOnResponse({
      message: {
        message_id: 'msg-1',
        type: SocketMessageType.AgentException,
        content: JSON.stringify(REFUSAL),
      },
      chatHistory: [running()],
      onFinish,
    });

    expect(msg.content).toBe('');
    expect(JSON.parse(msg.exception)).toEqual(REFUSAL);
    // the refusal keeps the payload the worker sent and the message it belongs to
    expect(onFinish).toHaveBeenCalledWith(IndexStatuses.fail, {
      refusal: {
        code: REFUSAL.code,
        message: REFUSAL.error,
        trace: JSON.stringify(REFUSAL),
        messageId: 'msg-1',
      },
    });
  });

  it('is the refusal card too when it arrives before the first frame of the run: nothing to update yet', () => {
    const onFinish = vi.fn();
    const history = generateChatMessageBasedOnResponse({
      message: {
        message_id: 'msg-1',
        type: SocketMessageType.AgentException,
        content: JSON.stringify(REFUSAL),
      },
      chatHistory: [],
      onFinish,
    });

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ id: 'msg-1', content: '' });
    expect(JSON.parse(history[0].exception)).toEqual(REFUSAL);
    expect(onFinish).toHaveBeenCalledWith(IndexStatuses.fail, {
      refusal: {
        code: REFUSAL.code,
        message: REFUSAL.error,
        trace: JSON.stringify(REFUSAL),
        messageId: 'msg-1',
      },
    });
  });

  it('keeps one message when the first frame of the run is delivered after its refusal', () => {
    const refused = generateChatMessageBasedOnResponse({
      message: {
        message_id: 'msg-1',
        type: SocketMessageType.AgentException,
        content: JSON.stringify(REFUSAL),
      },
      chatHistory: [],
      onFinish: vi.fn(),
    });

    const history = generateChatMessageBasedOnResponse({
      message: { message_id: 'msg-1', type: SocketMessageType.StartTask, content: { task_id: 't-1' } },
      chatHistory: refused,
      onFinish: vi.fn(),
    });

    expect(history).toHaveLength(1);
    expect(history[0].isLoading).toBeUndefined();
  });

  it('still shows a code-less {error} that arrives before the first frame as the old failure text, with no refusal', () => {
    const onFinish = vi.fn();
    const history = generateChatMessageBasedOnResponse({
      message: {
        message_id: 'msg-1',
        type: SocketMessageType.AgentException,
        content: JSON.stringify({ error: 'Connection reset by the remote host' }),
      },
      chatHistory: [],
      onFinish,
    });

    expect(history).toHaveLength(1);
    expect(history[0].content).toContain('Error occurred during tool testing');
    expect(history[0].exception).toBeUndefined();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('keeps the headline and a plain failure for any other exception', () => {
    const onFinish = vi.fn();
    const [msg] = generateChatMessageBasedOnResponse({
      message: {
        message_id: 'msg-1',
        type: SocketMessageType.AgentException,
        content: 'Failed to test toolkit tool',
      },
      chatHistory: [running()],
      onFinish,
    });

    expect(msg.content).toBe('🔄 Testing tool...');
    expect(onFinish).toHaveBeenCalledWith(IndexStatuses.fail, undefined);
  });

  it('keeps a code-less {error} as a plain failure: only a governance code makes a refusal card', () => {
    const onFinish = vi.fn();
    const [msg] = generateChatMessageBasedOnResponse({
      message: {
        message_id: 'msg-1',
        type: SocketMessageType.AgentException,
        content: JSON.stringify({ error: 'Connection reset by the remote host' }),
      },
      chatHistory: [running()],
      onFinish,
    });

    expect(msg.content).toBe('🔄 Testing tool...');
    expect(onFinish).toHaveBeenCalledWith(IndexStatuses.fail, undefined);
  });
});
