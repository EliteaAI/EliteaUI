// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import UsersAccessCard from '../UsersAccessCard';

const access = vi.hoisted(() => ({ current: null }));
const copyChatLink = vi.hoisted(() => vi.fn());

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { id: 1 } }),
}));
const projectId = vi.hoisted(() => ({ current: 406 }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => projectId.current }));
vi.mock('@/common/constants', async importOriginal => ({
  ...(await importOriginal()),
  PUBLIC_PROJECT_ID: 1,
}));
vi.mock('../../../lib/hooks', () => ({ useChatUsersAccess: () => access.current }));
vi.mock('@/[fsd]/features/chat/conversation-list/lib/hooks', () => ({ useCopyChatLink: () => copyChatLink }));
vi.mock('@/[fsd]/features/chat/conversation-list/ui/share', () => ({
  ShareChatModal: () => <div data-testid="share-chat-modal" />,
}));

const theme = createTheme(getDesignTokens('dark'));
const user = (id, userId, name) => ({
  id,
  entity_name: 'user',
  entity_meta: { id: userId },
  meta: { user_name: name },
});
const conversation = { id: 5, name: 'Plan' };

const renderCard = props =>
  render(
    <ThemeProvider theme={theme}>
      <UsersAccessCard
        conversation={conversation}
        {...props}
      />
    </ThemeProvider>,
  );

describe('UsersAccessCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectId.current = 406;
    access.current = {
      kind: 'team',
      label: 'Whole Team (24)',
      isOwner: true,
      ownerId: 1,
      users: [user(10, 1, 'Me'), user(11, 2, 'Zoe'), user(12, 3, 'Ann')],
      linksCount: 2,
      expiredLinksCount: 0,
    };
  });
  afterEach(() => cleanup());

  it('shows who has access and the number of active links', () => {
    renderCard();

    expect(screen.getByTestId('chat-users-access-label')).toHaveTextContent('Whole Team (24)');
    expect(screen.getByTestId('chat-users-access-links')).toHaveTextContent('2');
  });

  it('hides the links part when the chat has no active links', () => {
    access.current = { ...access.current, linksCount: 0 };
    renderCard();

    expect(screen.queryByTestId('chat-users-access-links')).not.toBeInTheDocument();
  });

  it('opens the Share window for the owner', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('chat-users-access-share'));

    expect(screen.getByTestId('share-chat-modal')).toBeInTheDocument();
    expect(copyChatLink).not.toHaveBeenCalled();
  });

  it('copies the chat link for anyone else', () => {
    access.current = { ...access.current, isOwner: false };
    renderCard();
    fireEvent.click(screen.getByTestId('chat-users-access-share'));

    expect(copyChatLink).toHaveBeenCalledWith(conversation, expect.any(String));
    expect(screen.queryByTestId('share-chat-modal')).not.toBeInTheDocument();
  });

  it('copies the chat link for the owner in the Public project', () => {
    projectId.current = 1;
    renderCard();
    fireEvent.click(screen.getByTestId('chat-users-access-share'));

    expect(copyChatLink).toHaveBeenCalledWith(conversation, expect.any(String));
    expect(screen.queryByTestId('share-chat-modal')).not.toBeInTheDocument();
  });

  it('lists Everyone, you, then the other people by name', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('chat-users-access-label'));

    const dropdown = screen.getByTestId('chat-users-mention-dropdown');
    expect(within(dropdown).getByTestId('chat-users-mention-everyone')).toBeInTheDocument();
    expect(within(dropdown).getByTestId('chat-users-mention-me')).toHaveTextContent('Me(You)Owner');
    expect(
      within(dropdown)
        .getAllByTestId('chat-users-mention-name')
        .map(row => row.textContent),
    ).toEqual(['Ann', 'Zoe']);
  });

  it('does not mention you when your row is clicked', () => {
    const onSelectParticipant = vi.fn();
    renderCard({ onSelectParticipant });
    fireEvent.click(screen.getByTestId('chat-users-access-label'));
    fireEvent.click(screen.getByTestId('chat-users-mention-me'));

    expect(onSelectParticipant).not.toHaveBeenCalled();
    expect(screen.getByTestId('chat-users-mention-dropdown')).toBeInTheDocument();
  });

  it("puts the owner first with the Owner badge when the chat is someone else's", () => {
    access.current = { ...access.current, isOwner: false, ownerId: 2 };
    renderCard();
    fireEvent.click(screen.getByTestId('chat-users-access-label'));

    const rows = screen.getAllByTestId('chat-users-mention-user');
    expect(within(rows[0]).getByTestId('chat-users-mention-name')).toHaveTextContent('Zoe');
    expect(within(rows[0]).getByTestId('chat-users-mention-owner')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('chat-users-mention-me')).queryByTestId('chat-users-mention-owner'),
    ).toBeNull();
  });

  it('mentions the picked person and closes the list', () => {
    const onSelectParticipant = vi.fn();
    renderCard({ onSelectParticipant });
    fireEvent.click(screen.getByTestId('chat-users-access-label'));
    fireEvent.click(screen.getAllByTestId('chat-users-mention-user')[0]);

    expect(onSelectParticipant).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
  });

  it('mentions everyone through the Everyone row', () => {
    const onSelectParticipant = vi.fn();
    renderCard({ onSelectParticipant });
    fireEvent.click(screen.getByTestId('chat-users-access-label'));
    fireEvent.click(screen.getByTestId('chat-users-mention-everyone'));

    expect(onSelectParticipant).toHaveBeenCalledWith('All users');
  });

  it('closes the list on Escape', async () => {
    renderCard();
    fireEvent.click(screen.getByTestId('chat-users-access-label'));
    fireEvent.keyDown(document, { key: 'Escape' });

    await vi.waitFor(() =>
      expect(screen.queryByTestId('chat-users-mention-dropdown')).not.toBeInTheDocument(),
    );
  });

  it('leaves Everyone out when only one person besides the owner has access', () => {
    access.current = { ...access.current, users: [user(10, 1, 'Me'), user(11, 2, 'Zoe')] };
    renderCard();
    fireEvent.click(screen.getByTestId('chat-users-access-label'));

    expect(screen.queryByTestId('chat-users-mention-everyone')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-users-mention-name')).toHaveTextContent('Zoe');
  });

  it('counts people besides the owner, not besides the viewer', () => {
    access.current = {
      ...access.current,
      isOwner: false,
      ownerId: 2,
      users: [user(10, 1, 'Me'), user(11, 2, 'Zoe')],
    };
    renderCard();
    fireEvent.click(screen.getByTestId('chat-users-access-label'));

    expect(screen.queryByTestId('chat-users-mention-everyone')).not.toBeInTheDocument();
  });

  it('does not open the list from Only You', () => {
    access.current = { ...access.current, kind: 'onlyYou', label: 'Only You', users: [user(10, 1, 'Me')] };
    renderCard();
    fireEvent.click(screen.getByTestId('chat-users-access-label'));

    expect(screen.queryByTestId('chat-users-mention-dropdown')).not.toBeInTheDocument();
  });
});
