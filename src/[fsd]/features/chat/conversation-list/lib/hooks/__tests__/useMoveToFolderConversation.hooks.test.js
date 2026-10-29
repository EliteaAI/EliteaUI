// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useMoveToFolderConversation } from '../useMoveToFolderConversation.hooks';

const editConversation = vi.hoisted(() => vi.fn());
const updateQueryData = vi.hoisted(() => vi.fn(() => ({ type: 'updateQueryData' })));
const dispatch = vi.hoisted(() => vi.fn());

vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
}));

vi.mock('@/api', () => ({
  useConversationEditMutation: () => [editConversation, {}],
  useFolderCreateMutation: () => [vi.fn(), {}],
}));

vi.mock('@/api/eliteaApi', () => ({
  eliteaApi: {
    util: { updateQueryData },
  },
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 1,
  useSortQueryParamsFromUrl: () => ({ sort_by: 'updated_at', sort_order: 'desc' }),
}));

vi.mock('@/[fsd]/features/chat/conversation-list/lib/helpers', () => ({
  sortConversations: arr => arr,
}));

vi.mock('@/common/constants.js', () => ({
  DefaultFolderName: 'New Folder',
  dummyConversation: {},
}));

vi.mock('@/common/utils', () => ({
  buildErrorMessage: () => '',
}));

const FOLDER_A = { id: 10, name: 'Folder A', conversations: [] };
const FOLDER_B = { id: 20, name: 'Folder B', conversations: [] };

const buildHook = (overrides = {}) => {
  const props = {
    setFolders: vi.fn(),
    setActiveFolder: vi.fn(),
    setConversations: vi.fn(),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
    conversations: [],
    folders: [FOLDER_A, FOLDER_B],
    ...overrides,
  };
  const { result } = renderHook(() => useMoveToFolderConversation(props));
  return { result, props };
};

describe('useMoveToFolderConversation — patchFoldersCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    editConversation.mockResolvedValue({ data: { id: 1 } });
  });

  it('does not patch the cache when the API call fails', async () => {
    editConversation.mockResolvedValue({ error: 'server error' });
    const { result } = buildHook();
    const conversation = { id: 1, folder_id: null };

    await act(() => result.current.onMoveToFolderConversation(conversation, FOLDER_A));

    expect(updateQueryData).not.toHaveBeenCalled();
  });

  it('patches the cache after successfully moving a conversation into a folder', async () => {
    const { result } = buildHook();
    const conversation = { id: 1, folder_id: null };

    await act(() => result.current.onMoveToFolderConversation(conversation, FOLDER_A));

    expect(updateQueryData).toHaveBeenCalledWith(
      'foldersList',
      { projectId: 1, params: { sort_by: 'updated_at', sort_order: 'desc' } },
      expect.any(Function),
    );
    expect(dispatch).toHaveBeenCalledWith({ type: 'updateQueryData' });
  });

  it('patches the cache after successfully moving a conversation out of a folder to ungrouped', async () => {
    const { result } = buildHook();
    const conversation = { id: 1, folder_id: FOLDER_A.id };

    await act(() => result.current.onMoveToFolderConversation(conversation, null));

    expect(updateQueryData).toHaveBeenCalledWith(
      'foldersList',
      { projectId: 1, params: { sort_by: 'updated_at', sort_order: 'desc' } },
      expect.any(Function),
    );
    expect(dispatch).toHaveBeenCalled();
  });

  it('cache recipe removes conversation from source folder and adds to target folder', async () => {
    const conversation = { id: 5, folder_id: FOLDER_A.id, name: 'Chat 5' };
    const { result } = buildHook();

    await act(() => result.current.onMoveToFolderConversation(conversation, FOLDER_B));

    const recipe = updateQueryData.mock.calls[0][2];
    const draft = {
      folders: [
        { id: FOLDER_A.id, conversations: [conversation] },
        { id: FOLDER_B.id, conversations: [] },
      ],
    };
    recipe(draft);

    const folderA = draft.folders.find(f => f.id === FOLDER_A.id);
    const folderB = draft.folders.find(f => f.id === FOLDER_B.id);
    expect(folderA.conversations).toHaveLength(0);
    expect(folderB.conversations).toHaveLength(1);
    expect(folderB.conversations[0]).toMatchObject({ id: 5, folder_id: FOLDER_B.id });
  });

  it('cache recipe removes conversation from source folder when moving to ungrouped', async () => {
    const conversation = { id: 5, folder_id: FOLDER_A.id, name: 'Chat 5' };
    const { result } = buildHook();

    await act(() => result.current.onMoveToFolderConversation(conversation, null));

    const recipe = updateQueryData.mock.calls[0][2];
    const draft = {
      folders: [{ id: FOLDER_A.id, conversations: [conversation] }],
    };
    recipe(draft);

    expect(draft.folders[0].conversations).toHaveLength(0);
  });

  it('cache recipe does not add a duplicate if conversation already exists in target folder', async () => {
    const conversation = { id: 5, folder_id: FOLDER_A.id, name: 'Chat 5' };
    const { result } = buildHook();

    await act(() => result.current.onMoveToFolderConversation(conversation, FOLDER_B));

    const recipe = updateQueryData.mock.calls[0][2];
    const draft = {
      folders: [
        { id: FOLDER_A.id, conversations: [conversation] },
        { id: FOLDER_B.id, conversations: [{ ...conversation, folder_id: FOLDER_B.id }] },
      ],
    };
    recipe(draft);

    const folderB = draft.folders.find(f => f.id === FOLDER_B.id);
    expect(folderB.conversations).toHaveLength(1);
  });

  it('cache recipe is a no-op when draft has no folders', async () => {
    const { result } = buildHook();
    const conversation = { id: 1, folder_id: null };

    await act(() => result.current.onMoveToFolderConversation(conversation, FOLDER_A));

    const recipe = updateQueryData.mock.calls[0][2];
    const draft = {};
    expect(() => recipe(draft)).not.toThrow();
  });
});
