// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useAddNewParticipants } from '../useAddNewParticipants.hooks';

const addParticipant = vi.fn();
const getConversationDetail = vi.fn();

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/api', () => ({
  useAddParticipantIntoConversationMutation: () => [addParticipant, {}],
  useLazyConversationDetailsQuery: () => [getConversationDetail],
  useListModelsQuery: () => ({ data: { items: [], total: 0 } }),
  useUpdateApplicationVersionMutation: () => [vi.fn()],
}));
vi.mock('@/common/utils', () => ({ buildErrorMessage: vi.fn() }));

const USER = { id: 1, entity_name: 'user', entity_meta: { id: 7 }, entity_settings: {} };
const TOOLKIT_ON_B = { id: 30, entity_name: 'toolkit', entity_meta: { id: 4, project_id: 2 } };
const ADDED_TOOLKIT = { id: 31, entity_name: 'toolkit', entity_meta: { id: 9, project_id: 2 } };

const CHAT_A = { id: 100, participants: [USER] };
const CHAT_B = { id: 200, participants: [USER, TOOLKIT_ON_B] };

const deferred = () => {
  let resolve;
  const promise = new Promise(res => {
    resolve = res;
  });
  return { promise, resolve };
};

const renderAddHook = () => {
  const setActiveConversation = vi.fn();
  const setConversations = vi.fn();
  const hook = renderHook(
    ({ activeConversation }) =>
      useAddNewParticipants({
        toastError: vi.fn(),
        activeConversation,
        setActiveConversation,
        setConversations,
        newConversationViewRef: { current: null },
      }),
    { initialProps: { activeConversation: CHAT_A } },
  );
  return { ...hook, setActiveConversation, setConversations };
};

const addToolkitToChatA = async onAdded => {
  const request = deferred();
  addParticipant.mockReturnValue(request.promise);
  const hook = renderAddHook();

  await act(async () => {
    hook.result.current.addNewParticipants([{ participantType: 'toolkit', id: 9, project_id: 2 }], onAdded);
  });

  return { ...hook, request };
};

const resolveAdd = async request => {
  await act(async () => {
    request.resolve({ data: [ADDED_TOOLKIT] });
  });
};

describe('useAddNewParticipants when the chat changes before the add resolves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the add to the chat it was started from', async () => {
    const { rerender, request } = await addToolkitToChatA();
    rerender({ activeConversation: CHAT_B });
    await resolveAdd(request);

    expect(addParticipant).toHaveBeenCalledWith(expect.objectContaining({ projectId: 2, id: CHAT_A.id }));
  });

  it('leaves the chat open now untouched', async () => {
    const { rerender, request, setActiveConversation } = await addToolkitToChatA();
    rerender({ activeConversation: CHAT_B });
    await resolveAdd(request);

    const applyToOpenChat = setActiveConversation.mock.calls[0][0];
    expect(applyToOpenChat(CHAT_B)).toBe(CHAT_B);
  });

  it('merges into the originating chat while it is still open', async () => {
    const { request, setActiveConversation } = await addToolkitToChatA();
    await resolveAdd(request);

    const applyToOpenChat = setActiveConversation.mock.calls[0][0];
    expect(applyToOpenChat(CHAT_A).participants).toEqual([USER, ADDED_TOOLKIT]);
  });

  it('adds the participant only to the originating chat in the list', async () => {
    const { rerender, request, setConversations } = await addToolkitToChatA();
    rerender({ activeConversation: CHAT_B });
    await resolveAdd(request);

    const applyToList = setConversations.mock.calls[0][0];
    const [chatA, chatB] = applyToList([CHAT_A, CHAT_B]);
    expect(chatA.participants).toEqual([USER, ADDED_TOOLKIT]);
    expect(chatB).toBe(CHAT_B);
  });

  it('hands the added participants to the caller', async () => {
    const onAdded = vi.fn();
    const { rerender, request } = await addToolkitToChatA(onAdded);
    rerender({ activeConversation: CHAT_B });
    await resolveAdd(request);

    expect(onAdded).toHaveBeenCalledWith([ADDED_TOOLKIT]);
  });
});
