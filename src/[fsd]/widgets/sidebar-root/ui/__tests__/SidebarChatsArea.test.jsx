// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const fixture = vi.hoisted(() => ({ canSeeChats: true, navigate: vi.fn(), navigateToPage: vi.fn() }));

vi.mock('@/[fsd]/features/chat/conversation-list/ui', () => ({
  ChatHistory: props => (
    <button
      type="button"
      data-testid="chat-history"
      onClick={() => props.onOpenConversation({ id: 12 })}
    />
  ),
}));
vi.mock('@/[fsd]/features/interactive-tours', () => ({
  SIDEBAR_TOUR_TARGET_IDS: { chats: 'sidebar-chats' },
}));
vi.mock('@/[fsd]/widgets/sidebar-root/lib/hooks', () => ({
  useSidebarNavigation: () => ({ navigateToPage: fixture.navigateToPage }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => fixture.canSeeChats }),
}));
vi.mock('@/routes', () => ({ default: { Chat: '/chat' } }));
vi.mock('@/common/constants', () => ({ PERMISSIONS: { chat: { folders: { get: 'folders.get' } } } }));

const { default: SidebarChatsArea } = await import('../SidebarChatsArea');

describe('SidebarChatsArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.canSeeChats = true;
    fixture.navigateToPage.mockReturnValue(fixture.navigate);
  });
  afterEach(() => cleanup());

  it('shows the chat history in the menu', () => {
    render(<SidebarChatsArea />);

    expect(screen.getByRole('region', { name: 'Chats' })).toHaveAttribute('data-tour', 'sidebar-chats');
    expect(screen.getByTestId('chat-history')).toBeInTheDocument();
  });

  it('opens a chat through the guarded menu navigation', () => {
    render(<SidebarChatsArea />);

    fireEvent.click(screen.getByTestId('chat-history'));

    expect(fixture.navigateToPage).toHaveBeenCalledWith('/chat/12', 'Chat');
    expect(fixture.navigate).toHaveBeenCalled();
  });

  it('keeps the area (so the bottom row stays down) but no history without the permission', () => {
    fixture.canSeeChats = false;
    render(<SidebarChatsArea />);

    expect(screen.getByTestId('sidebar-chats-area')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-history')).not.toBeInTheDocument();
  });
});
