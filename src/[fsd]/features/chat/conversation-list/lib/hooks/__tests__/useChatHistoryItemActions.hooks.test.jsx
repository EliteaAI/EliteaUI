// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

const spies = vi.hoisted(() => ({
  deleteArgs: null,
  onDeleteConversation: vi.fn(),
  onEditConversation: vi.fn(),
  onPinConversation: vi.fn(),
  onCreateFolder: vi.fn(),
  useOpenImportedConversation: vi.fn(),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 7 }));
vi.mock('@/hooks/chat/useDeleteConversation', () => ({
  default: args => {
    spies.deleteArgs = args;
    return { onDeleteConversation: spies.onDeleteConversation };
  },
}));
vi.mock('@/hooks/chat/useEditFolder', () => ({
  default: () => ({ onEditFolder: vi.fn(), onPinFolder: vi.fn() }),
}));
vi.mock('@/hooks/chat/useReorderFolders', () => ({
  default: () => ({ onReorderFolders: vi.fn(), isFolderUpdate: false }),
}));
vi.mock('@/[fsd]/features/chat/lib/hooks', () => ({
  useEditConversation: () => ({ onEditConversation: spies.onEditConversation }),
}));
vi.mock('../usePinConversation.hooks', () => ({
  usePinConversation: () => ({ onPinConversation: spies.onPinConversation }),
}));
vi.mock('../useOpenImportedConversation.hooks', () => ({
  useOpenImportedConversation: args => {
    spies.useOpenImportedConversation(args);
    return { onImportedConversation: vi.fn() };
  },
}));
vi.mock('../useCreateFolder.hooks', () => ({
  useCreateFolder: () => ({ onCreateFolder: spies.onCreateFolder, onCancelCreateFolder: vi.fn() }),
}));
vi.mock('../useDeleteFolder.hooks', () => ({ useDeleteFolder: () => ({ onDeleteFolder: vi.fn() }) }));
vi.mock('../useMoveToFolderConversation.hooks', () => ({
  useMoveToFolderConversation: () => ({
    onMoveToFolderConversation: vi.fn(),
    onMoveToNewFolderConversation: vi.fn(),
    moveTargetConversationToNewFolder: vi.fn(),
    cancelMovingTargetConversationToNewFolder: vi.fn(),
  }),
}));

const { DefaultFolderName, dummyConversation, dummyFolder } = await import('@/common/constants');
const { ChatHistoryActionsContext, ChatHistoryDataContext } = await import('../../context');
const { useChatHistoryItemActions } = await import('../useChatHistoryItemActions.hooks');

const makeActions = () => ({
  setDateGroups: vi.fn(),
  setConversations: vi.fn(),
  setPinnedConversations: vi.fn(),
  setFolders: vi.fn(),
  setActiveFolder: vi.fn(),
  chatPageActionsRef: { current: null },
});

const renderActions = (actions, onOpenConversation = vi.fn()) => {
  const data = { dateGroups: [{ name: 'today', conversations: [{ id: 1 }] }], folders: [], activeFolder: {} };
  const wrapper = ({ children }) => (
    <ChatHistoryActionsContext.Provider value={actions}>
      <ChatHistoryDataContext.Provider value={data}>{children}</ChatHistoryDataContext.Provider>
    </ChatHistoryActionsContext.Provider>
  );
  return renderHook(() => useChatHistoryItemActions({ onOpenConversation, toastError: vi.fn() }), {
    wrapper,
  });
};

describe('useChatHistoryItemActions', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('opens a chat through the menu navigation when the chat page is closed', () => {
    const onOpenConversation = vi.fn();
    const { result } = renderActions(makeActions(), onOpenConversation);

    result.current.onSelectConversation({ id: 3 });

    expect(onOpenConversation).toHaveBeenCalledWith({ id: 3 });
  });

  it('deletes away from the chat page with no open chat, so it never redirects', () => {
    const { result } = renderActions(makeActions());

    result.current.onDeleteConversation({ id: 3 });

    expect(spies.onDeleteConversation).toHaveBeenCalledWith({ id: 3 });
    expect(spies.deleteArgs.activeConversation).toBe(dummyConversation);
    expect(spies.deleteArgs.onSelectConversation()).toBeUndefined();
  });

  it('runs the chat page handlers while the page is open', () => {
    const actions = makeActions();
    const onSelectConversation = vi.fn();
    const onDeleteConversation = vi.fn();
    actions.chatPageActionsRef.current = { onSelectConversation, onDeleteConversation };
    const onOpenConversation = vi.fn();
    const { result } = renderActions(actions, onOpenConversation);

    result.current.onSelectConversation({ id: 3 });
    result.current.onDeleteConversation({ id: 4 });
    // Not registered by the page: the menu's own version runs
    result.current.onPinConversation({ id: 5 }, true);

    expect(onSelectConversation).toHaveBeenCalledWith({ id: 3 });
    expect(onOpenConversation).not.toHaveBeenCalled();
    expect(onDeleteConversation).toHaveBeenCalledWith({ id: 4 });
    expect(spies.onDeleteConversation).not.toHaveBeenCalled();
    expect(spies.onPinConversation).toHaveBeenCalledWith({ id: 5 }, true);
  });

  it('opens an imported chat through the menu navigation', () => {
    const onOpenConversation = vi.fn();
    renderActions(makeActions(), onOpenConversation);

    expect(spies.useOpenImportedConversation).toHaveBeenCalledWith(
      expect.objectContaining({ onSelectConversation: onOpenConversation }),
    );
  });

  it('cancels a new folder without touching the page URL', () => {
    const actions = makeActions();
    const { result } = renderActions(actions);

    result.current.onCancelCreateFolder({ id: 'tmp' });

    const removeFolder = actions.setFolders.mock.calls[0][0];
    expect(removeFolder([{ id: 'tmp' }, { id: 2 }])).toEqual([{ id: 2 }]);
    expect(actions.setActiveFolder).toHaveBeenCalledWith(dummyFolder);
  });

  it('marks the chat public in every list after the Share window saves', () => {
    const actions = makeActions();
    const { result } = renderActions(actions);

    result.current.onRestrictAccessSuccess(3, { isPrivate: false });

    const updateList = actions.setConversations.mock.calls[0][0];
    expect(updateList([{ id: 3, is_private: true }])).toEqual([{ id: 3, is_private: false }]);
    expect(actions.setPinnedConversations).toHaveBeenCalledWith(updateList);
    expect(actions.setFolders).toHaveBeenCalled();
  });

  it('adds a new folder row only once', () => {
    const actions = makeActions();
    const { result } = renderActions(actions);

    result.current.onClickCreateNewFolder();

    expect(actions.setActiveFolder).toHaveBeenCalledWith(
      expect.objectContaining({ name: DefaultFolderName, isNew: true }),
    );
    const addFolder = actions.setFolders.mock.calls[0][0];
    expect(addFolder([{ id: 2 }])).toHaveLength(2);
  });
});
