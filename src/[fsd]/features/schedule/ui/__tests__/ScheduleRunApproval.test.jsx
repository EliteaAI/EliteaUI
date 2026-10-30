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
}));

vi.mock('../../lib/hooks/useWaitingRunDecision.hooks', () => ({
  useWaitingRunDecision: args => {
    mocks.hookArgs = args;
    return mocks.isOwner ? mocks.decide : undefined;
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

  it('disables both buttons with the for anyone but the owner', () => {
    mocks.isOwner = false;
    renderApproval();

    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
    expect(screen.getByText('Only the owner can approve or reject this run')).toBeInTheDocument();
  });

  it('disables both buttons until the conversation of the run has loaded', () => {
    renderApproval({ conversationUuid: undefined });

    expect(button('Approve')).toBeDisabled();
    expect(button('Reject')).toBeDisabled();
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
      expect(screen.getByText('Only the owner can approve or reject this run')).toBeInTheDocument();
    });
  });
});
