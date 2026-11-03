// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { PERMISSIONS } from '@/common/constants';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import Settings from '../Settings';

const fixture = vi.hoisted(() => ({ permissions: [], platformSettings: {} }));

vi.mock('react-redux', () => ({
  useSelector: select => select({ user: { personal_project_id: 1 } }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));
vi.mock('@/api/platformSettings', () => ({
  useGetPlatformSettingsQuery: () => ({ data: fixture.platformSettings }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: permission => !permission || fixture.permissions.includes(permission) }),
}));
vi.mock('@/[fsd]/features/settings', async () => ({
  SettingsDrawer: (await import('@/[fsd]/features/settings/ui/settings-drawer/SettingsDrawer')).default,
  SettingsLayoutConstants: { SETTINGS_LAYOUT: { DRAWER_WIDTH: '15rem' } },
  SettingsRedirect: () => null,
}));

const renderSettings = platformSettings => {
  fixture.permissions = [PERMISSIONS.governance.bindingsView, PERMISSIONS.governance.credentialsView];
  fixture.platformSettings = platformSettings;
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <MemoryRouter initialEntries={['/settings/project-general']}>
        <Settings />
      </MemoryRouter>
    </ThemeProvider>,
  );
};

describe('Governance in Settings (EL-7269)', () => {
  afterEach(cleanup);

  it('is not there while credential governance is off or audit only, whatever the permissions', () => {
    renderSettings({});
    expect(screen.queryByText('Governance')).toBeNull();
  });

  it("shows for the project's admins while governance is enforced", () => {
    renderSettings({ governance_enforced: true });
    expect(screen.getByText('Governance')).toBeInTheDocument();
  });
});
