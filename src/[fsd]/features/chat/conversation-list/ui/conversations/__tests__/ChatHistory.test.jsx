// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const fixture = vi.hoisted(() => ({ data: null, actions: null, itemActions: null }));

vi.mock('react-redux', () => ({
  useSelector: selector =>
    selector({ user: { id: 1 }, settings: { navBlocker: { isEditingCanvas: false } } }),
}));
vi.mock('@/[fsd]/features/chat/conversation-list/lib/hooks', () => ({
  useChatHistoryData: () => fixture.data,
  useChatHistoryActions: () => fixture.actions,
  useChatHistoryItemActions: () => fixture.itemActions,
}));
vi.mock('@/[fsd]/features/chat/conversation-list/ui', () => ({
  ConversationItem: props => (
    <div
      data-testid={`row-${props.conversation.id}`}
      data-active={String(props.isActive)}
      data-chat-page={String(props.showChatPageActions)}
      onClick={() => props.onSelectConversation(props.conversation)}
    />
  ),
  Folders: props =>
    props.folders.map(folder => (
      <div
        key={folder.id}
        data-testid={`folder-${folder.id}`}
        data-new-chat={String(!!props.onCreateConversationInFolder)}
      />
    )),
  PinnedConversations: props => props.pinnedConversations.map(chat => props.renderConversationItem(chat)),
  PinnedGroup: props => (
    <section
      data-testid="pinned-group"
      data-expanded={String(props.isExpanded)}
      onClick={props.onToggle}
    >
      {props.children}
    </section>
  ),
  DroppableGroupedArea: props => props.children,
  GroupedConversations: props =>
    props.dateGroups.map(group => (
      <div
        key={group.name}
        data-testid={`group-${group.name}`}
      >
        {group.conversations.map(chat => props.renderConversationItem(chat))}
      </div>
    )),
}));
vi.mock('@/[fsd]/features/interactive-tours', () => ({ CHAT_TOUR_TARGET_IDS: {} }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useDebounceValue: value => value,
  usePreventDoubleClick: () => run => run(),
  useSelectedProjectId: () => 7,
  useToastHandlers: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}));
vi.mock('@/api', () => ({
  useLazyDateGroupConversationsQuery: () => [vi.fn()],
  useLazyFolderConversationsQuery: () => [vi.fn()],
}));
vi.mock('@/hooks/chat/useDragAndDrop', () => ({ default: () => ({ getDropAreaState: () => ({}) }) }));
// The real utils pull in the redux store
vi.mock('@/common/utils', async () => ({
  filterProps: (await import('@/ComponentsLib/utils/common')).filterProps,
  genConversationId: conversation => `${conversation?.id}_isPlayback_${conversation?.isPlayback}`,
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('@dnd-kit/core', () => ({ DndContext: props => props.children, closestCenter: vi.fn() }));
vi.mock('../../share', () => ({ ShareChatModal: () => null }));
vi.mock('../ExportConversationModal', () => ({ default: () => null }));
vi.mock('../ImportConversationModal', () => ({ default: () => null }));

const { default: ChatHistory } = await import('../ChatHistory');

const theme = createTheme(getDesignTokens('dark'));

const makeData = overrides => ({
  dateGroups: [
    { name: 'today', total: 1, conversations: [{ id: 11, name: 'Release notes' }] },
    { name: 'older', total: 1, conversations: [{ id: 12, name: 'Sprint review' }] },
  ],
  pinnedConversations: [{ id: 1, name: 'Roadmap Q1', isPinned: true }],
  folders: [
    { id: 100, name: 'Product launch', meta: { is_pinned: true }, conversations: [] },
    { id: 200, name: 'Hiring', meta: { is_pinned: false }, conversations: [] },
  ],
  isLoadConversations: false,
  isLoadMoreConversations: false,
  isPinnedExpanded: true,
  dateGroupExpansion: { exitSearchMode: vi.fn() },
  chatPageState: { isMounted: false, selectedConversationId: null, duplicatingConversationId: null },
  ...overrides,
});

const renderHistory = () => {
  const onOpenConversation = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ChatHistory onOpenConversation={onOpenConversation} />
    </ThemeProvider>,
  );
  return onOpenConversation;
};

const isBefore = (first, second) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('ChatHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.data = makeData();
    fixture.actions = {
      setDateGroups: vi.fn(),
      setFolders: vi.fn(),
      setSearchQuery: vi.fn(),
      setIsPinnedExpanded: vi.fn(),
      togglePinnedGroup: vi.fn(),
    };
    fixture.itemActions = { onSelectConversation: vi.fn(), isFolderUpdate: false };
  });
  afterEach(() => cleanup());

  it('puts Pinned (pinned folders, then pinned chats) above the folders and the date groups', () => {
    renderHistory();

    const pinnedGroup = screen.getByTestId('pinned-group');
    expect(pinnedGroup).toContainElement(screen.getByTestId('folder-100'));
    expect(pinnedGroup).toContainElement(screen.getByTestId('row-1'));
    expect(isBefore(screen.getByTestId('folder-100'), screen.getByTestId('row-1'))).toBe(true);

    expect(pinnedGroup).not.toContainElement(screen.getByTestId('folder-200'));
    expect(isBefore(pinnedGroup, screen.getByTestId('folder-200'))).toBe(true);
    expect(isBefore(screen.getByTestId('folder-200'), screen.getByTestId('group-today'))).toBe(true);
    expect(isBefore(screen.getByTestId('group-today'), screen.getByTestId('group-older'))).toBe(true);
  });

  it('folds and unfolds Pinned through the provider', () => {
    renderHistory();

    fireEvent.click(screen.getByTestId('pinned-group'));

    expect(fixture.actions.togglePinnedGroup).toHaveBeenCalledTimes(1);
  });

  it('has no Pinned group when nothing is pinned', () => {
    fixture.data = makeData({
      pinnedConversations: [],
      folders: [{ id: 200, name: 'Hiring', meta: { is_pinned: false }, conversations: [] }],
    });
    renderHistory();

    expect(screen.queryByTestId('pinned-group')).not.toBeInTheDocument();
  });

  it('keeps Pinned for a pinned folder alone', () => {
    fixture.data = makeData({ pinnedConversations: [] });
    renderHistory();

    expect(screen.getByTestId('pinned-group')).toContainElement(screen.getByTestId('folder-100'));
  });

  it('highlights nothing and hides chat page actions away from the chat page', () => {
    renderHistory();

    expect(screen.getByTestId('row-11')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('row-11')).toHaveAttribute('data-chat-page', 'false');
    expect(screen.getByTestId('folder-200')).toHaveAttribute('data-new-chat', 'false');
  });

  it('highlights the open chat and offers chat page actions on the chat page', () => {
    fixture.data = makeData({
      chatPageState: {
        isMounted: true,
        selectedConversationId: '11_isPlayback_undefined',
        duplicatingConversationId: null,
      },
    });
    fixture.itemActions = { ...fixture.itemActions, onCreateConversationInFolder: vi.fn() };
    renderHistory();

    expect(screen.getByTestId('row-11')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('row-12')).toHaveAttribute('data-active', 'false');
    expect(screen.getByTestId('row-11')).toHaveAttribute('data-chat-page', 'true');
    expect(screen.getByTestId('folder-200')).toHaveAttribute('data-new-chat', 'true');
  });

  it('opens a chat through the item actions', () => {
    renderHistory();

    fireEvent.click(screen.getByTestId('row-12'));

    expect(fixture.itemActions.onSelectConversation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 12 }),
    );
  });

  it('shows skeletons while the history loads', () => {
    fixture.data = makeData({ isLoadConversations: true });
    renderHistory();

    expect(screen.queryByTestId('group-today')).not.toBeInTheDocument();
    expect(screen.getByTestId('sidebar-chats-list').children).toHaveLength(8);
  });
});
