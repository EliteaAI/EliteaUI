// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import UsersAccessCollapsed from '../UsersAccessCollapsed';

const access = vi.hoisted(() => ({ current: null }));
const copyChatLink = vi.hoisted(() => vi.fn());
const projectId = vi.hoisted(() => ({ current: 406 }));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { id: 1 } }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => projectId.current }));
vi.mock('@/common/constants', async importOriginal => ({
  ...(await importOriginal()),
  PUBLIC_PROJECT_ID: 1,
}));
vi.mock('../../../lib/hooks/useChatUsersAccess.hooks', () => ({ useChatUsersAccess: () => access.current }));
vi.mock('../../../lib/hooks', () => vi.importActual('../../../lib/hooks/useUsersAccessActions.hooks'));
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

const renderCollapsed = props =>
  render(
    <ThemeProvider theme={theme}>
      <UsersAccessCollapsed
        conversation={conversation}
        {...props}
      />
    </ThemeProvider>,
  );

const openMenu = () => fireEvent.click(screen.getByTestId('chat-users-access-collapsed-button'));

describe('UsersAccessCollapsed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectId.current = 406;
    access.current = {
      kind: 'people',
      label: '3 users',
      count: 3,
      isOwner: true,
      ownerId: 1,
      users: [user(10, 1, 'Me'), user(11, 2, 'Zoe'), user(12, 3, 'Ann')],
      linksCount: 2,
      expiredLinksCount: 0,
    };
  });
  afterEach(() => cleanup());

  it('shows the number of people with access on the badge', () => {
    renderCollapsed();

    expect(screen.getByTestId('chat-users-access-collapsed-badge')).toHaveTextContent('3');
  });

  it('shows a lock instead of a number for Only You', () => {
    access.current = {
      ...access.current,
      kind: 'onlyYou',
      label: 'Only You',
      count: 1,
      users: [user(10, 1, 'Me')],
    };
    renderCollapsed();

    const badge = screen.getByTestId('chat-users-access-collapsed-badge');
    expect(badge.textContent).toBe('');
    expect(badge.querySelector('svg')).toBeInTheDocument();
  });

  it('opens the summary, the people and Share, with Share last', () => {
    renderCollapsed();
    openMenu();

    const dropdown = screen.getByTestId('chat-users-mention-dropdown');
    expect(within(dropdown).getByTestId('chat-users-access-summary')).toHaveTextContent('3 users·2');
    expect(within(dropdown).getByTestId('chat-users-mention-everyone')).toBeInTheDocument();
    expect(
      within(dropdown)
        .getAllByTestId('chat-users-mention-name')
        .map(row => row.textContent),
    ).toEqual(['Ann', 'Zoe']);
    const items = within(dropdown).getAllByRole('menuitem');
    expect(items[items.length - 1]).toHaveAttribute('data-testid', 'chat-users-mention-share');
  });

  it('shows only the summary and Share for Only You', () => {
    access.current = {
      ...access.current,
      kind: 'onlyYou',
      label: 'Only You',
      count: 1,
      users: [user(10, 1, 'Me')],
    };
    renderCollapsed();
    openMenu();

    const dropdown = screen.getByTestId('chat-users-mention-dropdown');
    expect(within(dropdown).getByTestId('chat-users-access-summary')).toHaveTextContent('Only You');
    expect(within(dropdown).queryByTestId('chat-users-mention-empty')).not.toBeInTheDocument();
    expect(within(dropdown).queryByTestId('chat-users-mention-me')).not.toBeInTheDocument();
    expect(within(dropdown).getAllByRole('menuitem')).toHaveLength(1);
    expect(within(dropdown).getByTestId('chat-users-mention-share')).toBeInTheDocument();
  });

  it('opens the Share window for the owner from the Share row', () => {
    renderCollapsed();
    openMenu();
    fireEvent.click(screen.getByTestId('chat-users-mention-share'));

    expect(screen.getByTestId('share-chat-modal')).toBeInTheDocument();
    expect(copyChatLink).not.toHaveBeenCalled();
  });

  it('copies the chat link for anyone else from the Share row', () => {
    access.current = { ...access.current, isOwner: false };
    renderCollapsed();
    openMenu();
    fireEvent.click(screen.getByTestId('chat-users-mention-share'));

    expect(copyChatLink).toHaveBeenCalledWith(conversation, expect.any(String));
    expect(screen.queryByTestId('share-chat-modal')).not.toBeInTheDocument();
  });

  it('copies the chat link for the owner in the Public project', () => {
    projectId.current = 1;
    renderCollapsed();
    openMenu();
    fireEvent.click(screen.getByTestId('chat-users-mention-share'));

    expect(copyChatLink).toHaveBeenCalledWith(conversation, expect.any(String));
    expect(screen.queryByTestId('share-chat-modal')).not.toBeInTheDocument();
  });

  it('mentions a person and closes the list', async () => {
    const onSelectParticipant = vi.fn();
    renderCollapsed({ onSelectParticipant });
    openMenu();
    fireEvent.click(screen.getAllByTestId('chat-users-mention-user')[0]);

    expect(onSelectParticipant).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
    await vi.waitFor(() =>
      expect(screen.queryByTestId('chat-users-mention-dropdown')).not.toBeInTheDocument(),
    );
  });

  it('closes the list on Esc', async () => {
    renderCollapsed();
    openMenu();
    fireEvent.keyDown(document, { key: 'Escape' });

    await vi.waitFor(() =>
      expect(screen.queryByTestId('chat-users-mention-dropdown')).not.toBeInTheDocument(),
    );
  });
});
