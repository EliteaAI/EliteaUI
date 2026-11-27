// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ConversationItem from '../ConversationItem';

const MANAGE_SHARED = 'models.chat.conversations.manage_shared';
const TEAM_PROJECT = 406;
const PERSONAL_PROJECT = 7;

const copyChatLink = vi.hoisted(() => vi.fn());
const access = vi.hoisted(() => ({ projectId: 406, manageShared: false }));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { id: 1, personal_project_id: 7 } }),
}));
vi.mock('@/[fsd]/features/chat/conversation-list/lib/hooks', () => ({ useCopyChatLink: () => copyChatLink }));
vi.mock('@/[fsd]/features/chat/conversation-list/ui', () => ({
  ConversationRunIndicator: () => null,
  DraggableConversationItem: props => (
    <div
      data-testid="draggable"
      data-drag-disabled={String(!!props.isDragDisabled)}
    >
      {props.children}
    </div>
  ),
}));
vi.mock('@/[fsd]/features/chat/lib/hooks', async () => {
  const { useChatRights } = await vi.importActual('@/[fsd]/features/chat/lib/hooks/useChatRights.hooks');
  return {
    useChatRights,
    useConversationRunStatus: () => ({ isRunning: false, unread: null }),
  };
});
// DotMenu reads useDeleteConfirmationDisabled for its confirmation items
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => access.projectId,
  useDeleteConfirmationDisabled: () => false,
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({
    checkPermission: permission => (permission === MANAGE_SHARED ? access.manageShared : true),
  }),
}));

const theme = createTheme(getDesignTokens('dark'));

const renderItem = (conversation, props = {}) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <ConversationItem
          conversation={{
            id: 5,
            name: 'Design review',
            is_private: true,
            has_shared_links: true,
            ...conversation,
          }}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );

const renderMenu = (conversation, onShare, props = {}) => {
  renderItem(conversation, { onShare, ...props });
  fireEvent.click(screen.getByTestId('conversation-menu-menu-button'));
};

const menuLabels = () => screen.getAllByRole('menuitem').map(item => item.textContent);

const isDisabled = label =>
  screen
    .getAllByRole('menuitem')
    .find(item => item.textContent === label)
    .getAttribute('aria-disabled') === 'true';

const setExternalSharing = enabled => {
  globalThis.elitea_ui_config = { chat_sharing: { external_enabled: enabled } };
};

describe('ConversationItem share menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    access.projectId = TEAM_PROJECT;
    access.manageShared = false;
    delete globalThis.elitea_ui_config;
  });
  afterEach(() => cleanup());

  it('has one Share item in place of the old access and link items', () => {
    renderMenu({ author_id: 1 }, vi.fn());

    expect(menuLabels()).toEqual([
      'Rename',
      'Move to',
      'Playback',
      'Duplicate',
      'Export',
      'Share',
      'Pin on top',
      'Delete',
    ]);
  });

  it('opens the Share Chat window for the owner', () => {
    const onShare = vi.fn();
    renderMenu({ author_id: 1 }, onShare);

    fireEvent.click(screen.getByTestId('chat-conversation-menu-share-menuitem'));

    expect(onShare).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }));
    expect(copyChatLink).not.toHaveBeenCalled();
  });

  it('opens the Share Chat window for a manager the chat is shared with', () => {
    access.manageShared = true;
    const onShare = vi.fn();
    renderMenu({ author_id: 2 }, onShare);

    fireEvent.click(screen.getByTestId('chat-conversation-menu-share-menuitem'));

    expect(onShare).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }));
  });

  it('copies the chat link for an invited viewer', () => {
    const onShare = vi.fn();
    renderMenu({ author_id: 2 }, onShare);

    fireEvent.click(screen.getByTestId('chat-conversation-menu-share-menuitem'));

    expect(onShare).not.toHaveBeenCalled();
    expect(copyChatLink).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5 }),
      'Link copied. Only people with access can open it.',
    );
  });

  it('hides Share in a private project when external sharing is off', () => {
    access.projectId = PERSONAL_PROJECT;
    setExternalSharing(false);
    renderMenu({ author_id: 1 }, vi.fn());

    expect(menuLabels()).not.toContain('Share');
  });

  it('keeps Share in a private project while external sharing is on', () => {
    access.projectId = PERSONAL_PROJECT;
    setExternalSharing(true);
    renderMenu({ author_id: 1 }, vi.fn());

    expect(menuLabels()).toContain('Share');
  });
});

describe('ConversationItem actions by role (#7757)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    access.projectId = TEAM_PROJECT;
    access.manageShared = false;
  });
  afterEach(() => cleanup());

  it('lets an invited viewer pin and play back, nothing that changes the chat', () => {
    renderMenu({ author_id: 2 }, vi.fn(), { showChatPageActions: true });

    expect(isDisabled('Pin on top')).toBe(false);
    expect(isDisabled('Playback')).toBe(false);
    ['Rename', 'Move to', 'Duplicate', 'Export', 'Delete'].forEach(label =>
      expect(isDisabled(label)).toBe(true),
    );
  });

  it('lets a manager rename, duplicate and export, but not move or delete', () => {
    access.manageShared = true;
    renderMenu({ author_id: 2 }, vi.fn());

    ['Rename', 'Duplicate', 'Export'].forEach(label => expect(isDisabled(label)).toBe(false));
    ['Move to', 'Delete'].forEach(label => expect(isDisabled(label)).toBe(true));
  });

  it('keeps drag-and-drop to folders for the owner only', () => {
    access.manageShared = true;
    renderItem({ author_id: 2 }, { enableDragAndDrop: true });
    expect(screen.getByTestId('draggable')).toHaveAttribute('data-drag-disabled', 'true');
    cleanup();

    renderItem({ author_id: 1 }, { enableDragAndDrop: true });
    expect(screen.getByTestId('draggable')).toHaveAttribute('data-drag-disabled', 'false');
  });
});

describe('ConversationItem open in new tab', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('renders the row as a link to the chat so the browser can open it in a new tab', () => {
    renderItem({});

    expect(screen.getByTestId('chat-conversation-item-5')).toHaveAttribute(
      'href',
      '/chat/5?name=Design+review',
    );
  });

  it('selects the chat on a plain click and leaves a modified click to the browser', () => {
    const onSelectConversation = vi.fn();
    renderItem({}, { onSelectConversation });
    const row = screen.getByTestId('chat-conversation-item-5');

    fireEvent.click(row, { ctrlKey: true });
    expect(onSelectConversation).not.toHaveBeenCalled();

    fireEvent.click(row);
    expect(onSelectConversation).toHaveBeenCalledTimes(1);
  });

  it('does not follow the row link when the menu button is clicked', () => {
    renderItem({});

    // fireEvent returns false when the click's default action (following the href) was prevented
    expect(fireEvent.click(screen.getByTestId('conversation-menu-menu-button'))).toBe(false);
  });

  it('is not a link for a playback, which has no page of its own', () => {
    renderItem({ isPlayback: true });

    expect(screen.getByTestId('chat-conversation-item-5')).not.toHaveAttribute('href');
  });
});
