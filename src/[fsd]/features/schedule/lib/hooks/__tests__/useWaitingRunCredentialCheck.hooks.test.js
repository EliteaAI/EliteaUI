// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

import { CREDENTIAL_CHECK_STATE, useWaitingRunCredentialCheck } from '../useWaitingRunCredentialCheck.hooks';

const mocks = vi.hoisted(() => ({ check: vi.fn(), projectId: 3 }));

vi.mock('@/[fsd]/entities/schedule', () => ({
  useCheckScheduleRiskMutation: () => [mocks.check],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => mocks.projectId,
}));

const SCHEDULE = {
  id: 8,
  entity_type: 'agent',
  application_id: 11,
  version_id: 12,
  approval_rule: 'pause_and_ask',
};
const FINDING = { code: 'missing_credential', toolkit: 'github' };

const answer = result => ({ unwrap: () => Promise.resolve(result) });
const failure = () => ({ unwrap: () => Promise.reject(new Error('network')) });
const deferred = () => {
  let resolve;
  const promise = new Promise(done => {
    resolve = done;
  });
  return { promise, resolve };
};

const setup = (props = {}) =>
  renderHook(() => useWaitingRunCredentialCheck({ schedule: SCHEDULE, toolkit: 'github', ...props }));

describe('useWaitingRunCredentialCheck', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.projectId = 3;
  });

  it('reports ready when the check no longer finds the missing credential', async () => {
    mocks.check.mockReturnValue(answer({ blocking: [], warnings: [], notices: [] }));
    const { result } = setup();

    expect(result.current.state).toBe(CREDENTIAL_CHECK_STATE.CHECKING);
    await waitFor(() => expect(result.current.state).toBe(CREDENTIAL_CHECK_STATE.READY));
    expect(mocks.check).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 3, schedule_id: 8, application_id: 11, version_id: 12 }),
    );
  });

  it('reports missing and the toolkit name while the finding is still there', async () => {
    mocks.check.mockReturnValue(answer({ blocking: [FINDING] }));
    const { result } = setup({ toolkit: undefined });

    await waitFor(() => expect(result.current.state).toBe(CREDENTIAL_CHECK_STATE.MISSING));
    expect(result.current.toolkitName).toBe('github');
  });

  it('reports missing when the check fails', async () => {
    mocks.check.mockReturnValue(failure());
    const { result } = setup();

    await waitFor(() => expect(result.current.state).toBe(CREDENTIAL_CHECK_STATE.MISSING));
  });

  it('ignores a late answer of an older check', async () => {
    const first = deferred();
    mocks.check.mockReturnValueOnce({ unwrap: () => first.promise });
    mocks.check.mockReturnValueOnce(answer({ blocking: [] }));
    const { result } = setup();

    await act(async () => {
      await result.current.recheck();
    });
    expect(result.current.state).toBe(CREDENTIAL_CHECK_STATE.READY);

    await act(async () => {
      first.resolve({ blocking: [FINDING] });
    });
    expect(result.current.state).toBe(CREDENTIAL_CHECK_STATE.READY);
  });

  it('checks again when the window gets focus', async () => {
    mocks.check.mockReturnValue(answer({ blocking: [] }));
    setup();
    await waitFor(() => expect(mocks.check).toHaveBeenCalledTimes(1));

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => expect(mocks.check).toHaveBeenCalledTimes(2));
  });

  it('sends no request and reports ready when it is not enabled', () => {
    const { result } = setup({ enabled: false });

    expect(result.current.state).toBe(CREDENTIAL_CHECK_STATE.READY);
    expect(mocks.check).not.toHaveBeenCalled();
  });

  it.each([
    ['application_id', { ...SCHEDULE, application_id: undefined }],
    ['version_id', { ...SCHEDULE, version_id: undefined }],
  ])('reports missing without a request when %s is missing', async (_, schedule) => {
    const { result } = setup({ schedule });

    await waitFor(() => expect(result.current.state).toBe(CREDENTIAL_CHECK_STATE.MISSING));
    expect(mocks.check).not.toHaveBeenCalled();
  });
});
