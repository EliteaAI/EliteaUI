// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleWaitingCard from '../ScheduleWaitingCard';

const mocks = vi.hoisted(() => ({
  detail: null,
  conversation: {},
  check: { state: 'missing', recheck: vi.fn() },
  checkArgs: null,
  isOwner: true,
  decide: vi.fn(),
  signedIn: false,
  userId: 1,
}));

vi.mock('../../lib/hooks/useScheduleRuns.hooks', () => ({
  useRunDetail: () => ({ run: mocks.detail }),
  useScheduleRunConversation: () => mocks.conversation,
}));
vi.mock('../../lib/hooks/useWaitingRunCredentialCheck.hooks', () => ({
  CREDENTIAL_CHECK_STATE: { CHECKING: 'checking', MISSING: 'missing', READY: 'ready' },
  useWaitingRunCredentialCheck: args => {
    mocks.checkArgs = args;
    return mocks.check;
  },
}));
vi.mock('../../lib/hooks/useWaitingRunDecision.hooks', () => ({
  useWaitingRunDecision: () => (mocks.isOwner ? mocks.decide : undefined),
}));
vi.mock('../../lib/hooks/useScheduleRowActions.hooks', () => ({
  useScheduleRowActions: () => ({ onPause: vi.fn(), onResume: vi.fn(), onRun: vi.fn(), isBusy: false }),
}));
vi.mock('../../lib/hooks/useTestRunAsCaller.hooks', () => ({
  useTestRunAsCaller: () => ({ start: vi.fn(), pending: false }),
}));
vi.mock('@/[fsd]/features/mcp', () => ({
  extractMcpAuthMetadata: () => ({ authServers: ['https://auth.example'] }),
  useMcpTokenChange: () => ({ isLoggedIn: mocks.signedIn }),
  McpAuthModal: () => null,
  McpAuthHelpers: { reuseAuthFamilyToken: () => false },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastSuccess: vi.fn() }),
}));
vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useDispatch: () => vi.fn(),
  useSelector: select => select({ user: { id: mocks.userId } }),
}));

const schedule = {
  id: 9,
  entity_type: 'agent',
  application_id: 3,
  version_id: 4,
  owner: { id: 1 },
};
const run = { id: 41, status: 'waiting_for_approval', conversation_id: null };
const paused = fields => ({ at: '2026-10-21T10:42:19Z', kind: 'paused', text: 'Paused', ...fields });
const theme = createTheme(getDesignTokens('dark'));
const renderCard = (props = {}) => {
  const onShowTest = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ScheduleWaitingCard
        schedule={schedule}
        run={run}
        onShowTest={onShowTest}
        {...props}
      />
    </ThemeProvider>,
  );
  return onShowTest;
};
const button = name => screen.getByRole('button', { name });

describe('ScheduleWaitingCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-21T10:44:00Z'));
    mocks.detail = {
      ...run,
      approval_expires_at: '2026-10-22T10:42:19Z',
      events: [paused({ need: 'credential', toolkit: 'GitHub', credential: 'gh-main' })],
    };
    mocks.conversation = {};
    mocks.check = { state: 'missing', recheck: vi.fn() };
    mocks.isOwner = true;
    mocks.signedIn = false;
    mocks.userId = 1;
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('names the toolkit and the credential, the expiry and the first step', () => {
    renderCard();

    expect(
      screen.getByRole('heading', { name: 'Action needed: this run is waiting for you' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(
      'Authorization is required for toolkit "GitHub".',
    );
    expect(screen.getByText('⚠️ Step 1: Toolkit Authorization Required')).toBeInTheDocument();
    expect(screen.getByText('gh-main')).toBeVisible();
    expect(screen.getByTestId('schedule-waiting-expiry')).toHaveTextContent('Expires in 23 h 58 min');
    expect(screen.getByTestId('schedule-waiting-step1-status')).toHaveTextContent('Missing');
    expect(mocks.checkArgs).toMatchObject({ toolkit: 'GitHub', enabled: true });
  });

  it('asks the credential check to scan for the shown run', () => {
    renderCard();

    expect(mocks.checkArgs).toMatchObject({ runId: 41 });
  });

  it('takes the toolkit name from the credential check when the run does not name it', () => {
    mocks.detail = { ...mocks.detail, events: [paused({ need: 'credential', credential: 'gh-main' })] };
    mocks.check = { state: 'missing', recheck: vi.fn(), toolkitName: 'Repo toolkit' };
    renderCard();

    expect(screen.getAllByRole('status')[0]).toHaveTextContent(
      'Authorization is required for toolkit "Repo toolkit".',
    );
  });

  it('opens the credentials page and the agent editor in a new tab', () => {
    renderCard();

    const credentials = screen.getByRole('link', { name: 'Open credentials' });
    expect(credentials.getAttribute('href')).toMatch(/\/5\/credentials\/create-credential$/);
    expect(credentials).toHaveAttribute('target', '_blank');
    const editor = screen.getByRole('link', { name: 'Open agent editor' });
    expect(editor.getAttribute('href')).toMatch(/\/5\/agents\/all\/3\/4\?viewMode=owner$/);
    expect(editor).toHaveAttribute('target', '_blank');
  });

  it('keeps Approve off and explains why until the credential is found, Reject works', () => {
    renderCard();

    const approve = button('Approve');
    expect(approve).toBeDisabled();
    expect(screen.getByText('Provide the credential first')).toBeInTheDocument();
    expect(button('Reject')).toBeEnabled();
    expect(screen.getByText('Reject ends the run as Failed.')).toBeInTheDocument();
  });

  it('runs the check again from Check again', () => {
    renderCard();

    fireEvent.click(button('Check again'));

    expect(mocks.check.recheck).toHaveBeenCalledTimes(1);
  });

  it('shows Done and enables Approve once the credential is found', () => {
    mocks.check = { state: 'ready', recheck: vi.fn() };
    renderCard();

    expect(screen.getByTestId('schedule-waiting-step1-status')).toHaveTextContent('Done');
    expect(button('Approve')).toBeEnabled();
    expect(screen.queryByText('Provide the credential first')).not.toBeInTheDocument();
  });

  it('shows Checking and locks Check again while the check runs', () => {
    mocks.check = { state: 'checking', recheck: vi.fn() };
    renderCard();

    expect(screen.getByTestId('schedule-waiting-step1-status')).toHaveTextContent('Checking');
    expect(button('Check again')).toBeDisabled();
    expect(button('Approve')).toBeDisabled();
  });

  it('falls back to the pause time for the expiry of an older run', () => {
    mocks.detail = { ...mocks.detail, approval_expires_at: null };
    renderCard();

    expect(screen.getByTestId('schedule-waiting-expiry')).toHaveTextContent('Expires in 23 h 58 min');
  });

  it('shows the sign-in step for a sign-in pause and no credential links', () => {
    mocks.detail = { ...run, events: [paused({ need: 'sign_in', toolkit: 'Jira' })] };
    mocks.conversation = {
      authAction: {
        authorizationRequestId: 'auth-1',
        toolMeta: { server_url: 'https://mcp.example', toolkit_name: 'Jira' },
        toolOutputs: { server_url: 'https://mcp.example' },
      },
    };
    renderCard();

    expect(screen.getByTestId('toolkit-authorization-panel')).toHaveTextContent(
      'Authorization is required for toolkit "Jira".',
    );
    expect(screen.getByTestId('toolkit-authorization-authorize-button')).toBeInTheDocument();
    expect(screen.queryByTestId('toolkit-authorization-skip-button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open credentials' })).not.toBeInTheDocument();
    expect(mocks.checkArgs.enabled).toBe(false);
    expect(screen.getByTestId('schedule-waiting-step1-status')).toHaveTextContent('Missing');
  });

  it('keeps both buttons off for a project admin who is not the owner while the credential is missing', () => {
    mocks.userId = 77;
    mocks.isOwner = false;
    renderCard();

    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
    expect(
      screen.getByText(/The schedule owner must provide the credential, then approve\./),
    ).toBeInTheDocument();
  });

  it('keeps both buttons off for a project admin who is not the owner once the credential is ready', () => {
    mocks.userId = 77;
    mocks.isOwner = false;
    mocks.check = { state: 'ready', recheck: vi.fn() };
    renderCard();

    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
  });

  it('keeps both buttons off for a project admin who is not the owner on a sign-in pause', () => {
    mocks.userId = 77;
    mocks.isOwner = false;
    mocks.signedIn = true;
    mocks.detail = { ...run, events: [paused({ need: 'sign_in', toolkit: 'Jira' })] };
    renderCard();

    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
    expect(screen.getByText('Only the owner can approve or reject this run.')).toBeInTheDocument();
  });

  it('lets an admin approve their own Run now once the credential is found', () => {
    mocks.userId = 77;
    mocks.check = { state: 'ready', recheck: vi.fn() };
    mocks.detail = { ...mocks.detail, trigger: 'manual', requested_by: 77 };
    renderCard();

    expect(button('Approve')).toBeEnabled();
  });

  it('asks an admin for their own credential when the Run now is theirs', () => {
    mocks.userId = 77;
    mocks.detail = { ...mocks.detail, trigger: 'manual', requested_by: 77 };
    renderCard();

    expect(button('Approve')).toBeDisabled();
    expect(screen.getByText('Provide the credential first')).toBeInTheDocument();
    expect(screen.getByText(/Provide the credential, then approve\./)).toBeInTheDocument();
  });

  it('names the starter, not the owner, when another user started the Run now', () => {
    mocks.userId = 1;
    mocks.detail = { ...mocks.detail, trigger: 'manual', requested_by: 77 };
    renderCard();

    expect(button('Approve')).toBeDisabled();
    expect(
      screen.getByText('The user who started this run must provide the credential first'),
    ).toBeInTheDocument();
  });

  it('keeps the schedule owner as the actor of a scheduled run', () => {
    mocks.userId = 1;
    mocks.detail = { ...mocks.detail, trigger: 'cron', requested_by: 77 };
    renderCard();

    expect(screen.getByText('Provide the credential first')).toBeInTheDocument();
  });

  it('gives the owner on a sign-in pause the authorize button and the sign-in text', () => {
    mocks.signedIn = true;
    mocks.conversation = { authAction: { toolMeta: { server_url: 'https://auth.example' } } };
    mocks.detail = { ...mocks.detail, events: [paused({ need: 'sign_in', toolkit: 'Jira' })] };
    renderCard();

    expect(screen.getByText(/Authorize now, then approve\./)).toBeInTheDocument();
    expect(button('Approve')).toBeEnabled();
  });

  it('offers a project admin who is not the actor no authorize text and no ready step on a sign-in pause', () => {
    mocks.userId = 77;
    mocks.isOwner = false;
    mocks.signedIn = true;
    mocks.conversation = { authAction: { toolMeta: { server_url: 'https://auth.example' } } };
    mocks.detail = { ...mocks.detail, events: [paused({ need: 'sign_in', toolkit: 'Jira' })] };
    renderCard();

    expect(screen.queryByText(/Authorize now/)).not.toBeInTheDocument();
    expect(screen.getByText(/The schedule owner must authorize it, then approve\./)).toBeInTheDocument();
    expect(screen.getByTestId('schedule-waiting-step1-status')).toHaveTextContent('Missing');
  });

  it('shows the owner-only note and no decision for another user', () => {
    mocks.isOwner = false;
    renderCard();

    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
    expect(screen.getByText('Only the owner can approve or reject this run.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Pause|Change owner|Start a new run/ }),
    ).not.toBeInTheDocument();
  });

  it('shows one short notice and the two buttons for a plain pause', () => {
    mocks.detail = {
      ...run,
      approval_expires_at: '2026-10-22T10:42:19Z',
      events: [paused({ text: 'Paused for approval: create_pull_request' })],
    };
    renderCard();

    expect(screen.getByRole('status')).toHaveTextContent(
      'This run will not start until you approve it. Paused for approval: create_pull_request',
    );
    expect(screen.queryByText('Action needed: this run is waiting for you')).not.toBeInTheDocument();
    expect(button('Approve')).toBeEnabled();
    expect(button('Reject')).toBeEnabled();
  });

  it('renders a Test run without a schedule from the entity and the run version', () => {
    mocks.detail = {
      ...mocks.detail,
      isDraftRun: true,
      version_id: 6,
      approval_rule: 'ask_me',
    };
    renderCard({
      schedule: undefined,
      run: { ...run, isDraftRun: true },
      entityType: 'agent',
      applicationId: 3,
    });

    expect(mocks.checkArgs.schedule).toMatchObject({
      entity_type: 'agent',
      application_id: 3,
      version_id: 6,
      approval_rule: 'ask_me',
    });
    expect(screen.getByRole('link', { name: 'Open agent editor' }).getAttribute('href')).toMatch(
      /\/5\/agents\/all\/3\/6\?viewMode=owner$/,
    );
    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeEnabled();
  });

  it('shows the runs from the header button', () => {
    const onShowTest = renderCard();

    fireEvent.click(button('Show runs'));

    expect(onShowTest).toHaveBeenCalledTimes(1);
  });
});
