// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useSkillRunChat } from '../useSkillRunChat.hooks';

const fixture = vi.hoisted(() => ({
  query: { data: undefined, isFetching: false, isError: false },
  getMessageTraces: vi.fn(),
  emitEnterRoom: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }));
vi.mock('@/api', () => ({
  TAG_TYPE_CONVERSATION_DETAILS: 'TAG_TYPE_CONVERSATION_DETAILS',
  useConversationCreateMutation: () => [vi.fn(), { isLoading: false }],
  useConversationDetailsQuery: () => fixture.query,
  useDeleteAllMessagesFromConversationMutation: () => [vi.fn(), { reset: vi.fn() }],
  useDeleteMessageFromConversationMutation: () => [vi.fn(), { reset: vi.fn() }],
  useLazyMessageTracesQuery: () => [fixture.getMessageTraces],
  useStopChatTaskMutation: () => [vi.fn()],
}));
vi.mock('@/api/eliteaApi', () => ({ eliteaApi: { util: { invalidateTags: vi.fn() } } }));
vi.mock('@/common/convertChatConversationMessages', () => ({
  buildTraceListParams: () => ({}),
  convertConversationToChatHistory: conversation => conversation.message_groups,
}));
vi.mock('@/common/utils', () => ({ buildErrorMessage: () => '' }));
vi.mock('@/components/Chat/hooks', () => ({
  useChatMessageDeleteSocket: () => {},
  useChatMessageSyncSocket: () => {},
}));
vi.mock('@/hooks/application/useSynAgentChatMessage', () => ({
  default: () => ({ onRemoteChatMessageSync: vi.fn() }),
}));
vi.mock('@/hooks/chat/useAttachmentState', () => ({
  useAttachmentState: () => ({
    attachments: [],
    onAttachFiles: vi.fn(),
    onDeleteAttachment: vi.fn(),
    onClearAttachments: vi.fn(),
  }),
}));
vi.mock('@/hooks/chat/useStreamingNavBlocker', () => ({ default: () => {} }));
vi.mock('@/hooks/useSocket', () => ({ useManualSocket: () => ({ emit: fixture.emitEnterRoom }) }));
vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastError: fixture.toastError, toastInfo: vi.fn(), toastSuccess: vi.fn() }),
}));

const SKILL_ID = 10;
const PROJECT_ID = 2;
const VERSION_ID = 100;

const storedRun = {
  id: 5,
  uuid: 'run-5',
  message_groups: [{ id: 'stale-answer' }],
  participants: [
    {
      id: 7,
      entity_name: 'skill',
      entity_meta: { id: SKILL_ID, project_id: PROJECT_ID },
      entity_settings: { version_id: VERSION_ID },
    },
  ],
};

const deferTraces = () => {
  let resolve;
  const request = new Promise(done => {
    resolve = done;
  });
  request.abort = vi.fn();
  return { request, resolve };
};

const renderRunChat = () =>
  renderHook(() =>
    useSkillRunChat({
      projectId: PROJECT_ID,
      skillId: String(SKILL_ID),
      skillName: 'Reviewer',
      versionDetails: { id: VERSION_ID },
      runConversationId: '5',
      onRunConversationChange: vi.fn(),
      onOpenRunVersion: vi.fn(),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  fixture.query = { data: storedRun, isFetching: false, isError: false };
});
afterEach(cleanup);

describe('useSkillRunChat run loading', () => {
  it('opens the stored run once its traces arrive', async () => {
    const traces = deferTraces();
    fixture.getMessageTraces.mockReturnValue(traces.request);
    const { result } = renderRunChat();

    await act(async () => traces.resolve({ data: [] }));

    expect(result.current.activeConversation?.id).toBe(5);
    expect(fixture.emitEnterRoom).toHaveBeenCalledWith(expect.objectContaining({ conversation_id: 5 }));
  });

  it('never commits a load that a newer fetch superseded while its traces were in flight', async () => {
    const traces = deferTraces();
    fixture.getMessageTraces.mockReturnValue(traces.request);
    const { result, rerender } = renderRunChat();

    fixture.query = { data: storedRun, isFetching: true, isError: false };
    rerender();
    await act(async () => traces.resolve({ data: [] }));

    expect(traces.request.abort).toHaveBeenCalled();
    expect(result.current.activeConversation).toBeNull();
    expect(fixture.emitEnterRoom).not.toHaveBeenCalled();
  });
});
