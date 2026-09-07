// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { SocketMessageType } from '@/common/constants';

import { generateChatMessageBasedOnResponse } from '../indexChat.helpers';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const streamingMessage = () => ({
  id: 'msg-1',
  role: 'assistant',
  content: '',
  isStreaming: true,
  task_id: 'task-1',
  toolActions: [],
});

const respondWith = (content, contentType) =>
  generateChatMessageBasedOnResponse({
    message: {
      message_id: 'msg-1',
      type: SocketMessageType.AgentResponse,
      content,
      response_metadata: { content_type: contentType },
    },
    chatHistory: [streamingMessage()],
    onFinish: vi.fn(),
  })[0].content;

const JSON_RESULT = '[\n  {\n    "title": "Fix *login* and _signup_, see [doc](http://x)"\n  }\n]';

describe('generateChatMessageBasedOnResponse tool results', () => {
  it('fences a JSON result so markdown cannot consume characters inside values', () => {
    const content = respondWith(JSON_RESULT, 'json');

    expect(content).toBe(`\`\`\`json\n${JSON_RESULT}\n\`\`\``);
    expect(content).toContain('*login*');
    expect(content).toContain('[doc](http://x)');
  });

  it('leaves an already fenced result alone', () => {
    const fenced = `\`\`\`json\n[]\n\`\`\``;

    expect(respondWith(fenced, 'json')).toBe(fenced);
  });

  it('does not fence plain text results', () => {
    expect(respondWith('No issues found matching the given filters', 'text')).toBe(
      'No issues found matching the given filters',
    );
  });

  it('does not fence agent answers that carry no content type', () => {
    expect(respondWith('Here is **my** answer', undefined)).toBe('Here is **my** answer');
  });
});
