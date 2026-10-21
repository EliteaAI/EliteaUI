// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EntityScheduleCard from '../EntityScheduleCard';

// EL-7011 US-35: one schedule card of the editor Schedules section (R2.2, R2.3, R2.6, R5.1 to R5.5)

const mocks = vi.hoisted(() => ({
  actions: { onRun: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onDelete: vi.fn(), isBusy: false },
}));

vi.mock('@/[fsd]/features/schedule/lib/hooks/useScheduleRowActions.hooks', () => ({
  useScheduleRowActions: () => mocks.actions,
}));
vi.mock('@/[fsd]/shared/lib/helpers/schedule.helpers', async importOriginal => ({
  ...(await importOriginal()),
  getBrowserTimezone: () => 'Europe/Kyiv',
  getCronSummaryInBrowserTimezone: (cron, timezone) => `Rule of ${cron} from ${timezone}`,
}));
vi.mock('@/[fsd]/shared/lib/hooks/useDeleteConfirmationDisabled.hooks', () => ({
  useDeleteConfirmationDisabled: () => false,
}));

const theme = createTheme(getDesignTokens('light'));

const ROW = {
  id: 7,
  name: 'Daily digest',
  cron: '0 9 * * *',
  timezone: 'UTC',
  enabled: true,
  last_run: new Date(2026, 9, 19, 9, 0).toISOString(),
  last_run_status: 'success',
  next_run: new Date(2026, 9, 20, 9, 0).toISOString(),
  owner: { id: 3, name: 'Anna K.' },
  allowed_actions: ['run', 'edit', 'pause', 'resume', 'delete', 'change_owner'],
};

const renderCard = (row = {}, props = {}) => {
  const onOpenForm = vi.fn();
  const onOpenRunHistory = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <EntityScheduleCard
        row={{ ...ROW, ...row }}
        entityType="agent"
        currentUserId={3}
        onOpenForm={onOpenForm}
        onOpenRunHistory={onOpenRunHistory}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onOpenForm, onOpenRunHistory };
};

const openMenu = () => fireEvent.click(screen.getByTestId('schedule-7-menu-button'));
const statusChip = (entityType = 'agent') =>
  within(screen.getByTestId(`${entityType}-schedule-card-7`)).queryByTestId('schedule-run-status');
const ruleLine = (entityType = 'agent') => screen.getByTestId(`${entityType}-schedule-card-rule-7`);
const nextLine = (entityType = 'agent') => screen.getByTestId(`${entityType}-schedule-card-next-7`);
const styleText = () => [...document.querySelectorAll('style')].map(style => style.textContent).join('');

describe('EntityScheduleCard EL-7011 US-35', () => {
  beforeEach(() => {
    mocks.actions.isBusy = false;
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('TC-US35-20 R2.2 R2.6 shows the name, the rule line, the next-run line with "You" and the Success chip', () => {
    renderCard();

    const card = screen.getByTestId('agent-schedule-card-7');
    expect(card).toHaveTextContent('Daily digest');
    expect(ruleLine()).toHaveTextContent(/^Rule of 0 9 \* \* \* from UTC · Europe\/Kyiv$/);
    expect(nextLine()).toHaveTextContent(/^Next: 20 Oct, 09:00 · You$/);
    // The chip and the Runs table show the last run (owner bug 2026-10-21)
    expect(card).not.toHaveTextContent('Last run');
    expect(statusChip()).toHaveTextContent('Success');
  });

  it('TC-US35-05 R2.3 shows the owner name on a card of another owner', () => {
    renderCard({}, { currentUserId: 1 });

    expect(nextLine()).toHaveTextContent(/· Anna K\.$/);
  });

  it('owner bug 2026-10-21 shows "Paused" instead of the next run of a disabled schedule', () => {
    renderCard({ enabled: false });

    expect(nextLine()).toHaveTextContent(/^Paused · You$/);
  });

  it('TC-US36-18 TC-US36-19 R2.6 BUG-32 EL-7011 the card is a container with the 30 rem breakpoint and a footer row for the actions', () => {
    renderCard();

    const css = styleText();
    expect(css).toContain('container-type:inline-size');
    expect(css).toContain('@container (min-width: 30rem)');
    expect(css).not.toContain('26rem');
    // Narrow: name, chip, rule and next run each on its own line, then the footer with switch and menu
    const areas = getComputedStyle(screen.getByTestId('agent-schedule-card-7')).gridTemplateAreas;
    expect(areas).toMatch(/footer|actions/);
  });

  it('owner bug 2026-10-21 every line is one line with an ellipsis', () => {
    renderCard();

    [screen.getByText('Daily digest'), ruleLine(), nextLine()].forEach(line =>
      expect(line).toHaveStyle({ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
    );
  });

  it('owner bug 2026-10-21 the card names the schedule and its meta for screen readers', () => {
    renderCard();

    expect(screen.getByRole('group', { name: /^Daily digest/ })).toHaveAccessibleName(
      'Daily digest, Rule of 0 9 * * * from UTC · Europe/Kyiv · Next: 20 Oct, 09:00 · You',
    );
  });

  it('owner bug 2026-10-21 the name shows the full name in a tooltip on keyboard focus', async () => {
    // jsdom has no :focus-visible, so the Tooltip treats the focused element as keyboard-focused
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (selector) {
      return selector === ':focus-visible' ? this === document.activeElement : matches.call(this, selector);
    });
    renderCard({ name: 'Sched Translation of release notes to German' });

    await userEvent.tab();

    expect(screen.getByText('Sched Translation of release notes to German')).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Sched Translation of release notes to German',
    );
    vi.restoreAllMocks();
  });

  it('owner bug 2026-10-21 a meta line shows its full text in a tooltip on hover', async () => {
    renderCard();

    fireEvent.mouseOver(ruleLine());

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Rule of 0 9 * * * from UTC · Europe/Kyiv');
  });

  it('owner bug 2026-10-21 Tab goes name, switch, menu', () => {
    renderCard();

    const card = screen.getByTestId('agent-schedule-card-7');
    const tabStops = [...card.querySelectorAll('[tabindex="0"], input, button')].filter(
      element => element.tabIndex >= 0,
    );
    expect(tabStops.map(element => element.textContent || element.getAttribute('aria-label'))).toEqual([
      'Daily digest',
      'Enable Daily digest',
      'More actions',
    ]);
  });

  it('TC-US35-21 R2.6 shows no chip before the first run and still shows the toggle and the menu', () => {
    renderCard({ last_run: null, last_run_status: null });

    expect(statusChip()).not.toBeInTheDocument();
    expect(ruleLine()).toHaveTextContent('Rule of 0 9 * * * from UTC · Europe/Kyiv');
    expect(nextLine()).toHaveTextContent('Next: 20 Oct, 09:00 · You');
    expect(screen.getByTestId('agent-schedule-card-toggle-7')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-7-menu-button')).toBeInTheDocument();
  });

  it('R2.6 shows the run status chip of the Runs panel: Failed, Waiting for input and Running', () => {
    renderCard({ last_run_status: 'failed' });
    expect(statusChip()).toHaveTextContent('Failed');
    cleanup();

    renderCard({ last_run_status: 'waiting_for_approval' });
    expect(statusChip()).toHaveTextContent('Waiting for input');
    cleanup();

    renderCard({ last_run_status: 'running' });
    expect(statusChip()).toHaveTextContent('Running');
    expect(within(statusChip()).getByRole('progressbar')).toBeInTheDocument();
  });

  it('TC-US35-22 R5.2 the toggle of an enabled schedule pauses it', () => {
    renderCard();

    fireEvent.click(screen.getByRole('switch', { name: 'Enable Daily digest' }));

    expect(mocks.actions.onPause).toHaveBeenCalledTimes(1);
    expect(mocks.actions.onResume).not.toHaveBeenCalled();
  });

  it('TC-US35-23 R5.3 disables the toggle without pause and resume', () => {
    renderCard({ allowed_actions: ['edit'] });

    expect(screen.getByRole('switch', { name: 'Enable Daily digest' })).toBeDisabled();
  });

  it('TC-US35-22 R5.1 the menu lists Run now, Edit, Pause, Open run history and Delete, without Change owner', () => {
    renderCard();
    openMenu();

    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
      'Run now',
      'Edit',
      'Pause',
      'Open run history',
      'Delete',
    ]);
  });

  it('TC-US35-10 TC-US35-22 R3.2 R5.5 Edit opens the form and Open run history opens its Runs section', () => {
    const { onOpenForm, onOpenRunHistory } = renderCard();

    openMenu();
    fireEvent.click(screen.getByText('Edit'));
    openMenu();
    fireEvent.click(screen.getByText('Open run history'));

    expect(onOpenForm.mock.calls).toEqual([[7]]);
    expect(onOpenRunHistory.mock.calls).toEqual([[7]]);
  });

  it('TC-US35-23 R5.4 Delete opens the delete dialog and Cancel keeps the card', () => {
    renderCard();
    openMenu();

    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByTestId('delete-confirm-message')).toHaveTextContent('Daily digest');
    fireEvent.click(screen.getByTestId('delete-confirm-cancel-button'));

    expect(mocks.actions.onDelete).not.toHaveBeenCalled();
    expect(screen.getByTestId('agent-schedule-card-7')).toBeInTheDocument();
  });

  describe('pipeline card (US-36)', () => {
    it('TC-US36-18 R2.4 shows the same lines, chip, toggle and menu with pipeline test ids', () => {
      renderCard({ last_run_status: 'skipped' }, { entityType: 'pipeline', currentUserId: 1 });

      expect(screen.getByTestId('pipeline-schedule-card-7')).toHaveTextContent('Daily digest');
      expect(ruleLine('pipeline')).toHaveTextContent('Rule of 0 9 * * * from UTC · Europe/Kyiv');
      expect(nextLine('pipeline')).toHaveTextContent('Next: 20 Oct, 09:00 · Anna K.');
      expect(statusChip('pipeline')).toHaveTextContent('Skipped');
      expect(screen.getByTestId('pipeline-schedule-card-toggle-7')).toBeInTheDocument();
    });

    it('TC-US36-19 R2.5 the admin menu on another owner card offers only the allowed actions', () => {
      renderCard({ allowed_actions: ['edit', 'pause', 'delete'] }, { entityType: 'pipeline' });
      openMenu();

      expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
        'Edit',
        'Pause',
        'Open run history',
        'Delete',
      ]);
    });

    it('TC-US36-08 R3.3 hides Edit and Open run history without the edit action', () => {
      renderCard({ allowed_actions: ['run', 'delete'] }, { entityType: 'pipeline' });
      openMenu();

      expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual(['Run now', 'Delete']);
    });
  });
});
