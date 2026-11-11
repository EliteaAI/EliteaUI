// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import EntityScheduleCard from '../EntityScheduleCard';

// the schedule card in the Schedules section of a toolkit index

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

vi.mock('@/[fsd]/features/schedule/lib/hooks/useScheduleRowActions.hooks', () => ({
  useScheduleRowActions: () => ({
    onRun: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onDelete: vi.fn(),
    isBusy: false,
  }),
}));
vi.mock('@/[fsd]/features/schedule/lib/hooks/useRunAsAdminHint.hooks', () => ({
  useRunAsAdminHint: () => null,
}));
// Only the viewer's zone is pinned; the rule text comes from the real cron summary
vi.mock('@/[fsd]/shared/lib/helpers/schedule.helpers', async importOriginal => ({
  ...(await importOriginal()),
  getBrowserTimezone: () => 'Europe/Kyiv',
}));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastInfo: vi.fn(), toastError: vi.fn() }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useDeleteConfirmationDisabled.hooks', () => ({
  useDeleteConfirmationDisabled: () => false,
}));
vi.mock('@/[fsd]/features/owner-consent', () => ({ ScheduleMandateConsent: () => null }));
vi.mock('@/[fsd]/features/project-governance', () => ({ GovernanceReadinessCard: () => null }));

const theme = createTheme(getDesignTokens('light'));

const ROW = {
  id: 7,
  name: 'Nightly refresh',
  cron: '0 6 * * *',
  timezone: 'Europe/Kyiv',
  enabled: true,
  last_run: new Date(2026, 9, 19, 6, 0).toISOString(),
  last_run_status: 'success',
  next_run: new Date(2026, 9, 20, 6, 0).toISOString(),
  owner: { id: 3, name: 'Anna K.' },
  allowed_actions: ['run', 'edit', 'pause', 'resume', 'delete'],
};

const renderCard = (row = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <EntityScheduleCard
        row={{ ...ROW, ...row }}
        entityType="toolkit_index"
        currentUserId={3}
        onOpenForm={vi.fn()}
        onOpenRunHistory={vi.fn()}
      />
    </ThemeProvider>,
  );

describe('EntityScheduleCard for a toolkit index', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the time and the zone, the name, the last run with its status and the next run', () => {
    renderCard();

    const card = screen.getByTestId('toolkit_index-schedule-card-7');
    expect(screen.getByTestId('toolkit_index-schedule-card-rule-7')).toHaveTextContent(/^At 06:00/);
    expect(screen.getByTestId('toolkit_index-schedule-card-timezone-7')).toHaveTextContent('· Europe/Kyiv');
    expect(card).toHaveTextContent('Nightly refresh');
    expect(card).toHaveTextContent(/Last run:\s*19.10.2026/);
    expect(within(card).getByTestId('schedule-run-status')).toHaveTextContent('Success');
    expect(screen.getByTestId('toolkit_index-schedule-card-next-7')).toHaveTextContent('20.10.2026');
    expect(card).toHaveTextContent('Next run:');
  });

  it('shows the toggle on and the Active label for an enabled schedule', () => {
    renderCard();

    expect(within(screen.getByTestId('toolkit_index-schedule-card-7')).getByRole('switch')).toBeChecked();
    expect(screen.getByTestId('toolkit_index-schedule-card-state-7')).toHaveTextContent('Active');
  });

  it('shows the toggle off and the Paused label for a paused schedule', () => {
    renderCard({ enabled: false });

    expect(within(screen.getByTestId('toolkit_index-schedule-card-7')).getByRole('switch')).not.toBeChecked();
    expect(screen.getByTestId('toolkit_index-schedule-card-state-7')).toHaveTextContent('Paused');
  });

  it('says Never run before the first run', () => {
    renderCard({ last_run: null, last_run_status: null });

    expect(screen.getByTestId('toolkit_index-schedule-card-7')).toHaveTextContent(/Last run:\s*Never run/);
  });
});
