// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { PERMISSIONS } from '@/common/constants';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import SidebarBody from '../SidebarBody';

const fixture = vi.hoisted(() => ({ collapsed: false, permissions: [], pathname: '/chat' }));

vi.mock('react-redux', () => ({
  useSelector: select =>
    select({
      settings: { sideBarCollapsed: fixture.collapsed },
      user: { permissions: fixture.permissions },
    }),
}));
vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: fixture.pathname }) }));
vi.mock('@/[fsd]/features/interactive-tours', () => ({ SIDEBAR_TOUR_TARGET_IDS: {} }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSystemSenderName: () => 'x' }));
vi.mock('@/[fsd]/shared/ui', () => ({ BrandLogo: () => null }));
vi.mock('@/[fsd]/widgets/sidebar-root/lib/hooks', () => ({
  useSocketIcon: () => ({ isSocketIconVisible: false, socketStatus: '' }),
  useSidebarNavigation: () => ({ navigateToPage: () => () => {}, getLinkTarget: path => path }),
}));
vi.mock('@/[fsd]/widgets/support-assistant', () => ({ useGetSupportAssistantConfigQuery: () => ({}) }));
vi.mock('@/[fsd]/widgets/sidebar-root/ui', () => ({
  Buttons: {
    NotificationButton: () => <div data-testid="block">bell</div>,
    NewChatButton: () => <div data-testid="block">new-chat</div>,
  },
  SidebarProjectSelect: () => <div data-testid="block">project</div>,
  SidebarMenuItem: ({ menuTitle, selected }) => (
    <div
      data-testid="block"
      data-selected={selected}
    >
      {menuTitle}
    </div>
  ),
  ExploreMenu: () => <div data-testid="block">explore</div>,
  SidebarChatsArea: () => <div data-testid="block">chats</div>,
  SidebarFooterRow: ({ onToggleAssistant }) => (
    <div data-testid="block">{onToggleAssistant ? 'footer+bot' : 'footer'}</div>
  ),
}));

const theme = createTheme(getDesignTokens('dark'));

const renderBody = ({
  collapsed = false,
  permissions = [PERMISSIONS.artifacts.view],
  pathname = '/chat',
} = {}) => {
  Object.assign(fixture, { collapsed, permissions, pathname });
  render(
    <ThemeProvider theme={theme}>
      <SidebarBody onToggleAssistant={vi.fn()} />
    </ThemeProvider>,
  );
  return screen.getAllByTestId('block').map(block => block.textContent);
};

describe('SidebarBody', () => {
  afterEach(cleanup);

  it('lays out the open menu top to bottom', () => {
    expect(renderBody()).toEqual([
      'bell',
      'project',
      'new-chat',
      'Artifacts',
      'explore',
      'chats',
      'footer+bot',
    ]);
  });

  it('has no Chats, entity, Catalog or create-split items', () => {
    const blocks = renderBody();
    ['Chats', 'Agents', 'Pipelines', 'Catalog', 'Create'].forEach(title =>
      expect(blocks).not.toContain(title),
    );
  });

  it('folds into the rail without the bell and the chat history', () => {
    expect(renderBody({ collapsed: true })).toEqual([
      'project',
      'new-chat',
      'Artifacts',
      'explore',
      'footer+bot',
    ]);
  });

  it('hides Artifacts without its permission and selects it on its page', () => {
    expect(renderBody({ permissions: [] })).not.toContain('Artifacts');
    cleanup();
    renderBody({ pathname: '/artifacts/bucket' });
    expect(screen.getByText('Artifacts')).toHaveAttribute('data-selected', 'true');
  });
});
