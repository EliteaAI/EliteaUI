// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useEditConversation } from '../useEditConversation.hooks';

const editConversation = vi.hoisted(() => vi.fn());

vi.mock('@/api', () => ({
  useConversationEditMutation: () => [editConversation],
}));

vi.mock('@/common/utils', () => ({
  areTheSameConversations: (a, b) => !!a && !!b && a.id === b.id && !!a.isPlayback === !!b.isPlayback,
  buildErrorMessage: () => '',
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 2,
}));

vi.mock('@/[fsd]/features/chat/lib/hooks/useConversationNavigation.hooks', () => ({
  useConversationNavigation: () => ({ changeUrlByConversation: vi.fn() }),
}));

const PINNED_ID = 11;
const OTHER_PINNED_ID = 12;

const renderEditHook = () => {
  const setters = {
    setActiveConversation: vi.fn(),
    setConversations: vi.fn(),
    setPinnedConversations: vi.fn(),
    setFolders: vi.fn(),
    toastError: vi.fn(),
  };
  const { result } = renderHook(() => useEditConversation({ activeConversation: { id: 99 }, ...setters }));
  return { onEditConversation: result.current.onEditConversation, setters };
};

const applyUpdater = (setter, prev) => setter.mock.calls[0][0](prev);

describe('useEditConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    editConversation.mockResolvedValue({ data: { updated_at: '2026-10-05T00:00:00Z' } });
  });

  it('makes a pinned conversation public in the pinned list', async () => {
    const { onEditConversation, setters } = renderEditHook();
    const pinned = { id: PINNED_ID, name: 'Pinned', is_private: true, isPinned: true, folder_id: 7 };

    await act(() => onEditConversation({ ...pinned, is_private: false }));

    const nextPinned = applyUpdater(setters.setPinnedConversations, [
      pinned,
      { id: OTHER_PINNED_ID, is_private: true, isPinned: true },
    ]);
    expect(nextPinned[0]).toMatchObject({ id: PINNED_ID, is_private: false, isPinned: true });
    expect(nextPinned[1]).toMatchObject({ id: OTHER_PINNED_ID, is_private: true });
    expect(setters.setConversations).not.toHaveBeenCalled();
    expect(setters.setFolders).not.toHaveBeenCalled();
  });

  it('renames a pinned conversation in the pinned list', async () => {
    const { onEditConversation, setters } = renderEditHook();
    const pinned = { id: PINNED_ID, name: 'Pinned', is_private: true, isPinned: true };

    await act(() => onEditConversation({ ...pinned, name: 'Renamed' }));

    expect(applyUpdater(setters.setPinnedConversations, [pinned])[0]).toMatchObject({
      name: 'Renamed',
      isPinned: true,
    });
    expect(setters.setConversations).not.toHaveBeenCalled();
    expect(setters.setFolders).not.toHaveBeenCalled();
  });

  it('updates an unpinned conversation inside its folder', async () => {
    const { onEditConversation, setters } = renderEditHook();
    const inFolder = { id: 31, name: 'In folder', is_private: true, folder_id: 7 };

    await act(() => onEditConversation({ ...inFolder, is_private: false }));

    const nextFolders = applyUpdater(setters.setFolders, [{ id: 7, conversations: [inFolder] }]);
    expect(nextFolders[0].conversations[0]).toMatchObject({ is_private: false });
    expect(setters.setPinnedConversations).not.toHaveBeenCalled();
    expect(setters.setConversations).not.toHaveBeenCalled();
  });

  it('keeps updating unpinned conversations in the date groups', async () => {
    const { onEditConversation, setters } = renderEditHook();
    const unpinned = { id: 21, name: 'Plain', is_private: true };

    await act(() => onEditConversation({ ...unpinned, is_private: false }));

    expect(applyUpdater(setters.setConversations, [unpinned])[0]).toMatchObject({ is_private: false });
    expect(setters.setPinnedConversations).not.toHaveBeenCalled();
  });
});
