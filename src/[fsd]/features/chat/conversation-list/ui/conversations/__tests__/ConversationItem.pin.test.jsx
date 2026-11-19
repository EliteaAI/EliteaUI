// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ConversationItem from '../ConversationItem';

vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: { id: 1 } }) }));
vi.mock('@/[fsd]/features/chat/conversation-list/lib/hooks', () => ({ useCopyChatLink: () => vi.fn() }));
vi.mock('@/[fsd]/features/chat/conversation-list/ui', () => ({
  ConversationRunIndicator: () => null,
  DraggableConversationItem: props => props.children,
}));
vi.mock('@/[fsd]/features/chat/lib/hooks', () => ({
  useConversationRunStatus: () => ({ isRunning: false, unread: null }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 406,
  useDeleteConfirmationDisabled: () => false,
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));

const theme = createTheme(getDesignTokens('dark'));

const renderItem = (conversation, props = {}) => {
  const handlers = { onPin: vi.fn(), onSelectConversation: vi.fn() };
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <ConversationItem
          conversation={{ id: 5, name: 'Roadmap Q1', is_private: true, author_id: 1, ...conversation }}
          {...handlers}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );
  return handlers;
};

const menuLabels = () => {
  fireEvent.click(screen.getByTestId('conversation-menu-menu-button'));
  return screen.getAllByRole('menuitem').map(item => item.textContent);
};

describe('ConversationItem pin and chat page actions', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('unpins a pinned chat from its pin without opening it', () => {
    const { onPin, onSelectConversation } = renderItem({ isPinned: true });

    // The row is a link: false means the click did not follow it
    expect(fireEvent.click(screen.getByRole('button', { name: 'Unpin chat' }))).toBe(false);
    expect(onPin).toHaveBeenCalledWith(expect.objectContaining({ id: 5 }), false);
    expect(onSelectConversation).not.toHaveBeenCalled();
  });

  it('has no pin button on a chat that is not pinned', () => {
    renderItem({ isPinned: false });

    expect(screen.queryByRole('button', { name: 'Unpin chat' })).not.toBeInTheDocument();
  });

  it('offers Playback and Duplicate on the chat page', () => {
    renderItem();

    expect(menuLabels()).toEqual(expect.arrayContaining(['Playback', 'Duplicate']));
  });

  it('leaves Playback and Duplicate out away from the chat page', () => {
    renderItem({}, { showChatPageActions: false });

    expect(menuLabels()).toEqual(['Rename', 'Move to', 'Export', 'Share', 'Pin on top', 'Delete']);
  });
});
