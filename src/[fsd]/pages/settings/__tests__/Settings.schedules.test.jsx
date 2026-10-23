// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { PERMISSIONS } from '@/common/constants';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import Settings from '../Settings';

const fixture = vi.hoisted(() => ({ permissions: [] }));

vi.mock('react-redux', () => ({
  useSelector: select => select({ user: { personal_project_id: 1 } }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));
vi.mock('@/api/platformSettings', () => ({ useGetPlatformSettingsQuery: () => ({ data: {} }) }));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: permission => !permission || fixture.permissions.includes(permission) }),
}));
vi.mock('@/[fsd]/features/settings', async () => ({
  SettingsDrawer: (await import('@/[fsd]/features/settings/ui/settings-drawer/SettingsDrawer')).default,
  SettingsLayoutConstants: { SETTINGS_LAYOUT: { DRAWER_WIDTH: '15rem' } },
  SettingsRedirect: () => null,
}));

const renderSettings = (permissions, pathname = '/settings/project-general') => {
  fixture.permissions = permissions;
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <MemoryRouter initialEntries={[pathname]}>
        <Settings />
      </MemoryRouter>
    </ThemeProvider>,
  );
};

const PROJECT_PERMISSIONS = [PERMISSIONS.schedules.list, PERMISSIONS.projectContext.view];

describe('EL-7011 CR-03 Schedules in Settings', () => {
  afterEach(cleanup);

  it('R1.1 shows Schedules right after Project Context with the list permission', () => {
    renderSettings(PROJECT_PERMISSIONS);
    const labels = screen.getAllByText(/./, { selector: 'span' }).map(node => node.textContent);
    expect(labels.indexOf('Schedules')).toBe(labels.indexOf('Project Context') + 1);
  });

  it('R1.2 hides Schedules without the list permission', () => {
    renderSettings([PERMISSIONS.projectContext.view]);
    expect(screen.queryByText('Schedules')).toBeNull();
  });

  it('R1.3 marks the Schedules tab active on /settings/schedules/create', () => {
    renderSettings(PROJECT_PERMISSIONS, '/settings/schedules/create');
    expect(screen.getByText('Schedules').closest('[aria-current]')).toHaveAttribute('aria-current', 'page');
  });
});
