// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EntityScheduleCard from '../EntityScheduleCard';

// one schedule card of the editor Schedules section

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const mocks = vi.hoisted(() => ({
  actions: { onRun: vi.fn(), onPause: vi.fn(), onResume: vi.fn(), onDelete: vi.fn(), isBusy: false },
}));

vi.mock('@/[fsd]/features/schedule/lib/hooks/useRunAsAdminHint.hooks', () => ({
  useRunAsAdminHint: () => null,
}));
vi.mock('@/[fsd]/features/schedule/lib/hooks/useScheduleRowActions.hooks', () => ({
  useScheduleRowActions: () => mocks.actions,
}));
vi.mock('@/[fsd]/shared/lib/helpers/schedule.helpers', async importOriginal => ({
  ...(await importOriginal()),
  getBrowserTimezone: () => 'Europe/Kyiv',
  getCronSummaryInBrowserTimezone: (cron, timezone) => `Rule of ${cron} from ${timezone}`,
}));
// The URL Copy of a webhook card toasts; the test renders no toast provider
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastInfo: vi.fn(), toastError: vi.fn() }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useDeleteConfirmationDisabled.hooks', () => ({
  useDeleteConfirmationDisabled: () => false,
}));
// the owner's mandate consent line has its own tests: here only what the card hands it
vi.mock('@/[fsd]/features/owner-consent', () => ({
  ScheduleMandateConsent: props => (
    <span data-testid="schedule-mandate-consent-stub">{`${props.versionId}:${props.isOwner}`}</span>
  ),
}));

// the governance readiness card has its own tests: here only who sees it; it renders nothing unless something is missing
const readiness = vi.hoisted(() => ({ shown: false }));
vi.mock('@/[fsd]/features/project-governance', () => ({
  GovernanceReadinessCard: props =>
    readiness.shown ? (
      <span data-testid="schedule-readiness-stub">{`${props.entityKind}:${props.entityId}`}</span>
    ) : null,
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

describe('EntityScheduleCard', () => {
  beforeEach(() => {
    mocks.actions.isBusy = false;
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the rule, the zone, the name, the last and next run with the Success chip', () => {
    renderCard();

    const card = screen.getByTestId('agent-schedule-card-7');
    expect(ruleLine()).toHaveTextContent('Rule of 0 9 * * * from UTC');
    expect(screen.getByTestId('agent-schedule-card-timezone-7')).toHaveTextContent('· Europe/Kyiv');
    expect(card).toHaveTextContent('Daily digest');
    expect(card).toHaveTextContent(/Last run:\s*19.10.2026/);
    expect(card).toHaveTextContent(/Next run:\s*20.10.2026/);
    expect(statusChip()).toHaveTextContent('Success');
  });

  it('shows the switch with its Active label and the menu, and no Edit or Delete button', () => {
    renderCard();

    const card = screen.getByTestId('agent-schedule-card-7');
    const controls = [...card.querySelectorAll('button, input[role="switch"]')].map(
      element => element.getAttribute('aria-label') ?? '',
    );
    expect(controls).toEqual(['Enable Daily digest', 'More actions']);
    expect(screen.getByTestId('agent-schedule-card-state-7')).toHaveTextContent('Active');
  });

  it('hands the consent line its version and whether the viewer owns the schedule', () => {
    renderCard({ version_id: 70 });
    expect(screen.getByTestId('schedule-mandate-consent-stub')).toHaveTextContent('70:true');
    cleanup();
    renderCard({ version_id: 70, owner: { id: 4, name: 'Bo' } });
    expect(screen.getByTestId('schedule-mandate-consent-stub')).toHaveTextContent('70:false');
  });

  it('shows the readiness card to the owner only, and only when it has something to show', () => {
    readiness.shown = false;
    renderCard();
    expect(screen.queryByTestId('schedule-readiness-stub')).toBeNull();
    cleanup();
    readiness.shown = true;
    renderCard();
    expect(screen.getByTestId('schedule-readiness-stub')).toHaveTextContent('schedule:7');
    cleanup();
    renderCard({}, { currentUserId: 1 });
    expect(screen.queryByTestId('schedule-readiness-stub')).toBeNull();
    readiness.shown = false;
  });

  it('shows no owner on the card, whoever owns the schedule', () => {
    renderCard({}, {});

    expect(cardText()).not.toContain('Owner');
    expect(cardText()).not.toContain('Anna K.');
  });

  it('shows "Not scheduled" and the Paused label for a disabled schedule', () => {
    renderCard({ enabled: false });

    expect(cardText()).toMatch(/Next run:\s*Not scheduled/);
    expect(cardText()).not.toContain('20.10.2026');
    expect(screen.getByTestId('agent-schedule-card-state-7')).toHaveTextContent('Paused');
  });

  it('opens the details page when the card is clicked', () => {
    const { onOpenForm } = renderCard();

    fireEvent.click(screen.getByTestId('agent-schedule-card-7'));

    expect(onOpenForm.mock.calls).toEqual([[7]]);
  });

  it('does not open the details page on a click inside the consent line or the readiness card', () => {
    readiness.shown = true;
    const { onOpenForm } = renderCard();

    fireEvent.click(screen.getByTestId('schedule-mandate-consent-stub'));
    fireEvent.click(screen.getByTestId('schedule-readiness-stub'));

    expect(onOpenForm).not.toHaveBeenCalled();
    readiness.shown = false;
  });

  it('opens the details page from the keyboard on the rule line', () => {
    const { onOpenForm } = renderCard();

    fireEvent.keyDown(ruleLine(), { key: 'Enter' });

    expect(onOpenForm.mock.calls).toEqual([[7]]);
  });

  it('does not open the details page from the switch or the menu', () => {
    const { onOpenForm } = renderCard();

    fireEvent.click(screen.getByRole('switch', { name: 'Enable Daily digest' }));
    openMenu();

    expect(onOpenForm).not.toHaveBeenCalled();
  });

  it('does not open the details page of a card without the edit action', () => {
    const { onOpenForm } = renderCard({ allowed_actions: ['run'] });

    fireEvent.click(screen.getByTestId('agent-schedule-card-7'));

    expect(onOpenForm).not.toHaveBeenCalled();
  });

  it('every line is one line with an ellipsis', () => {
    renderCard();

    [screen.getByText('Daily digest'), ruleLine(), nextLine()].forEach(line =>
      expect(line).toHaveStyle({ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
    );
  });

  it('the name shows the full name in a tooltip on keyboard focus', async () => {
    // jsdom has no :focus-visible, so the Tooltip treats the focused element as keyboard-focused
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (selector) {
      return selector === ':focus-visible' ? this === document.activeElement : matches.call(this, selector);
    });
    renderCard({ name: 'Sched Translation of release notes to German' });
    const name = screen.getByText('Sched Translation of release notes to German');

    // every truncating value is a tab stop; the rule comes before the name
    for (let step = 0; step < 2; step += 1) await userEvent.tab();

    expect(name).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Sched Translation of release notes to German',
    );
    vi.restoreAllMocks();
  });

  it('a meta line shows its full text in a tooltip on hover', async () => {
    renderCard();

    fireEvent.mouseOver(ruleLine());

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Rule of 0 9 * * * from UTC');
  });

  it('shows "Never run" and no chip before the first run, and still the toggle and the menu', () => {
    renderCard({ last_run: null, last_run_status: null });

    expect(statusChip()).not.toBeInTheDocument();
    expect(cardText()).toMatch(/Last run:\s*Never run/);
    expect(screen.getByTestId('agent-schedule-card-toggle-7')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-7-menu-button')).toBeInTheDocument();
  });

  it('shows no chip next to "Never run" when the row has a status but no run time', () => {
    renderCard({ last_run: null, last_run_status: 'success' });

    expect(statusChip()).not.toBeInTheDocument();
    expect(cardText()).toMatch(/Last run:\s*Never run/);
  });

  it('shows the run status chip of the Runs panel: Failed, Awaiting approval and Running', () => {
    renderCard({ last_run_status: 'failed' });
    expect(statusChip()).toHaveTextContent('Failed');
    cleanup();

    renderCard({ last_run_status: 'waiting_for_approval' });
    expect(statusChip()).toHaveTextContent('Awaiting approval');
    cleanup();

    renderCard({ last_run_status: 'running' });
    expect(statusChip()).toHaveTextContent('Running...');
    expect(within(statusChip()).getByRole('progressbar')).toBeInTheDocument();
    expect(cardText()).not.toMatch(/Last run:\s*19.10.2026/);
  });

  it('the toggle of an enabled schedule pauses it', () => {
    renderCard();

    fireEvent.click(screen.getByRole('switch', { name: 'Enable Daily digest' }));

    expect(mocks.actions.onPause).toHaveBeenCalledTimes(1);
    expect(mocks.actions.onResume).not.toHaveBeenCalled();
  });

  it('disables the toggle without pause and resume', () => {
    renderCard({ allowed_actions: ['edit'] });

    expect(screen.getByRole('switch', { name: 'Enable Daily digest' })).toBeDisabled();
  });

  const menuItems = () => screen.getAllByRole('menuitem').map(item => item.textContent);

  it('the menu lists Run now, Edit, Run history and Delete, without Pause or Change owner', () => {
    renderCard();
    openMenu();

    expect(menuItems()).toEqual(['Run now', 'Edit', 'Run history', 'Delete']);
  });

  it('the menu lists Export before Delete with the export permission', () => {
    // useScheduleRowActions gives onExport only with the export permission
    const onExport = vi.fn();
    mocks.actions = { ...mocks.actions, onExport };
    renderCard();
    openMenu();

    expect(menuItems()).toEqual(['Run now', 'Edit', 'Run history', 'Export', 'Delete']);
    fireEvent.click(screen.getByText('Export'));
    expect(onExport).toHaveBeenCalledTimes(1);
    delete mocks.actions.onExport;
  });

  it('hides Run now and Delete without their keys', () => {
    renderCard({ allowed_actions: ['edit', 'pause'] });
    openMenu();

    expect(menuItems()).toEqual(['Edit', 'Run history']);
  });

  it('Run history opens the Runs section of the schedule without opening the details page', () => {
    const { onOpenForm, onOpenRunHistory } = renderCard();

    openMenu();
    fireEvent.click(screen.getByText('Run history'));

    expect(onOpenRunHistory.mock.calls).toEqual([[7]]);
    expect(onOpenForm).not.toHaveBeenCalled();
  });

  it('Delete opens the delete dialog and Cancel keeps the card', () => {
    renderCard();
    openMenu();

    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByTestId('delete-confirm-message')).toHaveTextContent('Daily digest');
    fireEvent.click(screen.getByTestId('delete-confirm-cancel-button'));

    expect(mocks.actions.onDelete).not.toHaveBeenCalled();
    expect(screen.getByTestId('agent-schedule-card-7')).toBeInTheDocument();
  });

  describe('pipeline card', () => {
    it('shows the same lines, chip, toggle and menu with pipeline test ids', () => {
      renderCard({ last_run_status: 'skipped' }, { entityType: 'pipeline' });

      expect(screen.getByTestId('pipeline-schedule-card-7')).toHaveTextContent('Daily digest');
      expect(ruleLine('pipeline')).toHaveTextContent('Rule of 0 9 * * * from UTC');
      expect(statusChip('pipeline')).toHaveTextContent('Skipped');
      expect(screen.getByTestId('pipeline-schedule-card-toggle-7')).toBeInTheDocument();
    });

    it('the menu on another owner card offers only the allowed actions', () => {
      renderCard({ allowed_actions: ['edit', 'pause', 'delete'] }, { entityType: 'pipeline' });
      openMenu();

      expect(menuItems()).toEqual(['Edit', 'Run history', 'Delete']);
    });

    it('hides Run history without the edit action', () => {
      renderCard({ allowed_actions: ['run', 'delete'] }, { entityType: 'pipeline' });
      openMenu();

      expect(menuItems()).toEqual(['Run now', 'Delete']);
    });
  });

  // #7405: a webhook card has its sender and URL instead of the cron rule and the next run
  describe('webhook card', () => {
    const WEBHOOK = {
      trigger_kind: 'webhook',
      webhook_type: 'gitlab',
      gitlab_auth_method: 'secret_token',
      webhook_url: '/api/v2/elitea_core/hooks/prompt_lib/5/abc',
      cron: null,
      timezone: null,
      next_run: null,
      allowed_actions: ['edit', 'pause', 'rotate_secret', 'delete'],
    };
    const webhookCard = () => screen.getByTestId('agent-webhook-card-7');

    it('shows the name, the type, the URL and the last delivery, and no rule or next run', () => {
      renderCard(WEBHOOK);
      expect(screen.getByTestId('agent-webhook-card-title-7')).toHaveTextContent('Daily digest · GitLab');
      expect(screen.getByTestId('agent-webhook-card-url-7-copy')).toBeInTheDocument();
      expect(webhookCard()).toHaveTextContent('/hooks/prompt_lib/5/abc');
      expect(webhookCard()).toHaveTextContent(/Last delivery:\s*19.10.2026/);
      expect(webhookCard()).not.toHaveTextContent('Next run');
    });

    it('says when no delivery came yet', () => {
      renderCard({ ...WEBHOOK, last_run: null, last_run_status: null });
      expect(webhookCard()).toHaveTextContent('No deliveries yet');
    });

    it('names the end of the rotation window while the old secret is still accepted', () => {
      renderCard({ ...WEBHOOK, previous_secret_until: new Date(Date.now() + 3_600_000).toISOString() });
      expect(screen.getByTestId('agent-webhook-card-rotating-7')).toHaveTextContent(
        'previous secret stays valid until',
      );
    });
  });
});
