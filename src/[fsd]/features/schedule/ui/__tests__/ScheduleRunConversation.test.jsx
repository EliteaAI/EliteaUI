// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ScheduleRunConversation from '../ScheduleRunConversation';

// EL-7011 US-41 R1.3, R3.2: the owner gets the decision handler, any other user gets the note.

const mocks = vi.hoisted(() => ({ chat: vi.fn(), decision: vi.fn(), dispatch: vi.fn() }));

vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useDispatch: () => mocks.dispatch,
}));
vi.mock('@/[fsd]/entities/run-history/ui', () => ({
  RunHistoryChat: props => {
    mocks.chat(props);
    return <div data-testid="run-chat" />;
  },
}));
vi.mock('@/[fsd]/features/chat', () => ({ ChatMessageList: () => null }));
vi.mock('@/[fsd]/shared/ui/banner-message/BannerMessage', () => ({
  default: ({ message }) => <div role="note">{message}</div>,
}));
vi.mock('../../lib/hooks/useWaitingRunDecision.hooks', () => ({ useWaitingRunDecision: mocks.decision }));

const NOTE = 'Only the owner can approve or reject this run';
const schedule = { id: 9, created_by: 4 };
const waiting = { id: 1, conversation_id: 77, status: 'waiting_for_approval' };
const finished = { id: 2, conversation_id: 78, status: 'success' };
const handler = vi.fn();

describe('ScheduleRunConversation (EL-7011 US-41)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('R1.3 TC-US41-04 passes the decision handler of the owner to the chat', () => {
    mocks.decision.mockReturnValue(handler);
    render(
      <ScheduleRunConversation
        run={waiting}
        schedule={schedule}
      />,
    );

    expect(mocks.chat.mock.calls.at(-1)[0].onHitlResume).toBe(handler);
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
  });

  it('R3.2 TC-US41-11 shows the owner-only note and no handler to another user', () => {
    mocks.decision.mockReturnValue(undefined);
    render(
      <ScheduleRunConversation
        run={waiting}
        schedule={schedule}
      />,
    );

    expect(mocks.chat.mock.calls.at(-1)[0].onHitlResume).toBeUndefined();
    expect(screen.getByText(NOTE)).toBeInTheDocument();
  });

  it('R3.2 TC-US41-06 shows no note for a run that no longer waits', () => {
    mocks.decision.mockReturnValue(undefined);
    render(
      <ScheduleRunConversation
        run={finished}
        schedule={schedule}
      />,
    );

    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
  });
});
