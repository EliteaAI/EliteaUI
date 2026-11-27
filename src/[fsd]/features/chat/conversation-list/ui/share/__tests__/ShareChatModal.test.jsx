// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import ShareChatModal from '../ShareChatModal';

const saveAccess = vi.hoisted(() => vi.fn());
const savedAccess = vi.hoisted(() => ({ current: [] }));

const rights = vi.hoisted(() => ({ canShareExternally: true }));
vi.mock('@/[fsd]/features/chat/lib/hooks', () => ({ useChatRights: () => rights }));
vi.mock('@/[fsd]/features/chat/conversation-list/lib/hooks', () => ({
  useCopyChatLink: () => vi.fn(),
  useCopyToClipboard: () => vi.fn(),
  useShareChatMessages: () => ({
    messages: [],
    total: 0,
    isFetching: false,
    isLoaded: true,
    onLoadMore: vi.fn(),
  }),
  useShareChat: () => ({
    mode: 'owner',
    projectId: 406,
    chatName: 'New chat',
    isReady: true,
    owner: { id: 1, name: 'Owner', avatar: '' },
    members: [],
    membersTotal: 3,
    membersFetched: 0,
    membersQueryTotal: 0,
    isMembersFetching: false,
    onLoadMoreMembers: vi.fn(),
    savedAccess: savedAccess.current,
    links: [],
    isLinksFetching: false,
    isLinksLoaded: false,
    isLinksError: false,
    refetchLinks: vi.fn(),
    isCreatingLink: false,
    filesTotal: 0,
    isFilesLoaded: false,
    authorNames: {},
    saveAccess,
    createLink: vi.fn(),
    revokeLink: vi.fn(),
  }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
}));
vi.mock('../ShareTeamTab', () => ({
  default: props => (
    <button
      type="button"
      data-testid="team-tab-remove-all"
      onClick={() => props.onChangeList([])}
    />
  ),
}));

const theme = createTheme(getDesignTokens('dark'));
const ann = { id: 2, name: 'Ann', avatar: '' };

const renderModal = props =>
  render(
    <ThemeProvider theme={theme}>
      <ShareChatModal
        conversation={{ id: 'new-chat', isNew: true }}
        onClose={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ShareChatModal for a chat not sent yet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedAccess.current = [ann];
  });
  afterEach(() => cleanup());

  it('disables Externally and Copy link and shows Done instead of Save', () => {
    renderModal({ isDraft: true });

    expect(screen.getByTestId('share-tab-externally')).toBeDisabled();
    expect(screen.getByTestId('share-copy-link')).toBeDisabled();
    expect(screen.getByTestId('share-done')).toBeDisabled();
    expect(screen.queryByTestId('share-save')).not.toBeInTheDocument();
  });

  it('hands the edited list to Done, closes and saves nothing', () => {
    const onDone = vi.fn();
    const onClose = vi.fn();
    renderModal({ isDraft: true, onDone, onClose });

    fireEvent.click(screen.getByTestId('team-tab-remove-all'));
    fireEvent.click(screen.getByTestId('share-done'));

    expect(onDone).toHaveBeenCalledWith([]);
    expect(onClose).toHaveBeenCalled();
    expect(saveAccess).not.toHaveBeenCalled();
  });

  it('keeps Save and an enabled Externally for a saved chat', () => {
    renderModal({ conversation: { id: 500 } });

    expect(screen.getByTestId('share-tab-externally')).not.toBeDisabled();
    expect(screen.getByTestId('share-copy-link')).not.toBeDisabled();
    expect(screen.getByTestId('share-save')).toBeInTheDocument();
    expect(screen.queryByTestId('share-done')).not.toBeInTheDocument();
  });
});

describe('ShareChatModal without external sharing (#7757)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedAccess.current = [ann];
    rights.canShareExternally = false;
  });
  afterEach(() => {
    cleanup();
    rights.canShareExternally = true;
  });

  it('shows the Team content without the tabs', () => {
    renderModal({ conversation: { id: 500 } });

    expect(screen.queryByTestId('share-tab-externally')).not.toBeInTheDocument();
    expect(screen.queryByTestId('share-tab-team')).not.toBeInTheDocument();
    expect(screen.getByTestId('share-save')).toBeInTheDocument();
  });
});

describe('ShareChatModal for a manager who removes themselves (#7757)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedAccess.current = [ann];
  });
  afterEach(() => cleanup());

  it('closes after Save, since there is nothing left to manage', async () => {
    saveAccess.mockResolvedValue({ failed: false, isSelfRemoved: true, isPrivate: true, deletedIds: [13] });
    const onClose = vi.fn();
    const onAccessSaved = vi.fn();
    renderModal({ conversation: { id: 500 }, onClose, onAccessSaved });

    fireEvent.click(screen.getByTestId('team-tab-remove-all'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('share-save'));
    });

    expect(onAccessSaved).toHaveBeenCalledWith(500, expect.objectContaining({ isSelfRemoved: true }));
    expect(onClose).toHaveBeenCalled();
  });

  it('stays open after a usual Save', async () => {
    saveAccess.mockResolvedValue({ failed: false, isSelfRemoved: false, isPrivate: true, deletedIds: [12] });
    const onClose = vi.fn();
    renderModal({ conversation: { id: 500 }, onClose });

    fireEvent.click(screen.getByTestId('team-tab-remove-all'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('share-save'));
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
