// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useTestRunAsCaller } from '../useTestRunAsCaller.hooks';

// Test run of a saved schedule as the viewer.

const mocks = vi.hoisted(() => ({
  startDraftTestRun: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@/[fsd]/entities/schedule', async importOriginal => ({
  ...(await importOriginal()),
  useStartDraftTestRunMutation: () => [mocks.startDraftTestRun],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 3,
  useToast: () => ({ toastError: mocks.toastError, toastSuccess: mocks.toastSuccess }),
}));

const ok = () => ({ unwrap: () => Promise.resolve({}) });
const fail = error => ({ unwrap: () => Promise.reject(error) });

const schedule = {
  id: 8,
  name: 'Nightly',
  description: 'Every night',
  trigger_kind: 'cron',
  entity_type: 'agent',
  application_id: 11,
  version_id: 12,
  prompt: 'Say hi',
  variables: [],
  cron: '0 2 * * *',
  timezone: 'UTC',
  expires_at: null,
  approval_rule: 'pause_and_ask',
};

const setup = () => renderHook(() => useTestRunAsCaller(schedule)).result;

describe('useTestRunAsCaller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the Save body of the schedule and says the run started as the viewer', async () => {
    mocks.startDraftTestRun.mockReturnValue(ok());
    const result = setup();

    let started;
    await act(async () => {
      started = await result.current.start();
    });

    expect(started).toBe(true);
    expect(mocks.startDraftTestRun).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 3,
        name: 'Nightly',
        entity_type: 'agent',
        application_id: 11,
        version_id: 12,
        cron: '0 2 * * *',
        approval_rule: 'pause_and_ask',
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Test run started as you');
    expect(result.current.pending).toBe(false);
  });

  it('asks for approval and leaves out enabled, whatever the owner saved', async () => {
    mocks.startDraftTestRun.mockReturnValue(ok());
    const ownerSchedule = { ...schedule, approval_rule: 'run_without_asking', enabled: true };
    const { result } = renderHook(() => useTestRunAsCaller(ownerSchedule));

    await act(() => result.current.start());

    const body = mocks.startDraftTestRun.mock.calls[0][0];
    expect(body.approval_rule).toBe('pause_and_ask');
    expect(body).not.toHaveProperty('enabled');
  });

  it('shows the server text of a 409 while a run is active and clears the busy flag', async () => {
    mocks.startDraftTestRun.mockReturnValue(
      fail({ status: 409, data: { code: 'run_active', error: 'A run is already active' } }),
    );
    const result = setup();

    let started;
    await act(async () => {
      started = await result.current.start();
    });

    expect(started).toBe(false);
    expect(mocks.toastError).toHaveBeenCalledWith('A run is already active');
    expect(result.current.pending).toBe(false);
  });

  it('shows the server text of a 400 for a rule the project does not allow', async () => {
    mocks.startDraftTestRun.mockReturnValue(
      fail({ status: 400, data: { code: 'approval_rule_not_allowed', error: 'Run without asking is off' } }),
    );
    const result = setup();

    await act(() => result.current.start());

    expect(mocks.toastError).toHaveBeenCalledWith('Run without asking is off');
  });

  it('shows the fixed text for an unavailable server, not the server detail', async () => {
    mocks.startDraftTestRun.mockReturnValue(
      fail({ status: 503, data: { code: 'test_run_unavailable', error: 'relation does not exist' } }),
    );
    const result = setup();

    await act(() => result.current.start());

    expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('Test Run is not ready'));
    expect(mocks.toastError).not.toHaveBeenCalledWith(expect.stringContaining('relation'));
  });

  it('shows a fixed text for any other status and hides the server text', async () => {
    mocks.startDraftTestRun.mockReturnValue(fail({ status: 500, data: { error: 'trace of the server' } }));
    const result = setup();

    await act(() => result.current.start());

    expect(mocks.toastError).toHaveBeenCalledWith('Failed to start the test run');
  });
});
