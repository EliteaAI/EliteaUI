// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useShareChat } from '../useShareChat.hooks';

const conversationEdit = vi.hoisted(() => vi.fn());
const addParticipant = vi.hoisted(() => vi.fn());
const deleteParticipant = vi.hoisted(() => vi.fn());
const createShareLink = vi.hoisted(() => vi.fn());
const details = vi.hoisted(() => ({ current: null }));
const summaryQuery = vi.hoisted(() => vi.fn());

const unwrapped = value => ({ unwrap: () => Promise.resolve(value) });

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { id: 1, name: 'Owner', personal_project_id: 28 } }),
}));

vi.mock('@/[fsd]/features/chat/api', () => ({
  useConversationDetailsQuery: () => ({ data: details.current, fulfilledTimeStamp: Date.now() + 1000 }),
  useConversationEditMutation: () => [conversationEdit],
  useAddParticipantIntoConversationMutation: () => [addParticipant],
  useDeleteParticipantFromConversationMutation: () => [deleteParticipant],
  useConversationExportSummaryQuery: (args, options) => summaryQuery(args, options),
}));

vi.mock('@/[fsd]/features/chat/conversation-list/api/sharedLinksApi', () => ({
  useListShareLinksQuery: () => ({ data: [], isFetching: false }),
  useCreateShareLinkMutation: () => [createShareLink, { isLoading: false }],
  useRevokeShareLinkMutation: () => [vi.fn()],
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 406,
  useUserList: () => ({
    data: {
      rows: [
        { id: 1, name: 'Owner' },
        { id: 2, name: 'Ann' },
        { id: 3, name: 'Bob' },
      ],
      total: 3,
    },
    onLoadMoreUsers: vi.fn(),
    isUsersFetching: false,
  }),
}));

const userParticipant = (id, userId, name) => ({
  id,
  entity_name: 'user',
  entity_meta: { id: userId },
  meta: { user_name: name },
});
const agentParticipant = { id: 20, entity_name: 'application', entity_meta: { id: 77 } };

const renderShare = () => renderHook(() => useShareChat({ conversation: { id: 500, author_id: 1 } })).result;

describe('useShareChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conversationEdit.mockReturnValue(unwrapped({}));
    addParticipant.mockReturnValue(unwrapped([{ id: 30 }]));
    deleteParticipant.mockReturnValue(unwrapped({}));
    createShareLink.mockReturnValue(unwrapped({ token: 't' }));
    summaryQuery.mockReturnValue({ data: { attachments_count: 5 }, isSuccess: true });
  });

  it('asks for the file count only while the Externally content is shown', () => {
    details.current = { author_id: 1, is_private: false, participants: [] };
    renderHook(() => useShareChat({ conversation: { id: 500, author_id: 1 } }));
    expect(summaryQuery).toHaveBeenLastCalledWith(expect.anything(), { skip: true });

    renderHook(() => useShareChat({ conversation: { id: 500, author_id: 1 }, isExternallyShown: true }));
    expect(summaryQuery).toHaveBeenLastCalledWith(expect.anything(), { skip: false });
  });

  it('makes a private chat public for Whole team and leaves its participants alone', async () => {
    details.current = {
      author_id: 1,
      is_private: true,
      participants: [userParticipant(11, 1, 'Owner'), userParticipant(12, 2, 'Ann')],
    };
    const result = renderShare();

    let changes;
    await act(async () => {
      changes = await result.current.saveAccess([{ id: 'whole-team' }]);
    });

    expect(conversationEdit).toHaveBeenCalledWith({ projectId: 406, id: 500, is_private: false });
    expect(addParticipant).not.toHaveBeenCalled();
    expect(deleteParticipant).not.toHaveBeenCalled();
    expect(changes).toEqual({ isPrivate: false, deletedIds: [], addedParticipants: [], failed: false });
  });

  it('makes a public chat private and adds the picked people', async () => {
    details.current = { author_id: 1, is_private: false, participants: [userParticipant(11, 1, 'Owner')] };
    const result = renderShare();

    await act(async () => {
      await result.current.saveAccess([{ id: 2, name: 'Ann' }]);
    });

    expect(conversationEdit).toHaveBeenCalledWith({ projectId: 406, id: 500, is_private: true });
    expect(addParticipant).toHaveBeenCalledWith({
      projectId: 406,
      id: 500,
      participants: [{ entity_name: 'user', entity_meta: { id: 2 } }],
    });
  });

  it('removes the people taken off the list but never the owner or an agent', async () => {
    details.current = {
      author_id: 1,
      is_private: true,
      participants: [userParticipant(11, 1, 'Owner'), userParticipant(12, 2, 'Ann'), agentParticipant],
    };
    const result = renderShare();

    let changes;
    await act(async () => {
      changes = await result.current.saveAccess([]);
    });

    expect(conversationEdit).not.toHaveBeenCalled();
    expect(addParticipant).not.toHaveBeenCalled();
    expect(deleteParticipant).toHaveBeenCalledTimes(1);
    expect(deleteParticipant).toHaveBeenCalledWith({ projectId: 406, conversationId: 500, id: 12 });
    expect(changes).toEqual({ isPrivate: true, deletedIds: [12], addedParticipants: [], failed: false });
  });

  it('keeps the owner when the server sends the ids as strings', async () => {
    details.current = {
      author_id: '1',
      is_private: true,
      participants: [userParticipant(11, 1, 'Owner'), userParticipant(12, 2, 'Ann')],
    };
    const result = renderShare();

    await act(async () => {
      await result.current.saveAccess([]);
    });

    expect(deleteParticipant).toHaveBeenCalledTimes(1);
    expect(deleteParticipant).toHaveBeenCalledWith({ projectId: 406, conversationId: 500, id: 12 });
  });

  it('reports what was saved when a later call fails', async () => {
    details.current = {
      author_id: 1,
      is_private: false,
      participants: [userParticipant(11, 1, 'Owner')],
    };
    addParticipant.mockReturnValue({ unwrap: () => Promise.reject(new Error('500')) });
    const result = renderShare();

    let changes;
    await act(async () => {
      changes = await result.current.saveAccess([{ id: 2, name: 'Ann' }]);
    });

    expect(changes).toEqual({ isPrivate: true, deletedIds: [], addedParticipants: [], failed: true });
  });

  it('reads the saved list and leaves the owner out of the members', () => {
    details.current = {
      author_id: 1,
      is_private: true,
      participants: [userParticipant(11, 1, 'Owner'), userParticipant(12, 2, 'Ann')],
    };
    const result = renderShare();

    expect(result.current.savedAccess).toEqual([{ id: 2, name: 'Ann', avatar: '' }]);
    expect(result.current.members.map(item => item.id)).toEqual([2, 3]);
    expect(result.current.owner.name).toBe('Owner');
  });

  it('creates a link with the scope the form maps to', async () => {
    details.current = { author_id: 1, is_private: true, participants: [] };
    const result = renderShare();

    await act(async () => {
      await result.current.createLink({
        includeMessages: true,
        includeAttachments: false,
        whichMessages: 'all',
        selectedIds: [],
        expiry: 'never',
        password: '',
      });
    });

    expect(createShareLink).toHaveBeenCalledWith({
      projectId: 406,
      conversationId: 500,
      expiry: 'never',
      scope: 'messages',
    });
  });
});
