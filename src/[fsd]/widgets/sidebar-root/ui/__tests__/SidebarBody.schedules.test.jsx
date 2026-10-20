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

const fixture = vi.hoisted(() => ({ permissions: [], pathname: '/' }));

vi.mock('react-redux', () => ({
  useSelector: select =>
    select({
      settings: { sideBarCollapsed: false, project: { id: 1 } },
      user: { permissions: fixture.permissions, publicPermissions: [], personal_project_id: 1 },
    }),
}));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: fixture.pathname }),
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

const renderBody = (permissions, pathname = '/') => {
  fixture.permissions = permissions;
  fixture.pathname = pathname;
  render(
    <ThemeProvider theme={theme}>
      <SidebarBody />
    </ThemeProvider>,
  );
};

const navTitles = () => screen.getAllByRole('button').map(b => b.textContent);

describe('EL-7011 R1 Schedules navigation', () => {
  afterEach(cleanup);

  it('R1.1 shows Schedules right after Pipelines with the list permission', () => {
    renderBody([PERMISSIONS.schedules.list, PERMISSIONS.pipelines.list, PERMISSIONS.applications.list]);
    const titles = navTitles();
    expect(titles.indexOf('Schedules')).toBe(titles.indexOf('Pipelines') + 1);
  });

  it('R1.2 hides Schedules without the list permission', () => {
    renderBody([PERMISSIONS.pipelines.list]);
    expect(screen.queryByText('Schedules')).toBeNull();
  });

  it('R1.3 marks Schedules active for every path under /schedules', () => {
    renderBody([PERMISSIONS.schedules.list], '/schedules/create');
    expect(screen.getByText('Schedules').getAttribute('aria-current')).toBe('true');
  });

  it('R1.3 declares the route, its breadcrumb and every schedule permission', () => {
    expect(RouteDefinitions.Schedules).toBe('/schedules');
    expect(BREADCRUMB_REGISTRY[RouteDefinitions.Schedules].label).toBe('Schedules');
    expect(Object.values(PERMISSIONS.schedules).sort()).toEqual(
      ['admin', 'create', 'delete', 'details', 'export', 'import', 'list', 'run', 'update']
        .map(action => `models.applications.schedules.${action}`)
        .sort(),
    );
  });
});
