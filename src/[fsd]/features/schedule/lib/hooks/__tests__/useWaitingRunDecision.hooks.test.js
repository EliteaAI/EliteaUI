// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useWaitingRunDecision } from '../useWaitingRunDecision.hooks';

// decision on a waiting run by the user the run acts as.

const mocks = vi.hoisted(() => ({
  decide: vi.fn(),
  decideWithoutChat: vi.fn(),
  decideTestRun: vi.fn(),
  user: { id: 5 },
  isProjectAdmin: false,
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
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({
    checkPermission: permission =>
      permission === 'models.applications.schedules.admin' ? mocks.isProjectAdmin : false,
  }),
}));
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

const setup = (schedule = DEFAULT_SCHEDULE, run) =>
  renderHook(() => useWaitingRunDecision({ schedule, run, onDecided: mocks.refetch })).result;

describe('useWaitingRunDecision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isProjectAdmin = false;
    mocks.user = { id: 5 };
  });

  it('gives a plain user who is not the owner no handler', () => {
    expect(setup({ owner: { id: 9 }, created_by: 5 }).current).toBeUndefined();
  });

  it('gives the owner a handler', () => {
    expect(setup().current).toBeTypeOf('function');
  });

  it('gives the admin who started a manual run no handler while the run has no decider_id', () => {
    const run = { trigger: 'manual', requested_by: 5 };
    expect(setup({ id: 8, owner: { id: 9 } }, run).current).toBeUndefined();
  });

  it('gives the schedule owner a handler for a manual run another user started while there is no decider_id', () => {
    const run = { trigger: 'manual', requested_by: 9 };
    expect(setup({ id: 8, owner: { id: 5 } }, run).current).toBeTypeOf('function');
  });

  it('gives the owner a handler for a cron run', () => {
    const run = { trigger: 'cron', requested_by: null };
    expect(setup({ id: 8, owner: { id: 5 } }, run).current).toBeTypeOf('function');
  });

  it('gives a plain user no handler for a manual run another user started', () => {
    const run = { trigger: 'manual', requested_by: 9 };
    expect(setup({ id: 8, owner: { id: 7 } }, run).current).toBeUndefined();
  });

  it('gives a plain user no handler for a cron run even when requested_by is the user', () => {
    const run = { trigger: 'cron', requested_by: 5 };
    expect(setup({ id: 8, owner: { id: 7 } }, run).current).toBeUndefined();
  });

  it('gives a project admin who is not the owner no handler for an owner run', () => {
    mocks.isProjectAdmin = true;
    expect(setup({ id: 8, owner: { id: 9 } }).current).toBeUndefined();
    expect(
      setup({ id: 8, owner: { id: 9 } }, { trigger: 'cron', requested_by: null }).current,
    ).toBeUndefined();
  });

  describe('decider_id of the run', () => {
    it("gives the owner a handler for an admin's Run now run", () => {
      const run = { trigger: 'manual', requested_by: 9, decider_id: 5 };
      expect(setup({ id: 8, owner: { id: 5 } }, run).current).toBeTypeOf('function');
    });

    it('gives the admin who started a Run now run no handler', () => {
      mocks.isProjectAdmin = true;
      const run = { trigger: 'manual', requested_by: 5, decider_id: 9 };
      expect(setup({ id: 8, owner: { id: 9 } }, run).current).toBeUndefined();
    });

    it('gives the old owner a handler and the new owner none after Change owner', () => {
      const run = { trigger: 'cron', requested_by: null, decider_id: 5 };
      const schedule = { id: 8, owner: { id: 9 } };
      expect(setup(schedule, run).current).toBeTypeOf('function');
      mocks.user = { id: 9 };
      expect(setup(schedule, run).current).toBeUndefined();
    });

    it('lets the old owner decide a run through the schedule route', async () => {
      mocks.decideWithoutChat.mockReturnValue(ok());
      const run = { trigger: 'cron', requested_by: null, decider_id: 5 };
      const result = setup({ id: 8, owner: { id: 9 } }, run);
      await act(() => result.current({ action: 'reject', runId: 41 }));
      expect(mocks.decideWithoutChat).toHaveBeenCalledWith(
        expect.objectContaining({ scheduleId: 8, runId: 41, action: 'reject' }),
      );
      expect(mocks.refetch).toHaveBeenCalledTimes(1);
    });

    it('uses decider_id before the starter of a Test run', () => {
      const run = (requestedBy, deciderId) =>
        renderHook(() =>
          useWaitingRunDecision({
            run: { isDraftRun: true, requested_by: requestedBy, decider_id: deciderId },
            onDecided: mocks.refetch,
          }),
        ).result;
      expect(run(9, 5).current).toBeTypeOf('function');
      expect(run(5, 9).current).toBeUndefined();
    });
  });

  it('gives no handler when neither the actor nor the user is known', () => {
    mocks.user = { id: undefined };
    expect(setup({ id: 8 }).current).toBeUndefined();
  });

  it('gives a project admin no handler for a Test run another user started', () => {
    mocks.isProjectAdmin = true;
    const { result } = renderHook(() =>
      useWaitingRunDecision({ run: { isDraftRun: true, requested_by: 9 }, onDecided: mocks.refetch }),
    );
    expect(result.current).toBeUndefined();
  });

  it('gives the user who started a Test run a handler that decides it without a schedule', async () => {
    mocks.decideTestRun.mockReturnValue(ok());
    const { result } = renderHook(() =>
      useWaitingRunDecision({
        run: { id: 41, isDraftRun: true, requested_by: 5 },
        onDecided: mocks.refetch,
      }),
    );
    await act(() => result.current({ action: 'approve', runId: 41 }));
    expect(mocks.decideTestRun).toHaveBeenCalledWith({ projectId: 3, runId: 41, action: 'approve' });
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('gives a project admin no handler for a run without a schedule that is not a Test run', () => {
    mocks.isProjectAdmin = true;
    const { result } = renderHook(() => useWaitingRunDecision({ run: { id: 41 }, onDecided: mocks.refetch }));
    expect(result.current).toBeUndefined();
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

  it('keeps the run waiting and shows the server text when approve all is off for the project', async () => {
    mocks.decide.mockReturnValue(
      fail({
        status: 409,
        data: { field: 'approve_all', code: 'approve_all_off', error: 'Run without asking is off.' },
      }),
    );
    const result = setup();
    await act(() => result.current({ ...request, approveAll: true }));
    expect(mocks.toastError).toHaveBeenCalledWith('Run without asking is off.');
    expect(mocks.toastInfo).not.toHaveBeenCalled();
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the usual message on a 409 approve_all_off without server text', async () => {
    mocks.decide.mockReturnValue(fail({ status: 409, data: { code: 'approve_all_off' } }));
    const result = setup();
    await act(() => result.current({ ...request, approveAll: true }));
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.toastInfo).not.toHaveBeenCalled();
  });

  it('shows a clear message on a 403 of an approve all and keeps the run waiting', async () => {
    mocks.decide.mockReturnValue(fail({ status: 403 }));
    const result = setup();
    await act(() => result.current({ ...request, approveAll: true }));
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Only the person who started this run can approve all its tools.',
    );
    expect(mocks.toastInfo).not.toHaveBeenCalled();
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the server text on a 403 of an approve all for a webhook run and reloads the run', async () => {
    mocks.decide.mockReturnValue(
      fail({
        status: 403,
        data: { code: 'approve_all_webhook', error: 'Approve all is not available for a webhook run.' },
      }),
    );
    const result = setup();
    await act(() => result.current({ ...request, approveAll: true }));
    expect(mocks.toastError).toHaveBeenCalledWith('Approve all is not available for a webhook run.');
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['no body', {}],
    ['a body without a code', { data: { error: 'Internal detail.' } }],
    ['another code', { data: { code: 'forbidden', error: 'Internal detail.' } }],
    ['the webhook code without a text', { data: { code: 'approve_all_webhook' } }],
  ])('keeps the fixed sentence on a 403 of an approve all with %s', async (_name, extra) => {
    mocks.decide.mockReturnValue(fail({ status: 403, ...extra }));
    const result = setup();
    await act(() => result.current({ ...request, approveAll: true }));
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Only the person who started this run can approve all its tools.',
    );
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('passes approveAll to the chat decision only when it is set', async () => {
    mocks.decide.mockReturnValue(ok());
    const result = setup();
    await act(() => result.current({ ...request, approveAll: true }));
    expect(mocks.decide).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'approve', approveAll: true }),
    );

    await act(() => result.current(request));
    expect(mocks.decide.mock.calls[1][0]).not.toHaveProperty('approveAll');
  });

  it('never sends approveAll through the routes of a run without a chat', async () => {
    mocks.decideWithoutChat.mockReturnValue(ok());
    mocks.decideTestRun.mockReturnValue(ok());
    const scheduleHook = setup();
    await act(() => scheduleHook.current({ action: 'approve', runId: 41, approveAll: true }));
    expect(mocks.decideWithoutChat.mock.calls[0][0]).not.toHaveProperty('approveAll');

    const testRun = { isDraftRun: true, requested_by: 5 };
    const { result } = renderHook(() => useWaitingRunDecision({ run: testRun, onDecided: mocks.refetch }));
    await act(() => result.current({ action: 'approve', runId: 41, approveAll: true }));
    expect(mocks.decideTestRun.mock.calls[0][0]).not.toHaveProperty('approveAll');
  });

  it('never sends approveAll with the sign-in request', async () => {
    mocks.decide.mockReturnValue(ok());
    const result = setup();
    await act(() =>
      result.current({
        ...request,
        approveAll: true,
        authRequest: {
          authorizationRequestId: 'auth-1',
          toolCallId: 'call-1',
          serverUrl: 'https://mcp.example',
        },
      }),
    );
    expect(mocks.decide.mock.calls[0][0]).not.toHaveProperty('approveAll');
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
