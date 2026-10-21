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

describe('EL-7011 R1.1 R1.2 Schedules section gate', () => {
  it('R1.1 shows the Schedules section with the schedules list permission', () => {
    perm.allowed = [PERMISSIONS.schedules.list];
    renderContent();
    expect(screen.getByTestId('schedules-section')).toBeInTheDocument();
  });

  it('EL-7011 owner CR shows Get notified and Allow Run without asking in the Schedules section', () => {
    perm.allowed = [PERMISSIONS.schedules.list];
    renderContent();
    expect(screen.getByTestId('schedule-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-run-without-asking')).toBeInTheDocument();
  });

  it('R1.2 hides the Schedules section without the permission', () => {
    perm.allowed = [];
    renderContent();
    expect(screen.queryByTestId('schedules-section')).not.toBeInTheDocument();
  });
});
