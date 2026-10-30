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
}));

vi.mock('../../lib/hooks/useScheduleRuns.hooks', () => ({
  useScheduleRun: () => ({ run: mocks.detail }),
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
vi.mock('react-redux', async importOriginal => ({ ...(await importOriginal()), useDispatch: () => vi.fn() }));

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
    expect(screen.getByText('Reject ends the run as Failed: rejected by the owner.')).toBeInTheDocument();
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

  it('shows the owner-only note and no decision for another user', () => {
    mocks.isOwner = false;
    renderCard();

    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
    expect(screen.getByText('Only the owner can approve or reject this run')).toBeInTheDocument();
  });

  it('switches back to the test block from the header button', () => {
    const onShowTest = renderCard();

    fireEvent.click(button('Test schedule'));

    expect(onShowTest).toHaveBeenCalledTimes(1);
  });
});
