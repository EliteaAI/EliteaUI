// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import useCreateConversation from '../useCreateConversation';

const shared = vi.hoisted(() => ({
  createResult: {},
  editResult: {},
  editConversation: null,
}));

vi.mock('react-redux', () => ({ useDispatch: () => vi.fn() }));
vi.mock('@/GA', () => ({ useTrackEvent: () => vi.fn() }));
vi.mock('@/[fsd]/features/chat/conversation-list/lib/helpers', () => ({ sortConversations: list => list }));
vi.mock('@/[fsd]/features/chat/lib/hooks', () => ({
  useConversationNavigation: () => ({ changeUrlByConversation: vi.fn() }),
}));
vi.mock('@/[fsd]/shared/lib/constants', () => ({
  AnalyticConstants: { GA_EVENT_NAMES: {}, GA_EVENT_PARAMS: {} },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/api', () => ({
  useConversationCreateMutation: () => [vi.fn(async () => shared.createResult), { isError: false }],
  useConversationEditMutation: () => [shared.editConversation],
  useSelectConversationMutation: () => [vi.fn(async () => ({})), { isError: false }],
}));
vi.mock('@/common/constants', () => ({ DefaultConversationName: 'New chat', dummyConversation: {} }));
vi.mock('@/common/utils', () => ({ buildErrorMessage: () => 'Folder not found' }));
vi.mock('@/slices/chat', () => ({ actions: { setLastSelectedConversationId: vi.fn() } }));
vi.mock('../useResetCreateFlag', () => ({ default: () => ({ resetCreateFlag: vi.fn() }) }));

const createdConversation = { id: 42, uuid: 'abc', name: 'Good day', participants: [] };

const applyUpdates = (mockFn, initial) =>
  mockFn.mock.calls.reduce(
    (state, [update]) => (typeof update === 'function' ? update(state) : update),
    initial,
  );

const renderCreate = () => {
  const props = {
    activeConversation: {},
    conversations: [],
    setActiveConversation: vi.fn(),
    setConversations: vi.fn(),
    setFolders: vi.fn(),
    emitEnterRoom: () => true,
    emitLeaveRoom: vi.fn(),
    toastError: vi.fn(),
    setActiveParticipant: vi.fn(),
    listenCanvasEditorsChangeEvent: vi.fn(),
    stopListenCanvasEditorsChangeEvent: vi.fn(),
    listenCanvasContentChangeEvent: vi.fn(),
    stopListenCanvasContentChangeEvent: vi.fn(),
  };
  const { result } = renderHook(() => useCreateConversation(props));
  return { create: result.current.onCreateConversation, props };
};

describe('useCreateConversation folder assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shared.createResult = { data: createdConversation };
    shared.editConversation = vi.fn(async () => shared.editResult);
  });

  it('does not assign a folder when none is requested', async () => {
    const { create, props } = renderCreate();
    await act(async () => {
      await create({ id: 'tmp', name: 'New chat', isNew: true });
    });

    expect(shared.editConversation).not.toHaveBeenCalled();
    expect(props.toastError).not.toHaveBeenCalled();
  });

  it('keeps the created chat in the ungrouped list when the folder is rejected', async () => {
    shared.editResult = { error: { status: 404, data: { error: 'Folder not found' } } };
    const { create, props } = renderCreate();
    await act(async () => {
      await create({ id: 'tmp', name: 'New chat', isNew: true }, undefined, false, 17);
    });

    expect(shared.editConversation).toHaveBeenCalledWith({ projectId: 2, id: 42, folder_id: 17 });
    expect(props.toastError).toHaveBeenCalledWith('Folder not found');

    const ungrouped = applyUpdates(props.setConversations, []);
    expect(ungrouped).toEqual([expect.objectContaining({ id: 42, folder_id: null })]);

    const folders = applyUpdates(props.setFolders, [{ id: 17, conversations: [] }]);
    expect(folders[0].conversations).toEqual([]);

    const active = applyUpdates(props.setActiveConversation, {});
    expect(active).toEqual(expect.objectContaining({ id: 42, folder_id: null }));
  });

  it('places the created chat in the folder when assignment succeeds', async () => {
    shared.editResult = { data: {} };
    const { create, props } = renderCreate();
    await act(async () => {
      await create({ id: 'tmp', name: 'New chat', isNew: true }, undefined, false, 17);
    });

    const folders = applyUpdates(props.setFolders, [{ id: 17, conversations: [] }]);
    expect(folders[0].conversations).toEqual([expect.objectContaining({ id: 42, folder_id: 17 })]);
    expect(props.toastError).not.toHaveBeenCalled();
  });
});
