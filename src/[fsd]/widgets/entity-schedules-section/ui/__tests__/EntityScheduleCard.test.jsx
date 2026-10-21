// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EntityScheduleCard from '../EntityScheduleCard';

// EL-7011 US-35, US-58: one schedule card of the editor Schedules section (R2.1 to R2.3, R3.3, R5.1 to R5.5)

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
const cardText = (entityType = 'agent') => screen.getByTestId(`${entityType}-schedule-card-7`).textContent;
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

  it('TC-US58-06 R2.1 R2.2 EL-7011 shows the rule title, the zone and the labelled lines with the Success chip', () => {
    renderCard();

    const card = screen.getByTestId('agent-schedule-card-7');
    expect(ruleLine()).toHaveTextContent('Rule of 0 9 * * * from UTC');
    expect(card).toHaveTextContent('Shown: Europe/Kyiv');
    expect(card).toHaveTextContent(/Last run:\s*19 Oct, 09:00/);
    expect(card).toHaveTextContent(/Next run:\s*20 Oct, 09:00/);
    expect(card).toHaveTextContent('Name: Daily digest');
    expect(card).toHaveTextContent('Owner: You');
    expect(statusChip()).toHaveTextContent('Success');
  });

  it('TC-US58-06 R2.3 EL-7011 shows Edit, Delete, the switch and the menu in this order', () => {
    renderCard();

    const card = screen.getByTestId('agent-schedule-card-7');
    const controls = [...card.querySelectorAll('button, input[role="switch"]')].map(
      element => element.getAttribute('aria-label') ?? '',
    );
    expect(controls).toEqual([
      expect.stringMatching(/^Edit/),
      expect.stringMatching(/^Delete/),
      'Enable Daily digest',
      'More actions',
    ]);
  });

  it('TC-US35-05 R2.1 shows the owner name on a card of another owner', () => {
    renderCard({}, { currentUserId: 1 });

    expect(cardText()).toContain('Owner: Anna K.');
  });

  it('TC-US58-06 R2.1 shows "Paused" instead of the next run of a disabled schedule', () => {
    renderCard({ enabled: false });

    expect(cardText()).toMatch(/Next run:\s*Paused/);
    expect(cardText()).not.toContain('20 Oct');
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

  it('TC-US58-06 R2.1 EL-7011 CR-18 leaves out the Owner line when the row has no owner name', () => {
    renderCard({ owner: { id: 99 } });

    expect(cardText()).not.toContain('Owner:');
  });

  it('owner bug 2026-10-21 every line is one line with an ellipsis', () => {
    renderCard();

    [screen.getByText('Daily digest'), ruleLine(), nextLine()].forEach(line =>
      expect(line).toHaveStyle({ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
    );
  });

  it('owner bug 2026-10-21 the name shows the full name in a tooltip on keyboard focus', async () => {
    // jsdom has no :focus-visible, so the Tooltip treats the focused element as keyboard-focused
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (selector) {
      return selector === ':focus-visible' ? this === document.activeElement : matches.call(this, selector);
    });
    renderCard({ name: 'Sched Translation of release notes to German' });
    const name = screen.getByText('Sched Translation of release notes to German');

    // R2.4: every truncating value is a tab stop; the rule, Last run and Next run come before the name
    for (let step = 0; step < 4; step += 1) await userEvent.tab();

    expect(name).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Sched Translation of release notes to German',
    );
    vi.restoreAllMocks();
  });

  it('owner bug 2026-10-21 a meta line shows its full text in a tooltip on hover', async () => {
    renderCard();

    fireEvent.mouseOver(ruleLine());

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Rule of 0 9 * * * from UTC');
  });

  it('TC-US58-08 R2.2 EL-7011 shows "Never run" and no chip before the first run, and still the toggle and the menu', () => {
    renderCard({ last_run: null, last_run_status: null });

    expect(statusChip()).not.toBeInTheDocument();
    expect(cardText()).toMatch(/Last run:\s*Never run/);
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

  it('TC-US58-07 R3.3 EL-7011 the menu lists Run now, Edit, Pause, Open run history and Delete, without Change owner', () => {
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

  it('TC-US58-07 R3.1 R3.2 EL-7011 CR-16 the menu lists Export before Delete with the export permission', () => {
    // useScheduleRowActions gives onExport only with the export permission (CR-16)
    const onExport = vi.fn();
    mocks.actions = { ...mocks.actions, onExport };
    renderCard();
    openMenu();

    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
      'Run now',
      'Edit',
      'Pause',
      'Open run history',
      'Export',
      'Delete',
    ]);
    fireEvent.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalledTimes(1);
    delete mocks.actions.onExport;
  });

  it('TC-US58-10 R2.3 R3.2 EL-7011 hides the Delete icon, Run now, Delete and Export without their keys', () => {
    renderCard({ allowed_actions: ['edit', 'pause'] });

    expect(screen.getByRole('button', { name: /^Edit/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Delete/ })).not.toBeInTheDocument();
    openMenu();
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
      'Edit',
      'Pause',
      'Open run history',
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
      expect(ruleLine('pipeline')).toHaveTextContent('Rule of 0 9 * * * from UTC');
      expect(cardText('pipeline')).toContain('Owner: Anna K.');
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
