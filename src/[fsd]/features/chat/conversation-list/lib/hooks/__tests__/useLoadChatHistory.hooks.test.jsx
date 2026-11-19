// @vitest-environment jsdom
import { useState } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

const fixture = vi.hoisted(() => ({ projectId: 7, query: {} }));
const foldersListQuery = vi.hoisted(() => vi.fn());

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => fixture.projectId }));
vi.mock('@/api', () => ({ useFoldersListQuery: (...args) => foldersListQuery(...args) }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@/common/constants', () => ({ PERMISSIONS: { chat: { folders: { get: 'folders.get' } } } }));
vi.mock('@/common/utils', () => ({
  buildErrorMessage: error => error.message,
  stableSort: (items, comparator) => [...items].sort(comparator),
}));

const { useLoadChatHistory } = await import('../useLoadChatHistory.hooks');

const chat = (id, updatedAt) => ({ id, name: `Chat ${id}`, updated_at: updatedAt });

const responseData = (todayChats, total) => ({
  folders: [{ id: 50, name: 'Docs', conversations: [chat(20, '2026-11-01')] }],
  pinned: { conversations: [chat(1, '2026-11-19')] },
  date_groups: [{ name: 'today', total, conversations: todayChats }],
  selected_conversation_id: 3,
});

const response = (todayChats, total = 30) => {
  const data = responseData(todayChats, total);
  return { data, currentData: data, isSuccess: true, isError: false, isLoading: false, isFetching: false };
};

const renderLoad = (toastError, initialProps = {}) =>
  renderHook(
    (props = {}) => {
      const { searchQuery } = props;
      const [dateGroups, setDateGroups] = useState([]);
      const [folders, setFolders] = useState([]);
      const [pinnedConversations, setPinnedConversations] = useState([]);
      const result = useLoadChatHistory({
        setDateGroups,
        setFolders,
        setPinnedConversations,
        searchQuery,
        toastError,
      });
      return { ...result, dateGroups, folders, pinnedConversations, setDateGroups };
    },
    { initialProps },
  );

describe('useLoadChatHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.projectId = 7;
  });
  afterEach(() => cleanup());

  it('splits the response into date groups, folders and pinned chats', () => {
    foldersListQuery.mockReturnValue(response([chat(1, '2026-11-19'), chat(2, '2026-11-18')]));

    const { result } = renderLoad(vi.fn());

    expect(result.current.pinnedConversations).toEqual([{ ...chat(1, '2026-11-19'), isPinned: true }]);
    // A pinned chat is not repeated in its date group
    expect(result.current.dateGroups[0].conversations.map(c => c.id)).toEqual([2]);
    expect(result.current.folders[0].conversations.map(c => c.id)).toEqual([20]);
    expect(result.current.isConversationsLoaded).toBe(true);
    expect(result.current.serverSelectedConversationId).toBe(3);
  });

  it('asks for the chats newest first, whatever sort the page URL carries', () => {
    foldersListQuery.mockReturnValue(response([]));

    renderLoad(vi.fn());

    expect(foldersListQuery).toHaveBeenCalledWith(
      { projectId: 7, params: { sort_by: 'updated_at', sort_order: 'desc' } },
      { skip: false },
    );
  });

  it('keeps the scrolled pages when the same list is refetched', () => {
    foldersListQuery.mockReturnValue(response([chat(2, '2026-11-18')]));
    const { result, rerender } = renderLoad(vi.fn());

    act(() => {
      result.current.setDateGroups(prev => [
        { ...prev[0], conversations: [...prev[0].conversations, chat(5, '2026-11-10')], offset: 2 },
      ]);
    });

    foldersListQuery.mockReturnValue(response([chat(4, '2026-11-19T10:00'), chat(2, '2026-11-18')]));
    rerender();

    expect(result.current.dateGroups[0].conversations.map(c => c.id)).toEqual([4, 2, 5]);
  });

  it('does not mix the previous list into the results of a new search', () => {
    foldersListQuery.mockReturnValue(response([chat(2, '2026-11-18')]));
    const { result, rerender } = renderLoad(vi.fn(), { searchQuery: undefined });

    act(() => {
      result.current.setDateGroups(prev => [
        { ...prev[0], conversations: [...prev[0].conversations, chat(5, '2026-11-10')], offset: 2 },
      ]);
    });

    // While the search loads, RTK still returns the previous args' data, but no currentData
    const staleData = foldersListQuery.mock.results.at(-1).value.data;
    foldersListQuery.mockReturnValue({
      ...response([]),
      data: staleData,
      currentData: undefined,
      isFetching: true,
    });
    rerender({ searchQuery: 'report' });

    foldersListQuery.mockReturnValue(response([chat(30, '2026-11-19T10:00')], 25));
    rerender({ searchQuery: 'report' });

    expect(result.current.dateGroups[0].conversations.map(c => c.id)).toEqual([30]);
  });

  it('replaces the lists for another project', () => {
    foldersListQuery.mockReturnValue(response([chat(2, '2026-11-18')]));
    const { result, rerender } = renderLoad(vi.fn());

    act(() => {
      result.current.setDateGroups(prev => [
        { ...prev[0], conversations: [...prev[0].conversations, chat(5, '2026-11-10')] },
      ]);
    });

    fixture.projectId = 8;
    foldersListQuery.mockReturnValue(response([chat(9, '2026-11-18')]));
    rerender();

    expect(result.current.dateGroups[0].conversations.map(c => c.id)).toEqual([9]);
  });

  it('clears the lists and shows the error when loading fails', () => {
    foldersListQuery.mockReturnValue(response([chat(2, '2026-11-18')]));
    const toastError = vi.fn();
    const { result, rerender } = renderLoad(toastError);

    foldersListQuery.mockReturnValue({
      isSuccess: false,
      isError: true,
      error: { message: 'Boom' },
      isLoading: false,
      isFetching: false,
    });
    rerender();

    expect(toastError).toHaveBeenCalledWith('Boom');
    expect(result.current.dateGroups).toEqual([]);
    expect(result.current.folders).toEqual([]);
    expect(result.current.pinnedConversations).toEqual([]);
  });
});
