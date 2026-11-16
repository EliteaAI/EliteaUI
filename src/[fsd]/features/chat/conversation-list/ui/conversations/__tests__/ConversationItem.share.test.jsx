// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ConversationItem from '../ConversationItem';

const copyChatLink = vi.hoisted(() => vi.fn());

vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { id: 1 } }) }));
vi.mock('@/[fsd]/features/chat/conversation-list/lib/hooks', () => ({ useCopyChatLink: () => copyChatLink }));
vi.mock('@/[fsd]/features/chat/conversation-list/ui', () => ({
  ConversationRunIndicator: () => null,
  DraggableConversationItem: props => props.children,
}));
vi.mock('@/[fsd]/features/chat/lib/hooks', () => ({
  useConversationRunStatus: () => ({ isRunning: false, unread: null }),
}));
// DotMenu reads useDeleteConfirmationDisabled for its confirmation items
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 406,
  useDeleteConfirmationDisabled: () => false,
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));

const theme = createTheme(getDesignTokens('dark'));

const renderMenu = (conversation, onShare) => {
  render(
    <ThemeProvider theme={theme}>
      <ConversationItem
        conversation={{
          id: 5,
          name: 'Design review',
          is_private: true,
          has_shared_links: true,
          ...conversation,
        }}
        onShare={onShare}
      />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByTestId('conversation-menu-menu-button'));
};

describe('ConversationItem share menu', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('has one Share item in place of the old access and link items', () => {
    renderMenu({ author_id: 1 }, vi.fn());

    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
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

  it('copies the chat link for anyone else', () => {
    const onShare = vi.fn();
    renderMenu({ author_id: 2 }, onShare);

    fireEvent.click(screen.getByTestId('chat-conversation-menu-share-menuitem'));

    expect(onShare).not.toHaveBeenCalled();
    expect(copyChatLink).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5 }),
      'Link copied. Only people with access can open it.',
    );
  });
});
