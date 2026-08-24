// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Box, ThemeProvider, createTheme } from '@mui/material';

import store from '@/[fsd]/shared/config/store';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RunHistoryListItem from '../RunHistoryListItem';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const { copyToClipboard, toastError, toastInfo } = vi.hoisted(() => ({
  copyToClipboard: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock('@/utils/browserUtils', () => ({ copyToClipboard }));

vi.mock('@/routes', async importOriginal => ({
  ...(await importOriginal()),
  getBasename: () => '/app',
}));

vi.mock('@/[fsd]/entities/run-history/api', () => ({
  RunHistoryApi: {
    useDeleteRunHistoryItemMutation: () => [vi.fn(), { isLoading: false }],
  },
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 7 }));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastSuccess: vi.fn(), toastError, toastInfo }),
}));

vi.mock('@/components/DotMenu', () => ({
  default: props => (
    <Box data-testid="dot-menu">
      {props.children.map(menuItem => (
        <Box
          key={menuItem.label}
          data-testid={`menu-item-${menuItem.label}`}
          onClick={menuItem.onClick}
        />
      ))}
    </Box>
  ),
}));

const theme = createTheme({
  palette: {
    background: { userInputBackground: '#eee' },
    split: { pressed: '#ddd' },
    border: { lines: '#ccc' },
    icon: { fill: { error: '#f00', warning: '#fa0', info: '#00f', successModal: '#0f0' } },
  },
});

const CONVERSATION_ROW = { id: 42, created_at: 1786693433, duration: 12 };

const renderItem = (item = CONVERSATION_ROW, props = {}) =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <RunHistoryListItem
          item={item}
          versions={null}
          onItemSelect={vi.fn()}
          {...props}
        />
      </ThemeProvider>
    </Provider>,
  );

const clickShare = async () => {
  screen.getByTestId('menu-item-Share link').click();
  await vi.waitFor(() => expect(copyToClipboard).toHaveBeenCalled());
};

beforeEach(() => {
  vi.clearAllMocks();
  copyToClipboard.mockResolvedValue(true);
  window.history.replaceState({}, '', '/app/toolkits/all/56/index/docs/history');
});

afterEach(() => cleanup());

describe('RunHistoryListItem actions', () => {
  it('copies a project-scoped link that names the run', async () => {
    renderItem();

    await clickShare();

    expect(copyToClipboard).toHaveBeenCalledWith(
      `${window.location.origin}/app/7/toolkits/all/56/index/docs/history?history_run_id=42`,
    );
    expect(toastInfo).toHaveBeenCalledWith('The link has been copied to the clipboard.');
  });

  it('asks for the History tab only where a tab has to be reopened', async () => {
    renderItem(CONVERSATION_ROW, { shareOpensHistoryTab: true });

    await clickShare();

    expect(copyToClipboard).toHaveBeenCalledWith(expect.stringContaining('destTab=History'));
  });

  it('reports a clipboard the browser refused instead of failing silently', async () => {
    copyToClipboard.mockRejectedValue(new Error('Copy command failed'));

    renderItem();

    await clickShare();

    expect(toastError).toHaveBeenCalledWith('Failed to copy the link to the clipboard.');
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it('offers every action on a conversation-backed run', () => {
    renderItem(CONVERSATION_ROW, { handleRestoreConversation: vi.fn(), source: 'toolkit' });

    expect(screen.getByTestId('menu-item-Share link')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-Delete')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-Restore chat')).toBeInTheDocument();
  });

  it('shares a run that has no conversation without offering to delete it', () => {
    renderItem({ ...CONVERSATION_ROW, id: '200_12', hasConversation: false, canShare: true });

    expect(screen.getByTestId('menu-item-Share link')).toBeInTheDocument();
    expect(screen.queryByTestId('menu-item-Delete')).not.toBeInTheDocument();
  });

  it('hides the menu entirely when no action is available', () => {
    renderItem({ ...CONVERSATION_ROW, hasConversation: false });

    expect(screen.queryByTestId('dot-menu')).not.toBeInTheDocument();
  });
});
