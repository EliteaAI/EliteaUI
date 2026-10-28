// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ScheduleRunApproval from '../ScheduleRunApproval';

// test panel log, Approve and Reject at the paused log line

const mocks = vi.hoisted(() => ({ decide: vi.fn(), hookArgs: null, isOwner: true, dispatch: vi.fn() }));

vi.mock('../../lib/hooks/useWaitingRunDecision.hooks', () => ({
  useWaitingRunDecision: args => {
    mocks.hookArgs = args;
    return mocks.isOwner ? mocks.decide : undefined;
  },
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
});
