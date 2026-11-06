// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useWaitingRunDecision } from '../useWaitingRunDecision.hooks';

// owner-only decision on a waiting run.

const mocks = vi.hoisted(() => ({
  decide: vi.fn(),
  decideWithoutChat: vi.fn(),
  decideTestRun: vi.fn(),
  user: { id: 5 },
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  refetch: vi.fn(),
  tokens: {
    'https://mcp.example': { access_token: 'fresh' },
    'https://other.example': { access_token: 'other', refresh_token: 'secret' },
  },
}));

vi.mock('react-redux', () => ({ useSelector: select => select({ user: mocks.user }) }));
vi.mock('@/[fsd]/features/mcp', () => ({
  McpAuthHelpers: {
    getAllTokens: () => mocks.tokens,
    getStorageKey: ({ serverUrl }) => serverUrl || null,
  },
}));
vi.mock('@/[fsd]/entities/run-history/api', () => ({
  RunHistoryApi: { useDecideWaitingRunMutation: () => [mocks.decide] },
}));
vi.mock('@/[fsd]/entities/schedule', () => ({
  useDecideRunWithoutChatMutation: () => [mocks.decideWithoutChat],
  useDecideTestRunWithoutChatMutation: () => [mocks.decideTestRun],
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

  it('shows an info toast and refetches on a 409', async () => {
    mocks.decide.mockReturnValue(fail({ status: 409 }));
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.toastInfo).toHaveBeenCalledWith('The run no longer waits for approval.');
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('passes the interrupt ids of the shown pause to the decision', async () => {
    mocks.decide.mockReturnValue(ok());
    const result = setup();
    await act(() => result.current({ ...request, interruptIds: ['int-1'] }));
    expect(mocks.decide).toHaveBeenCalledWith(expect.objectContaining({ interruptIds: ['int-1'] }));
  });

  it('sends no interrupt ids when the pause had none', async () => {
    mocks.decide.mockReturnValue(ok());
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.decide.mock.calls[0][0]).not.toHaveProperty('interruptIds');
  });

  it('says the approval request changed and loads the run again on a 409 after ids were sent', async () => {
    mocks.decide.mockReturnValue(fail({ status: 409, data: { error: 'server text' } }));
    const result = setup();
    await act(() => result.current({ ...request, interruptIds: ['int-1'] }));
    expect(mocks.toastInfo).toHaveBeenCalledWith(
      'The approval request changed. Refresh and check the tools.',
    );
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('keeps the generic 409 notice and sends no ids on the sign-in resume', async () => {
    mocks.decide.mockReturnValue(fail({ status: 409, data: { error: 'server text' } }));
    const result = setup();
    await act(() =>
      result.current({
        ...request,
        interruptIds: ['int-1'],
        authRequest: { authorizationRequestId: 'auth-1', toolCallId: 't-1', childThreadId: 'ct-1' },
      }),
    );
    expect(mocks.decide.mock.calls[0][0]).not.toHaveProperty('interruptIds');
    expect(mocks.toastInfo).toHaveBeenCalledWith('The run no longer waits for approval.');
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the generic 409 notice on the no-chat route even when ids are passed', async () => {
    mocks.decideWithoutChat.mockReturnValue(fail({ status: 409 }));
    const result = setup();
    await act(() => result.current({ action: 'approve', runId: 41, interruptIds: ['int-1'] }));
    expect(mocks.toastInfo).toHaveBeenCalledWith('The run no longer waits for approval.');
  });

  it('shows an error toast and keeps the panel open on a 400', async () => {
    mocks.decide.mockReturnValue(fail({ status: 400, data: { message: 'bad request' } }));
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.toastInfo).not.toHaveBeenCalled();
    expect(mocks.refetch).not.toHaveBeenCalled();
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

  it('sends the sign-in request with every stored token when the pause is a sign-in', async () => {
    mocks.decide.mockReturnValue(ok());
    const result = setup();
    await act(() =>
      result.current({
        ...request,
        authRequest: {
          authorizationRequestId: 'auth-1',
          toolCallId: 'call-1',
          childThreadId: 'child-1',
          serverUrl: 'https://mcp.example',
        },
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

  it('keeps the run waiting and shows the server text when the credential is still missing', async () => {
    mocks.decideWithoutChat.mockReturnValue(
      fail({ status: 409, data: { code: 'credential_missing', error: 'The credential is still missing.' } }),
    );
    const result = setup();
    await act(() => result.current({ action: 'approve', runId: 41 }));
    expect(mocks.toastError).toHaveBeenCalledWith('The credential is still missing.');
    expect(mocks.toastInfo).not.toHaveBeenCalled();
    expect(mocks.refetch).not.toHaveBeenCalled();
  });

  it.each(['run_not_waiting', 'run_has_chat'])('shows the notice on a 409 %s', async code => {
    mocks.decideWithoutChat.mockReturnValue(fail({ status: 409, data: { code, error: 'x' } }));
    const result = setup();
    await act(() => result.current({ action: 'approve', runId: 41 }));
    expect(mocks.toastInfo).toHaveBeenCalledWith('The run no longer waits for approval.');
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

  describe('Test run without a schedule', () => {
    const testRun = { isDraftRun: true, requested_by: 5 };
    const setupTest = (run = testRun) =>
      renderHook(() => useWaitingRunDecision({ run, onDecided: mocks.refetch })).result;

    it.each(['approve', 'reject'])(
      'sends %s through the test run route without a schedule id',
      async action => {
        mocks.decideTestRun.mockReturnValue(ok());
        const result = setupTest();
        await act(() => result.current({ action, runId: 41 }));
        expect(mocks.decideTestRun).toHaveBeenCalledWith({ projectId: 3, runId: 41, action });
        expect(mocks.decideTestRun.mock.calls[0][0]).not.toHaveProperty('scheduleId');
        expect(mocks.decideWithoutChat).not.toHaveBeenCalled();
        expect(mocks.refetch).toHaveBeenCalledTimes(1);
      },
    );

    it('gives another user no handler', () => {
      expect(setupTest({ isDraftRun: true, requested_by: 9 }).current).toBeUndefined();
    });

    it('shows the notice on a 409 run_not_waiting', async () => {
      mocks.decideTestRun.mockReturnValue(fail({ status: 409, data: { code: 'run_not_waiting' } }));
      const result = setupTest();
      await act(() => result.current({ action: 'approve', runId: 41 }));
      expect(mocks.toastInfo).toHaveBeenCalledWith('The run no longer waits for approval.');
    });
  });

  it('shows the notice when a run without a chat no longer waits', async () => {
    mocks.decideWithoutChat.mockReturnValue(fail({ status: 409 }));
    const result = setup();
    await act(() => result.current({ action: 'reject', runId: 41 }));
    expect(mocks.toastInfo).toHaveBeenCalledWith('The run no longer waits for approval.');
  });
});
