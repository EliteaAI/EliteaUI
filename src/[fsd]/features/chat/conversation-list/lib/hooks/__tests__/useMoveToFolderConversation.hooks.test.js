// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useMoveToFolderConversation } from '../useMoveToFolderConversation.hooks';

const editConversation = vi.hoisted(() => vi.fn());
const invalidateTags = vi.hoisted(() => vi.fn(() => ({ type: 'invalidateTags' })));
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
    util: { invalidateTags },
  },
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 1,
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

describe('useMoveToFolderConversation — invalidateTags on move', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    editConversation.mockResolvedValue({ data: { id: 1 } });
  });

  it('does not invalidate the folders tag when the API call fails', async () => {
    editConversation.mockResolvedValue({ error: 'server error' });
    const { result } = buildHook();
    const conversation = { id: 1, folder_id: null };

    await act(() => result.current.onMoveToFolderConversation(conversation, FOLDER_A));

    expect(invalidateTags).not.toHaveBeenCalled();
  });

  it('invalidates the folders tag after successfully moving a conversation into a folder', async () => {
    const { result } = buildHook();
    const conversation = { id: 1, folder_id: null };

    await act(() => result.current.onMoveToFolderConversation(conversation, FOLDER_A));

    expect(invalidateTags).toHaveBeenCalledWith(['TAG_TYPE_FOLDERS']);
    expect(dispatch).toHaveBeenCalledWith({ type: 'invalidateTags' });
  });

  it('invalidates the folders tag after successfully moving a conversation to ungrouped', async () => {
    const { result } = buildHook();
    const conversation = { id: 1, folder_id: FOLDER_A.id };

    await act(() => result.current.onMoveToFolderConversation(conversation, null));

    expect(invalidateTags).toHaveBeenCalledWith(['TAG_TYPE_FOLDERS']);
    expect(dispatch).toHaveBeenCalledWith({ type: 'invalidateTags' });
  });
});
