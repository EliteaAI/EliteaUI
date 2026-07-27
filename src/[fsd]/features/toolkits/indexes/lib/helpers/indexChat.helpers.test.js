import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  const storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };
  globalThis.localStorage = storage;
  globalThis.sessionStorage = storage;
});

import { generateChatMessageBasedOnResponse } from './indexChat.helpers';

import { ROLES, SocketMessageType } from '@/common/constants';

describe('generateChatMessageBasedOnResponse index execution parity', () => {
  it('renders index status progress messages from response metadata', () => {
    const onFinish = vi.fn();
    const result = generateChatMessageBasedOnResponse({
      message: {
        message_id: 'message-1',
        type: SocketMessageType.AgentIndexDataStatus,
        content: null,
        response_metadata: {
          message: '10 files processed',
        },
      },
      chatHistory: [
        {
          id: 'message-1',
          role: ROLES.Assistant,
          content: '',
          isLoading: true,
          isStreaming: true,
          toolActions: [],
          created_at: 0,
          participant_id: 'system',
        },
      ],
      onFinish,
    });

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('10 files processed');
    expect(result[0].isLoading).toBe(false);
    expect(result[0].isStreaming).toBe(true);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('creates a streaming message when an index removal event arrives before the placeholder exists', () => {
    const result = generateChatMessageBasedOnResponse({
      message: {
        message_id: 'message-2',
        type: SocketMessageType.AgentIndexDataRemoved,
        content: null,
        response_metadata: {
          message: 'Removed 3 stale files from the index',
        },
      },
      chatHistory: [],
      onFinish: vi.fn(),
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'message-2',
      role: ROLES.Assistant,
      content: 'Removed 3 stale files from the index',
      isLoading: false,
      isStreaming: true,
      participant_id: 'system',
    });
  });
});
