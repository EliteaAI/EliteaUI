// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ChatHistoryHeader from '../ChatHistoryHeader';

const permissions = vi.hoisted(() => ({ granted: new Set() }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 7 }));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: permission => permissions.granted.has(permission) }),
}));

const { PERMISSIONS } = await import('@/common/constants');

const theme = createTheme(getDesignTokens('dark'));

const renderHeader = (props = {}) => {
  const handlers = {
    onSearchActivate: vi.fn(),
    onSearchChange: vi.fn(),
    onSearchClear: vi.fn(),
    onCreateFolder: vi.fn(),
    onImport: vi.fn(),
  };
  render(
    <ThemeProvider theme={theme}>
      <ChatHistoryHeader
        isSearchActive={false}
        searchQuery=""
        {...handlers}
        {...props}
      />
    </ThemeProvider>,
  );
  return handlers;
};

describe('ChatHistoryHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissions.granted = new Set([PERMISSIONS.chat.folders.create, PERMISSIONS.chat.create]);
  });
  afterEach(() => cleanup());

  it('shows Chats with three icon buttons that have accessible names', () => {
    renderHeader();

    expect(screen.getByText('Chats')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search chats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create folder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import chat' })).toBeInTheDocument();
  });

  it('runs the header actions', () => {
    const handlers = renderHeader();

    fireEvent.click(screen.getByRole('button', { name: 'Search chats' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create folder' }));
    fireEvent.click(screen.getByRole('button', { name: 'Import chat' }));

    expect(handlers.onSearchActivate).toHaveBeenCalledTimes(1);
    expect(handlers.onCreateFolder).toHaveBeenCalledTimes(1);
    expect(handlers.onImport).toHaveBeenCalledTimes(1);
  });

  it('disables Create folder and Import without the permissions', () => {
    permissions.granted = new Set();
    renderHeader();

    expect(screen.getByRole('button', { name: 'Create folder' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Import chat' })).toBeDisabled();
  });

  it('shows the search field while search is open and closes it', () => {
    const handlers = renderHeader({ isSearchActive: true, searchQuery: 'road' });

    expect(screen.getByDisplayValue('road')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close search' }));

    expect(handlers.onSearchClear).toHaveBeenCalledTimes(1);
  });

  it('hides the search field while search is closed', () => {
    renderHeader();

    expect(screen.queryByTestId('conversation-search-input')).not.toBeInTheDocument();
  });
});
