// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';

import RunHistoryChat from '../RunHistoryChat';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const { fetchDetails, getTraces, detailsResult } = vi.hoisted(() => ({
  fetchDetails: vi.fn(),
  getTraces: vi.fn(() => Promise.resolve({ data: null })),
  detailsResult: { data: undefined, isFetching: false },
}));

vi.mock('@/[fsd]/entities/run-history/api', () => ({
  RunHistoryApi: {
    useLazyGetRunHistoryDetailsQuery: () => [fetchDetails, { ...detailsResult, reset: vi.fn() }],
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 7,
  useIsSmallWindow: () => ({ isSmallWindow: false }),
}));
vi.mock('@/api', () => ({ useLazyMessageTracesQuery: () => [getTraces] }));
vi.mock('@/common/convertChatConversationMessages', () => ({
  buildTraceListParams: () => ({}),
  convertConversationToChatHistory: () => [{ id: 'msg-1' }, { id: 'msg-paused' }],
}));
vi.mock('@/hooks/chat/useChatCopyToClipboard', () => ({ default: () => vi.fn() }));
vi.mock('@/hooks/useIsSmallWindow', () => ({ default: () => ({ isSmallWindow: false }) }));
vi.mock('@/components/Chat/StyledComponents', async () => ({
  ChatBodyContainer: ({ children }) => <div>{children}</div>,
}));
vi.mock('@/pages/Common', async () => ({ ContentContainer: ({ children }) => <div>{children}</div> }));

const received = [];
const ListStub = props => {
  received.push(props);

  return null;
};

const renderChat = extra =>
  render(
    <RunHistoryChat
      selectedHistoryItem={99}
      ChatMessageListComponent={ListStub}
      {...extra}
    />,
  );

beforeEach(() => {
  received.length = 0;
  detailsResult.data = { uuid: 'conv-uuid', message_groups: [] };
});

afterEach(cleanup);

describe('RunHistoryChat', () => {
  it('passes a handler that adds the conversation uuid and the paused message id', () => {
    const onHitlResume = vi.fn();

    renderChat({ onHitlResume });
    const passed = received.at(-1).onHitlResume;

    expect(passed).toBeTypeOf('function');
    passed({ action: 'approve', toolCallId: 't1' });
    expect(onHitlResume).toHaveBeenCalledWith({
      action: 'approve',
      toolCallId: 't1',
      conversationUuid: 'conv-uuid',
      messageId: 'msg-paused',
    });
  });

  it('passes no handler when none is given, so the buttons stay disabled', () => {
    renderChat();

    expect(received.at(-1).onHitlResume).toBeUndefined();
  });
});
