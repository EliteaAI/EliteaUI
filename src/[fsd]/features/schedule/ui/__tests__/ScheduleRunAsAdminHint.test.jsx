// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRowActions from '../ScheduleRowActions';
import ScheduleRunsCard from '../ScheduleRunsCard';

// The Run now text for a project admin who is not the schedule owner

const HINT = 'Runs as you, with your credentials. It pauses before sensitive actions.';

const mocks = vi.hoisted(() => ({ userId: 5, isAdmin: true }));

vi.mock('react-redux', () => ({
  useSelector: select => select({ user: { id: mocks.userId } }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({
    checkPermission: permission =>
      permission === 'models.applications.schedules.admin' ? mocks.isAdmin : true,
  }),
}));
vi.mock('../ScheduleRunCard', () => ({ default: () => <li /> }));
vi.mock('../ChangeOwnerDialog', () => ({ default: () => null }));
vi.mock('../RotateSecretDialog', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/lib/hooks/useDeleteConfirmationDisabled.hooks', () => ({
  useDeleteConfirmationDisabled: () => false,
}));

const theme = createTheme(getDesignTokens('light'));
const OTHER_OWNER = { id: 9, name: 'Ann Lee' };
const schedule = (extra = {}) => ({
  id: 7,
  name: 'Nightly digest',
  enabled: true,
  version_id: 4,
  owner: OTHER_OWNER,
  allowed_actions: ['run', 'edit', 'change_owner'],
  ...extra,
});

const renderCard = row =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <ScheduleRunsCard
          schedule={row}
          entityType="agent"
          applicationId={3}
          view={{ runs: [], total: 0, versionNames: {}, expandedRunId: null, onExpand: vi.fn() }}
          onRunNow={vi.fn()}
          onTestRun={vi.fn()}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );

const renderMenu = row =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRowActions row={row} />
    </ThemeProvider>,
  );

describe('Run now text for an admin who is not the owner', () => {
  afterEach(() => {
    cleanup();
    mocks.userId = 5;
    mocks.isAdmin = true;
  });

  it('shows it on the Runs card and in the Run now tooltip', () => {
    renderCard(schedule());

    expect(screen.getByTestId('schedule-run-as-admin-hint')).toHaveTextContent(HINT);
    expect(screen.getByTestId('schedule-run-now')).toHaveAttribute('title', expect.stringContaining(HINT));
  });

  it('shows it as the tooltip of the Run now menu item and keeps the item enabled', () => {
    renderMenu(schedule());
    fireEvent.click(screen.getByTestId('schedule-7-menu-button'));

    expect(screen.getByLabelText(HINT)).toHaveTextContent('Run now');
    expect(screen.getByRole('menuitem', { name: /Run now/ })).not.toHaveAttribute('aria-disabled', 'true');
  });

  it.each([
    ['an admin who owns the schedule', { owner: { id: 5 } }, true],
    ['an owner who is not an admin', {}, false],
    ['an admin without the run right', { allowed_actions: ['edit', 'change_owner'] }, true],
    ['an admin on a webhook', { trigger_kind: 'webhook' }, true],
    ['an admin on a schedule with no known owner', { owner: undefined }, true],
  ])('shows nothing for %s', (_label, extra, isAdmin) => {
    mocks.isAdmin = isAdmin;
    renderCard(schedule(extra));
    expect(screen.queryByTestId('schedule-run-as-admin-hint')).not.toBeInTheDocument();
    cleanup();

    renderMenu(schedule(extra));
    fireEvent.click(screen.getByTestId('schedule-7-menu-button'));
    expect(screen.queryByLabelText(HINT)).not.toBeInTheDocument();
  });

  it('shows nothing on the Create page, where there is no saved schedule', () => {
    renderCard(undefined);
    expect(screen.queryByTestId('schedule-run-as-admin-hint')).not.toBeInTheDocument();
  });
});
