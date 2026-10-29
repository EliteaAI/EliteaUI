// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { PERMISSIONS } from '@/common/constants';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ProjectGeneralContent from '../../ProjectGeneralContent';

const perm = vi.hoisted(() => ({ allowed: [] }));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: key => perm.allowed.includes(key) }),
}));
vi.mock('@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader', () => ({ default: () => null }));
vi.mock('@/[fsd]/features/settings/ui/project-general/DefaultModulesSettings', () => ({
  default: () => null,
}));
vi.mock('@/[fsd]/features/settings/ui/project-general/WebSearchSettings', () => ({ default: () => null }));
vi.mock('@/[fsd]/features/settings/ui/project-general/backup-restore', () => ({
  ProjectBackupRestore: () => null,
}));
vi.mock('@/[fsd]/features/settings/ui/project-general/general', () => ({ ProjectParamsHeader: () => null }));
vi.mock('@/[fsd]/features/settings/ui/project-general/delete-project-data', () => ({
  ProjectDataDelete: () => null,
}));
vi.mock('@/[fsd]/features/settings/lib/hooks', () => ({ useCanDeleteProjectData: () => false }));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectName: () => 'Project',
}));
vi.mock('@/[fsd]/features/settings/ui/project-general/project-ai-configurations', () => ({
  ProjectAIConfigurations: () => null,
}));
vi.mock('../../chat-configuration', () => ({ ChatConfigurationSection: () => null }));
vi.mock('../../../shared/SettingsFormProvider', () => ({ default: () => null }));
vi.mock('../index', () => ({
  ScheduleNotificationsSection: () => <div data-testid="schedule-notifications" />,
  RunWithoutAskingSetting: () => <div data-testid="schedule-run-without-asking" />,
}));

const theme = createTheme({ palette: lightPalette });
const renderContent = () =>
  render(
    <ThemeProvider theme={theme}>
      <ProjectGeneralContent />
    </ThemeProvider>,
  );

afterEach(cleanup);

describe('Schedules section gate', () => {
  it('shows the Schedules section with the schedules list permission', () => {
    perm.allowed = [PERMISSIONS.schedules.list];
    renderContent();
    expect(screen.getByTestId('schedules-section')).toBeInTheDocument();
  });

  it('shows Get notified and Allow Run without asking in the Schedules section', () => {
    perm.allowed = [PERMISSIONS.schedules.list];
    renderContent();
    expect(screen.getByTestId('schedule-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-run-without-asking')).toBeInTheDocument();
  });

  it('hides the Schedules section without the permission', () => {
    perm.allowed = [];
    renderContent();
    expect(screen.queryByTestId('schedules-section')).not.toBeInTheDocument();
  });
});
