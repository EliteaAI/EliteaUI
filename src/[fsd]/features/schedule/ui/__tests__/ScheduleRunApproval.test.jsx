// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ScheduleRunApproval from '../ScheduleRunApproval';

// test panel log, Approve and Reject at the paused log line

const mocks = vi.hoisted(() => ({
  decide: vi.fn(),
  hookArgs: null,
  isOwner: true,
  dispatch: vi.fn(),
  signedIn: false,
  toastSuccess: vi.fn(),
  modalProps: null,
  rowActions: { onPause: vi.fn(), onResume: vi.fn(), onRun: vi.fn(), isBusy: false },
  testRun: { start: vi.fn(), pending: false },
  ownerDialog: null,
}));

vi.mock('../../lib/hooks/useWaitingRunDecision.hooks', () => ({
  useWaitingRunDecision: args => {
    mocks.hookArgs = args;
    return mocks.isOwner ? mocks.decide : undefined;
  },
}));
vi.mock('../../lib/hooks/useScheduleRowActions.hooks', () => ({
  useScheduleRowActions: () => mocks.rowActions,
}));
vi.mock('../../lib/hooks/useTestRunAsCaller.hooks', () => ({
  useTestRunAsCaller: () => mocks.testRun,
}));
vi.mock('../ChangeOwnerDialog', () => ({
  default: props => {
    mocks.ownerDialog = props;
    return <div data-testid="change-owner-dialog" />;
  },
}));
vi.mock('@/[fsd]/features/mcp', () => ({
  extractMcpAuthMetadata: () => ({ authServers: ['https://auth.example'] }),
  useMcpTokenChange: () => ({ isLoggedIn: mocks.signedIn }),
  McpAuthModal: props => {
    mocks.modalProps = props;
    return <div data-testid="mcp-auth-modal">{props.title}</div>;
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastSuccess: mocks.toastSuccess }),
}));
vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useDispatch: () => mocks.dispatch,
}));

const schedule = { id: 9, created_by: 1 };
const theme = createTheme(getDesignTokens('dark'));
const renderApproval = props =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRunApproval
        schedule={schedule}
        conversationUuid="conv-uuid"
        pausedMessageId="msg-7"
        pausedAt="2026-10-21T10:42:19Z"
        {...props}
      />
    </ThemeProvider>,
  );
const button = name => screen.getByRole('button', { name });

describe('ScheduleRunApproval', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-21T10:44:00Z'));
    mocks.decide.mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
    mocks.isOwner = true;
    mocks.signedIn = false;
    mocks.rowActions.isBusy = false;
    mocks.testRun.pending = false;
    mocks.ownerDialog = null;
  });

  it('Approve and Reject send the decision for the paused message', async () => {
    renderApproval();

    fireEvent.click(button('Approve'));
    await waitFor(() =>
      expect(mocks.decide).toHaveBeenCalledWith({
        action: 'approve',
        conversationUuid: 'conv-uuid',
        messageId: 'msg-7',
      }),
    );
    await waitFor(() => expect(button('Reject')).toBeEnabled());

    fireEvent.click(button('Reject'));
    await waitFor(() =>
      expect(mocks.decide).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'reject' })),
    );
    expect(mocks.hookArgs.schedule).toBe(schedule);
  });

  it('loads the runs again after a decision, so the log gets the decision line', () => {
    renderApproval();

    mocks.hookArgs.onDecided();

    expect(mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: expect.stringContaining('invalidateTags') }),
    );
  });

  it('shows the time left of the 24 hour approval window', () => {
    renderApproval();
    expect(screen.getByText('Expires in 23 h 58 min')).toBeInTheDocument();
  });

  it('disables both buttons with the owner-only note for a viewer who is not the actor', () => {
    mocks.isOwner = false;
    renderApproval();

    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
    expect(screen.getByText('Only the owner can approve or reject this run.')).toBeInTheDocument();
    expect(screen.queryByText(/project admins/)).not.toBeInTheDocument();
  });

  describe('viewer who is not the actor of an owner run', () => {
    const adminSchedule = {
      id: 9,
      name: 'Nightly',
      enabled: true,
      trigger_kind: 'cron',
      owner: { id: 1 },
      allowed_actions: ['pause', 'resume', 'change_owner', 'run'],
    };
    const ownerRun = { id: 5, trigger: 'cron', requested_by: null };

    beforeEach(() => {
      mocks.isOwner = false;
    });

    it('shows the copy, the three actions and the disabled decision buttons to an admin', () => {
      renderApproval({ schedule: adminSchedule, run: ownerRun });

      expect(
        screen.getByText(
          'Only the owner can approve or reject this run. You can pause the schedule, change its owner, or start a new run as yourself.',
        ),
      ).toBeInTheDocument();
      expect(button('Pause schedule')).toBeEnabled();
      expect(button('Change owner')).toBeEnabled();
      expect(button('Start a new run as yourself')).toBeEnabled();
      expect(screen.queryByRole('button', { name: 'Resume schedule' })).not.toBeInTheDocument();
      expect(button('Approve')).toBeDisabled();
      expect(button('Reject')).toBeDisabled();
    });

    it('offers Resume instead of Pause for a paused schedule', () => {
      renderApproval({ schedule: { ...adminSchedule, enabled: false }, run: ownerRun });

      expect(
        screen.getByText(/You can resume the schedule, change its owner, or start a new run as yourself\./),
      ).toBeInTheDocument();
      fireEvent.click(button('Resume schedule'));
      expect(mocks.rowActions.onResume).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('button', { name: 'Pause schedule' })).not.toBeInTheDocument();
    });

    it('pauses the schedule and opens the owner dialog', () => {
      renderApproval({ schedule: adminSchedule, run: ownerRun });

      fireEvent.click(button('Pause schedule'));
      expect(mocks.rowActions.onPause).toHaveBeenCalledTimes(1);

      expect(screen.queryByTestId('change-owner-dialog')).not.toBeInTheDocument();
      fireEvent.click(button('Change owner'));
      expect(screen.getByTestId('change-owner-dialog')).toBeInTheDocument();
      expect(mocks.ownerDialog.schedule).toEqual(expect.objectContaining({ id: 9, name: 'Nightly' }));
      act(() => mocks.ownerDialog.onClose());
      expect(screen.queryByTestId('change-owner-dialog')).not.toBeInTheDocument();
    });

    it('starts a Test run as the viewer for a schedule', () => {
      renderApproval({ schedule: adminSchedule, run: ownerRun });

      fireEvent.click(button('Start a new run as yourself'));

      expect(mocks.testRun.start).toHaveBeenCalledTimes(1);
      expect(mocks.rowActions.onRun).not.toHaveBeenCalled();
    });

    it('starts the sample run of a webhook row', () => {
      const webhook = { ...adminSchedule, trigger_kind: 'webhook', allowed_actions: ['run', 'pause'] };
      renderApproval({ schedule: webhook, run: ownerRun });

      expect(
        screen.getByText(
          'Only the owner can approve or reject this run. You can pause the webhook or start a new run as yourself.',
        ),
      ).toBeInTheDocument();
      fireEvent.click(button('Start a new run as yourself'));

      expect(mocks.rowActions.onRun).toHaveBeenCalledTimes(1);
      expect(mocks.testRun.start).not.toHaveBeenCalled();
    });

    it('shows the first sentence only and no action to a member without rights', () => {
      renderApproval({ schedule: { ...adminSchedule, allowed_actions: [] }, run: ownerRun });

      expect(screen.getByText('Only the owner can approve or reject this run.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Pause|Resume|Change owner|Start a new run/ })).toBeNull();
      expect(button('Approve')).toBeDisabled();
    });

    it('turns the actions off while a call is running', () => {
      mocks.testRun.pending = true;
      renderApproval({ schedule: adminSchedule, run: ownerRun });

      expect(button('Pause schedule')).toBeDisabled();
      expect(button('Start a new run as yourself')).toBeDisabled();
    });

    it('names the starter and offers no action for a run the starter acts as', () => {
      renderApproval({ schedule: adminSchedule, run: { id: 5, trigger: 'manual', requested_by: 8 } });

      expect(
        screen.getByText('Only the user who started this run can approve or reject it'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Pause|Change owner|Start a new run/ })).toBeNull();
    });
  });

  it('says only the starter decides a Test run and offers no action', () => {
    mocks.isOwner = false;
    renderApproval({ schedule: undefined, run: { id: 5, isDraftRun: true, requested_by: 8 } });

    expect(
      screen.getByText('Only the user who started this Test run can approve or reject it'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-run-approval-actions')).not.toBeInTheDocument();
  });

  it('disables both buttons until the conversation of the run has loaded', () => {
    renderApproval({ conversationUuid: undefined });

    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
  });

  it('shows no note when the hook gives a handler', () => {
    renderApproval();

    expect(screen.queryByText(/Only the owner can approve or reject this run/)).not.toBeInTheDocument();
  });

  it('enables both buttons for a run that has no chat', () => {
    renderApproval({ conversationUuid: undefined, hasChat: false, runId: 41 });

    expect(button('Approve')).toBeEnabled();
    expect(button('Reject')).toBeEnabled();
  });

  describe('sign-in pause', () => {
    const authAction = {
      authorizationRequestId: 'auth-1',
      name: 'github',
      toolMeta: { server_url: 'https://mcp.example', tool_call_id: 'call-1', toolkit_name: 'GitHub' },
      toolOutputs: { server_url: 'https://mcp.example' },
    };

    it('shows no Sign in action for a sensitive-tool pause', () => {
      renderApproval();

      expect(screen.queryByTestId('schedule-run-sign-in')).not.toBeInTheDocument();
      expect(button('Approve')).toBeEnabled();
    });

    it('shows Sign in and keeps Approve off until the owner has signed in', () => {
      renderApproval({ authAction });

      expect(screen.getByTestId('schedule-run-sign-in')).toBeEnabled();
      expect(button('Approve')).toBeDisabled();
      expect(button('Reject')).toBeEnabled();
      const note = screen.getByText(/Sign in to GitHub, then approve/);
      expect(note).toBeInTheDocument();
      expect(note.closest('[role="status"]')).not.toBeNull();
      expect(button('Approve')).toHaveAttribute('aria-describedby', note.id);
    });

    it('sets no description on Approve once the owner has signed in', () => {
      mocks.signedIn = true;
      renderApproval({ authAction });

      expect(button('Approve')).not.toHaveAttribute('aria-describedby');
    });

    it('opens the sign-in window and thanks the owner after a successful sign-in', () => {
      renderApproval({ authAction });

      fireEvent.click(screen.getByTestId('schedule-run-sign-in'));
      expect(screen.getByTestId('mcp-auth-modal')).toHaveTextContent('GitHub');
      expect(mocks.modalProps).toMatchObject({ tokenStorageKey: 'https://mcp.example', projectId: 5 });

      act(() => mocks.modalProps.onClose(true));
      expect(mocks.toastSuccess).toHaveBeenCalledWith('Successful authentication!');
      expect(screen.queryByTestId('mcp-auth-modal')).not.toBeInTheDocument();
    });

    it('closes the sign-in window on cancel without a message', () => {
      renderApproval({ authAction });

      fireEvent.click(screen.getByTestId('schedule-run-sign-in'));
      act(() => mocks.modalProps.onCancel());

      expect(screen.queryByTestId('mcp-auth-modal')).not.toBeInTheDocument();
      expect(mocks.toastSuccess).not.toHaveBeenCalled();
    });

    it('enables Approve after the sign-in and sends the sign-in request with the decision', async () => {
      mocks.signedIn = true;
      renderApproval({ authAction });

      fireEvent.click(button('Approve'));

      await waitFor(() =>
        expect(mocks.decide).toHaveBeenCalledWith({
          action: 'approve',
          conversationUuid: 'conv-uuid',
          messageId: 'msg-7',
          authRequest: {
            authorizationRequestId: 'auth-1',
            toolCallId: 'call-1',
            childThreadId: undefined,
            serverUrl: 'https://mcp.example',
          },
        }),
      );
    });

    it('rejects without a sign-in', async () => {
      renderApproval({ authAction });

      fireEvent.click(button('Reject'));

      await waitFor(() =>
        expect(mocks.decide).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'reject', authRequest: expect.any(Object) }),
        ),
      );
    });

    it('shows the owner-only note and no sign-in note to another user', () => {
      mocks.isOwner = false;
      renderApproval({ authAction });

      expect(screen.getByTestId('schedule-run-sign-in')).toBeDisabled();
      expect(screen.queryByText(/Sign in to GitHub, then approve/)).not.toBeInTheDocument();
      expect(screen.getByText('Only the owner can approve or reject this run.')).toBeInTheDocument();
    });
  });
});
