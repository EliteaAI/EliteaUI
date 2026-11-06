// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

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

  it('sends the interrupt ids of the paused event with the decision', () => {
    mocks.conversation = { conversationUuid: 'conv-1', pausedMessageId: 'msg-1' };
    mocks.detail = {
      ...run,
      conversation_id: 5,
      events: [paused({ text: 'Paused for approval', interrupt_ids: ['int-1', 'int-2'] })],
    };
    renderCard({ run: { ...run, conversation_id: 5 } });

    fireEvent.click(button('Approve'));

    expect(mocks.decide).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'approve', interruptIds: ['int-1', 'int-2'] }),
    );
  });

  const chatRun = { ...run, conversation_id: 5 };
  const pauseChat = event => {
    mocks.conversation = { conversationUuid: 'conv-1', pausedMessageId: 'msg-1' };
    mocks.detail = { ...chatRun, events: [event] };
    renderCard({ run: chatRun });
  };

  it('keeps Approve on and sends no ids for a one-tool pause without interrupt ids', () => {
    pauseChat(
      paused({
        text: 'Paused for approval',
        tools: [{ toolkit: 'Artifact', tool: 'create_file', count: 1 }],
      }),
    );

    expect(button('Approve')).toBeEnabled();
    fireEvent.click(button('Approve'));

    expect(mocks.decide).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'approve', interruptIds: undefined }),
    );
  });

  it('keeps Approve on when the run detail has not loaded', () => {
    mocks.conversation = { conversationUuid: 'conv-1', pausedMessageId: 'msg-1' };
    mocks.detail = undefined;
    renderCard({ run: chatRun });

    expect(button('Approve')).toBeEnabled();
    expect(button('Reject')).toBeEnabled();
  });

  it.each([
    [
      'two tools',
      [
        { toolkit: 'Artifact', tool: 'create_file', count: 1 },
        { toolkit: 'ADO', tool: 'list_indexes', count: 1 },
      ],
      0,
    ],
    ['one tool called twice', [{ toolkit: 'Artifact', tool: 'create_file', count: 2 }], 0],
    ['hidden tools', [{ toolkit: 'Artifact', tool: 'create_file', count: 1 }], 3],
  ])(
    'keeps Approve off with a note for a pause of %s without interrupt ids, Reject works',
    (_, tools, hidden) => {
      pauseChat(paused({ text: 'Paused for approval', tools, hidden }));

      const note = screen.getByText(
        'Approve all is not possible here. Answer each tool in the run chat, or Reject.',
      );
      expect(button('Approve')).toBeDisabled();
      expect(button('Approve')).toHaveAttribute('aria-describedby', note.id);
      expect(button('Reject')).toBeEnabled();

      fireEvent.click(button('Reject'));
      expect(mocks.decide).toHaveBeenCalledWith(expect.objectContaining({ action: 'reject' }));
    },
  );

  it('enables Approve for a pause of several tools that carries the interrupt ids', () => {
    pauseChat(
      paused({
        tools: [
          { toolkit: 'Artifact', tool: 'create_file', count: 1 },
          { toolkit: 'ADO', tool: 'list_indexes', count: 1 },
        ],
        interrupt_ids: ['int-1', 'int-2'],
      }),
    );

    expect(button('Approve')).toBeEnabled();
    expect(screen.queryByText(/Approve all is not possible here/)).not.toBeInTheDocument();
  });

  it('lists the pending tools, the hidden count and the tools that may ask later', () => {
    pauseChat(
      paused({
        tools: [
          { toolkit: 'Artifact', tool: 'create_file', count: 2 },
          { toolkit: 'ADO', tool: 'list_indexes', count: 1 },
        ],
        hidden: 4,
        later_tools: [{ toolkit: 'GitHub', tool: '<b>create_pull_request</b>' }],
        interrupt_ids: ['int-1'],
      }),
    );

    const pending = within(screen.getByTestId('schedule-waiting-tools'));
    expect(pending.getAllByRole('listitem').map(item => item.textContent)).toEqual([
      'Artifact · create_file x 2',
      'ADO · list_indexes',
      '+4 more',
    ]);
    expect(screen.getByText('May ask for approval later in this run')).toBeInTheDocument();
    const later = within(screen.getByTestId('schedule-waiting-later-tools'));
    expect(later.getByRole('listitem')).toHaveTextContent('GitHub · <b>create_pull_request</b>');
    expect(screen.getByTestId('schedule-waiting-later-tools').querySelector('b')).toBeNull();
  });

  it('replaces the event text with a fixed line when the tools are listed', () => {
    pauseChat(
      paused({
        text: 'Paused for approval: Artifact · create_file, ADO · list_indexes (+1 more)',
        tools: [
          { toolkit: 'Artifact', tool: 'create_file', count: 1 },
          { toolkit: 'ADO', tool: 'list_indexes', count: 1 },
        ],
        interrupt_ids: ['int-1', 'int-2'],
      }),
    );

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent(
      'This run will not start until you approve it. Paused for approval. The tools below wait for your decision. Reject ends the run as Failed: rejected by the owner.',
    );
    expect(notice).not.toHaveTextContent('more)');
    expect(screen.getByTestId('schedule-waiting-tools')).toBeInTheDocument();
  });

  it('keeps the event text when the pause has no tool list', () => {
    pauseChat(paused({ text: 'Paused for approval: create_pull_request (+1 more)' }));

    expect(screen.getByRole('status')).toHaveTextContent('Paused for approval: create_pull_request (+1 more)');
  });

  it('wraps long toolkit names in the notice and in both lists', () => {
    const toolkit = 'QA7432GitHubwritetoolkitwithaverylongdisplaynameforthebannerlayoutchecknumberC';
    pauseChat(
      paused({
        tools: [{ toolkit, tool: 'create_pull_request', count: 1 }],
        later_tools: [{ toolkit, tool: 'delete_file', count: 1 }],
      }),
    );

    expect(screen.getByTestId('schedule-waiting-tools')).toHaveStyle({ overflowWrap: 'anywhere' });
    expect(screen.getByTestId('schedule-waiting-later-tools')).toHaveStyle({ overflowWrap: 'anywhere' });
    expect(screen.getByRole('status').querySelector('p, span')).toHaveStyle({ overflowWrap: 'anywhere' });
  });

  it('shows no tool lists for a pause without them', () => {
    pauseChat(paused({ text: 'Paused for approval' }));

    expect(screen.queryByTestId('schedule-waiting-tools')).not.toBeInTheDocument();
    expect(screen.queryByText('May ask for approval later in this run')).not.toBeInTheDocument();
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
