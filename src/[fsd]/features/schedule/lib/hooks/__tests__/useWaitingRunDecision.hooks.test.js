// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useWaitingRunDecision } from '../useWaitingRunDecision.hooks';

// EL-7011 US-41: owner-only decision on a waiting run (R2.3, R2.4, R2.5, R3.1, R3.3).

const mocks = vi.hoisted(() => ({
  decide: vi.fn(),
  user: { id: 5 },
  toastError: vi.fn(),
  toastInfo: vi.fn(),
  toastSuccess: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('react-redux', () => ({ useSelector: select => select({ user: mocks.user }) }));
vi.mock('@/[fsd]/entities/run-history/api/runHistoryApi.js', () => ({
  useDecideWaitingRunMutation: () => [mocks.decide],
}));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({
    toastError: mocks.toastError,
    toastInfo: mocks.toastInfo,
    toastSuccess: mocks.toastSuccess,
  }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 3 }));

const ok = () => ({ unwrap: () => Promise.resolve({}) });
const fail = error => ({ unwrap: () => Promise.reject(error) });
const request = { action: 'approve', conversationUuid: 'c-1', messageId: 'm-1' };

const setup = (schedule = { created_by: 5 }) =>
  renderHook(() => useWaitingRunDecision({ schedule, onDecided: mocks.refetch })).result;

describe('useWaitingRunDecision EL-7011', () => {
  beforeEach(() => vi.clearAllMocks());

  it('R3.1 EL-7011 gives a non-owner no handler', () => {
    expect(setup({ created_by: 9 }).current).toBeUndefined();
  });

  it('R2.3 EL-7011 sends the decision and refetches the run rows', async () => {
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

  it.each([400, 409])('R2.4 EL-7011 shows an info toast and refetches on %s', async status => {
    mocks.decide.mockReturnValue(fail({ status }));
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.toastInfo).toHaveBeenCalledWith('The run no longer waits for approval.');
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it('R2.5 EL-7011 shows an error toast and does not refetch on a 500', async () => {
    mocks.decide.mockReturnValue(fail({ status: 500, data: { message: 'boom' } }));
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.refetch).not.toHaveBeenCalled();
  });

  it('R3.3 EL-7011 shows an error toast on a 403 and does not refetch', async () => {
    mocks.decide.mockReturnValue(fail({ status: 403 }));
    const result = setup();
    await act(() => result.current(request));
    expect(mocks.toastError).toHaveBeenCalledTimes(1);
    expect(mocks.toastInfo).not.toHaveBeenCalled();
    expect(mocks.refetch).not.toHaveBeenCalled();
  });
});
