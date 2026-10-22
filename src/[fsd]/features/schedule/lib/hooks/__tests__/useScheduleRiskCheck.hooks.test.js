// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

import { RISK_CHECK_STATUS } from '../../constants';
import { useScheduleRiskCheck } from '../useScheduleRiskCheck.hooks';

// EL-7011 owner CR 2026-10-21: the dry-run risk check of the schedule form (US-33, US-31, US-32)

const mocks = vi.hoisted(() => ({ check: vi.fn() }));

vi.mock('@/[fsd]/entities/schedule', () => ({
  useCheckScheduleRiskMutation: () => [mocks.check],
}));

const CLEAR = {
  blocking: [],
  sensitive: [],
  notices: [],
  run_without_asking_allowed: true,
  fingerprint: 'fp-0',
};
const SENSITIVE = [{ code: 'sensitive_action', toolkit: 'Outlook', tool: 'send_email' }];
const answer = data => ({ unwrap: () => Promise.resolve(data) });
const failure = () => ({ unwrap: () => Promise.reject({ status: 500 }) });

const setup = (initial = { entityType: 'agent', applicationId: 7, versionId: 71 }) =>
  renderHook(args => useScheduleRiskCheck({ projectId: 5, ...args }), { initialProps: initial });

const setVisibility = state => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
};

describe('useScheduleRiskCheck EL-7011 owner CR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.check.mockReturnValue(answer(CLEAR));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('stays idle and sends nothing until both the entity and the version are chosen', () => {
    const { result } = setup({ entityType: 'agent', applicationId: 7, versionId: '' });

    expect(result.current.status).toBe(RISK_CHECK_STATUS.IDLE);
    expect(mocks.check).not.toHaveBeenCalled();
  });

  it('checks the chosen entity and version and ends clear without findings', async () => {
    const { result } = setup();

    expect(result.current.status).toBe(RISK_CHECK_STATUS.CHECKING);
    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR));
    expect(mocks.check).toHaveBeenCalledWith({
      projectId: 5,
      entity_type: 'agent',
      application_id: 7,
      version_id: 71,
    });
    expect(result.current.result).toEqual(CLEAR);
  });

  it('is blocked when the server answers a blocking finding', async () => {
    mocks.check.mockReturnValue(answer({ ...CLEAR, blocking: [{ code: 'human_input_step' }] }));
    const { result } = setup();

    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.BLOCKED));
  });

  it('fails when the check does not run', async () => {
    mocks.check.mockReturnValue(failure());
    const { result } = setup();

    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.FAILED));
    expect(result.current.result).toBeNull();
  });

  it('checks again when the entity type changes', async () => {
    const { result, rerender } = setup();
    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR));

    rerender({ entityType: 'pipeline', applicationId: 7, versionId: 71 });

    await waitFor(() => expect(mocks.check).toHaveBeenCalledTimes(2));
    expect(mocks.check).toHaveBeenLastCalledWith(expect.objectContaining({ entity_type: 'pipeline' }));
  });

  it('applyFindings takes the notices of a refusal too', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR));
    const notices = [{ code: 'scan_incomplete', message: 'm' }];

    act(() => result.current.applyFindings({ code: 'risk_changed', ...CLEAR, notices, fingerprint: 'fp-4' }));

    expect(result.current.result.notices).toEqual(notices);
  });

  it('checks again when the version changes', async () => {
    const { result, rerender } = setup();
    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR));

    rerender({ entityType: 'agent', applicationId: 7, versionId: 70 });

    await waitFor(() => expect(mocks.check).toHaveBeenCalledTimes(2));
    expect(mocks.check).toHaveBeenLastCalledWith(expect.objectContaining({ version_id: 70 }));
  });

  it('checks again when the person returns to the tab, not when the tab hides', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR));

    setVisibility('hidden');
    expect(mocks.check).toHaveBeenCalledTimes(1);
    setVisibility('visible');

    await waitFor(() => expect(mocks.check).toHaveBeenCalledTimes(2));
  });

  // CR-11 review r2: the review dialog must keep its tools when a tab-return check fails
  it('keeps the last findings of the same version when a re-check fails', async () => {
    mocks.check.mockReturnValueOnce(answer({ ...CLEAR, sensitive: SENSITIVE, fingerprint: 'fp-1' }));
    const { result } = setup();
    await waitFor(() => expect(result.current.result?.fingerprint).toBe('fp-1'));

    mocks.check.mockReturnValueOnce(failure());
    setVisibility('visible');

    await waitFor(() => expect(mocks.check).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR));
    expect(result.current.result).toEqual(
      expect.objectContaining({ sensitive: SENSITIVE, fingerprint: 'fp-1' }),
    );
  });

  it('fails without findings when the check of another version fails', async () => {
    const { result, rerender } = setup();
    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR));

    mocks.check.mockReturnValueOnce(failure());
    rerender({ entityType: 'agent', applicationId: 7, versionId: 70 });

    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.FAILED));
    expect(result.current.result).toBeNull();
  });

  it('runCheck returns the fresh findings for the Save step', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR));
    mocks.check.mockReturnValue(answer({ ...CLEAR, sensitive: SENSITIVE }));

    let fresh;
    await act(async () => {
      fresh = await result.current.runCheck();
    });

    expect(fresh.sensitive).toEqual(SENSITIVE);
    expect(result.current.result.sensitive).toEqual(SENSITIVE);
  });

  it('keeps the newer answer when an older check answers last', async () => {
    let finishOld;
    mocks.check.mockReturnValueOnce({ unwrap: () => new Promise(resolve => (finishOld = resolve)) });
    const { result, rerender } = setup();
    mocks.check.mockReturnValue(answer({ ...CLEAR, fingerprint: 'fp-new' }));

    rerender({ entityType: 'agent', applicationId: 7, versionId: 70 });
    await waitFor(() => expect(result.current.result?.fingerprint).toBe('fp-new'));
    await act(async () => finishOld({ ...CLEAR, fingerprint: 'fp-old' }));

    expect(result.current.result.fingerprint).toBe('fp-new');
  });

  it('applyFindings takes the blocking list of a 409 schedule_blocked', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR));

    act(() =>
      result.current.applyFindings({
        code: 'schedule_blocked',
        blocking: [{ code: 'missing_credential' }],
      }),
    );

    expect(result.current.status).toBe(RISK_CHECK_STATUS.BLOCKED);
    expect(result.current.result.blocking).toEqual([{ code: 'missing_credential' }]);
  });

  it('applyFindings takes the new tools and fingerprint of a 409 risk_changed and keeps the rest', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR));

    act(() =>
      result.current.applyFindings({ code: 'risk_changed', sensitive: SENSITIVE, fingerprint: 'fp-2' }),
    );

    expect(result.current.status).toBe(RISK_CHECK_STATUS.CLEAR);
    expect(result.current.result).toEqual({ ...CLEAR, sensitive: SENSITIVE, fingerprint: 'fp-2' });
  });
});
