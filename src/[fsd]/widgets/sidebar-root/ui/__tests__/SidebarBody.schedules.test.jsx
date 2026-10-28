// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { BREADCRUMB_REGISTRY } from '@/[fsd]/shared/lib/constants/breadcrumb.constants';
import { PERMISSIONS } from '@/common/constants';
import RouteDefinitions from '@/routes';
import { cleanup, render, screen } from '@testing-library/react';

import SidebarBody from '../SidebarBody';

const theme = createTheme({
  palette: {
    border: { subtle: '#ccc' },
    components: { sidebar: { background: '#fff' } },
    icon: {},
    text: {},
  },
});

const fixture = vi.hoisted(() => ({ permissions: [] }));

vi.mock('react-redux', () => ({
  useSelector: select =>
    select({
      settings: { sideBarCollapsed: false, project: { id: 1 } },
      user: { permissions: fixture.permissions, publicPermissions: [], personal_project_id: 1 },
    }),
}));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('@/[fsd]/features/interactive-tours', () => ({ SIDEBAR_TOUR_TARGET_IDS: {} }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useIsMcpVisible: () => true, useSystemSenderName: () => 'x' }));
vi.mock('@/[fsd]/shared/ui', () => ({ BrandLogo: () => null }));
vi.mock('@/[fsd]/widgets/sidebar-root/lib/hooks', () => ({
  useSocketIcon: () => ({ isSocketIconVisible: false, socketStatus: '' }),
}));
vi.mock('@/[fsd]/widgets/support-assistant', () => ({ useGetSupportAssistantConfigQuery: () => ({}) }));
vi.mock('@/hooks/useNavBlocker', () => ({ default: () => ({}) }));
vi.mock('@/[fsd]/widgets/sidebar-root/ui', () => ({
  Buttons: {
    NotificationButton: () => null,
    CreateEntityButton: () => null,
    SettingsButton: () => null,
    AgentHubButton: () => null,
    ResourcesButton: () => null,
  },
  SidebarProjectSelect: () => null,
  SidebarMenuItem: ({ menuTitle, selected }) => (
    <button
      type="button"
      aria-current={selected}
    >
      {menuTitle}
    </button>
  ),
}));

const renderBody = permissions => {
  fixture.permissions = permissions;
  render(
    <ThemeProvider theme={theme}>
      <SidebarBody />
    </ThemeProvider>,
  );
};

const navTitles = () => screen.getAllByRole('button').map(b => b.textContent);

describe('Schedules out of the main navigation', () => {
  afterEach(cleanup);

  it('shows no Schedules item even with the list permission', () => {
    renderBody([PERMISSIONS.schedules.list, PERMISSIONS.pipelines.list, PERMISSIONS.applications.list]);
    expect(navTitles()).toContain('Pipelines');
    expect(screen.queryByText('Schedules')).toBeNull();
  });

  it('declares the Settings routes, their breadcrumb and every schedule permission', () => {
    expect(RouteDefinitions.Schedules).toBe('/settings/schedules');
    expect(RouteDefinitions.CreateSchedule).toBe('/settings/schedules/create');
    expect(BREADCRUMB_REGISTRY[RouteDefinitions.Schedules].label).toBe('Schedules');
    expect(Object.values(PERMISSIONS.schedules).sort((a, b) => a.localeCompare(b))).toEqual(
      ['admin', 'create', 'delete', 'details', 'export', 'import', 'list', 'run', 'update']
        .map(action => `models.applications.schedules.${action}`)
        .sort((a, b) => a.localeCompare(b)),
    );
  });
});
