// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useWaitingRunDecision } from '../useWaitingRunDecision.hooks';

// owner-only decision on a waiting run.

const mocks = vi.hoisted(() => ({
  decide: vi.fn(),
  decideWithoutChat: vi.fn(),
  user: { id: 5 },
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  refetch: vi.fn(),
  tokens: { 'https://mcp.example': { access_token: 'fresh' } },
}));

vi.mock('react-redux', () => ({ useSelector: select => select({ user: mocks.user }) }));
vi.mock('@/[fsd]/features/mcp', () => ({
  McpAuthHelpers: { getAllTokens: () => mocks.tokens },
}));
vi.mock('@/[fsd]/entities/run-history/api', () => ({
  RunHistoryApi: { useDecideWaitingRunMutation: () => [mocks.decide] },
}));
vi.mock('@/[fsd]/entities/schedule', () => ({
  useDecideRunWithoutChatMutation: () => [mocks.decideWithoutChat],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 3,
  useToast: () => ({
    toastError: mocks.toastError,
    toastInfo: mocks.toastInfo,
    toastSuccess: mocks.toastSuccess,
  }),
}));

const ok = () => ({ unwrap: () => Promise.resolve({}) });
const fail = error => ({ unwrap: () => Promise.reject(error) });
const request = { action: 'approve', conversationUuid: 'c-1', messageId: 'm-1' };

const DEFAULT_SCHEDULE = { id: 8, owner: { id: 5 }, created_by: 9 };

const setup = (schedule = DEFAULT_SCHEDULE) =>
  renderHook(() => useWaitingRunDecision({ schedule, onDecided: mocks.refetch })).result;

describe('useWaitingRunDecision', () => {
  beforeEach(() => vi.clearAllMocks());

  it('gives a non-owner no handler', () => {
    expect(setup({ owner: { id: 9 }, created_by: 5 }).current).toBeUndefined();
  });

  it('sends the decision and refetches the run rows', async () => {
    mocks.decide.mockReturnValue(ok());
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.decide).toHaveBeenCalledWith({
      projectId: 3,
      conversationUuid: 'c-1',
      messageId: 'm-1',
      action: 'approve',
    });
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it.each([400, 409])('shows an info toast and refetches on %s', async status => {
    mocks.decide.mockReturnValue(fail({ status }));
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.toastInfo).toHaveBeenCalledWith('The run no longer waits for approval.');
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('shows an error toast and does not refetch on a 500', async () => {
    mocks.decide.mockReturnValue(fail({ status: 500, data: { message: 'boom' } }));
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.refetch).not.toHaveBeenCalled();
  });

  it('shows an error toast on a 403 and does not refetch', async () => {
    mocks.decide.mockReturnValue(fail({ status: 403 }));
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.toastInfo).not.toHaveBeenCalled();
    expect(mocks.refetch).not.toHaveBeenCalled();
  });

  it('sends the sign-in request with fresh tokens when the pause is a sign-in', async () => {
    mocks.decide.mockReturnValue(ok());
    const result = setup();
    await act(() =>
      result.current({
        ...request,
        authRequest: { authorizationRequestId: 'auth-1', toolCallId: 'call-1', childThreadId: 'child-1' },
      }),
    );
    expect(mocks.decide).toHaveBeenCalledWith({
      projectId: 3,
      conversationUuid: 'c-1',
      messageId: 'm-1',
      action: 'approve',
      mcpAuth: {
        authorizationRequestId: 'auth-1',
        toolCallId: 'call-1',
        childThreadId: 'child-1',
        mcpTokens: mocks.tokens,
      },
    });
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('sends no sign-in fields for a sensitive-tool decision', async () => {
    mocks.decide.mockReturnValue(ok());
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.decide.mock.calls[0][0]).not.toHaveProperty('mcpAuth');
  });

  it('decides a run without a chat through the schedule route', async () => {
    mocks.decideWithoutChat.mockReturnValue(ok());
    const result = setup();
    await act(() => result.current({ action: 'approve', runId: 41 }));
    expect(mocks.decideWithoutChat).toHaveBeenCalledWith({
      projectId: 3,
      scheduleId: 8,
      runId: 41,
      action: 'approve',
    });
    expect(mocks.decide).not.toHaveBeenCalled();
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it('shows the notice when a run without a chat no longer waits', async () => {
    mocks.decideWithoutChat.mockReturnValue(fail({ status: 409 }));
    const result = setup();
    await act(() => result.current({ action: 'reject', runId: 41 }));
    expect(mocks.toastInfo).toHaveBeenCalledWith('The run no longer waits for approval.');
  });
});
