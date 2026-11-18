// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook, waitFor } from '@testing-library/react';

import { useImportConversation } from '../useImportConversation.hooks';

const commitImport = vi.hoisted(() => vi.fn());
const cancelImport = vi.hoisted(() => vi.fn());

vi.mock('@/[fsd]/features/chat/api', () => ({
  useConversationImportCommitMutation: () => [commitImport],
  useConversationImportCancelMutation: () => [cancelImport],
}));

vi.mock('@/[fsd]/features/chat/lib/hooks', () => ({
  useChatConfig: () => ({ limits: { MAX_TOTAL_SIZE: 10 * 1024 * 1024 } }),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 2,
  useToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn(), toastWarning: vi.fn() }),
}));

const previewFor = importId => ({
  import_id: importId,
  name: 'chat',
  messages_count: 1,
  attachments: [],
  participants: [
    { id: 3, entity_name: 'application', name: 'Agent-X', status: 'name_only', target_name: 'Agent-X' },
    { id: 4, entity_name: 'application', name: 'Helper', status: 'same', target_name: 'Helper' },
  ],
});

const previews = [];

class FakeXMLHttpRequest {
  constructor() {
    this.listeners = {};
    this.upload = { addEventListener: () => {} };
  }

  addEventListener(event, handler) {
    this.listeners[event] = handler;
  }

  open() {}

  setRequestHeader() {}

  send() {
    this.status = 202;
    this.responseText = JSON.stringify(previews.shift());
    queueMicrotask(() => this.listeners.load());
  }

  abort() {}
}

const makeFile = name => new File(['encrypted'], name);

const renderImport = () => renderHook(() => useImportConversation({ onImported: vi.fn() })).result;

const selectFile = async (result, name, importId) => {
  previews.push(previewFor(importId));
  await act(() => result.current.selectFile(makeFile(name)));
  await waitFor(() => expect(result.current.preview?.import_id).toBe(importId));
};

const committedSkipList = async result => {
  await act(() => result.current.startImport());
  return commitImport.mock.calls.at(-1)[0].skipParticipants;
};

describe('useImportConversation participants', () => {
  beforeEach(() => {
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
    commitImport.mockResolvedValue({ data: { conversation: { id: 9, name: 'chat' } } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    previews.length = 0;
  });

  it('commits the unticked participant ids as the skip list', async () => {
    const result = renderImport();
    await selectFile(result, 'chat.json.enc', 'a'.repeat(32));

    act(() => result.current.toggleParticipant(3));

    expect(await committedSkipList(result)).toEqual([3]);
  });

  it('starts with nothing skipped, so every staged participant is linked', async () => {
    const result = renderImport();
    await selectFile(result, 'chat.json.enc', 'b'.repeat(32));

    expect(await committedSkipList(result)).toEqual([]);
  });

  it('clears the skip list when another file is picked', async () => {
    const result = renderImport();
    await selectFile(result, 'first.json.enc', 'c'.repeat(32));
    act(() => result.current.toggleParticipant(3));

    await selectFile(result, 'second.json.enc', 'd'.repeat(32));

    expect(result.current.skippedParticipantIds).toEqual([]);
    expect(await committedSkipList(result)).toEqual([]);
  });
});
