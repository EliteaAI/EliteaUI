// @vitest-environment jsdom
//
// RTK Query keeps returning a query's last data after it switches to `skip`, and throws if a
// skipped query is refetched. Leaving a suite skips both the runs list and the active run, so the
// "run reached a terminal state" effect must not mistake the retained run for a fresh one (#7106).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

const refetchRuns = vi.fn();
const startEvalRun = vi.fn();

let runsSkipped = false;
let lastActiveRun;

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ search: '' }),
  useMatch: () => null,
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }),
}));

vi.mock('@/api/applications', () => ({
  useApplicationDetailsQuery: () => ({
    data: { versions: [{ id: 11 }], version_details: { id: 11 } },
    isLoading: false,
  }),
}));

vi.mock('../../../api', () => ({
  useCancelEvalRunMutation: () => [vi.fn()],
  useDeleteEvalRunMutation: () => [vi.fn()],
  useStartEvalRunMutation: () => [startEvalRun, { isLoading: false }],
  useEvalRunsQuery: (_args, { skip }) => {
    runsSkipped = skip;
    return { data: [], refetch: refetchRuns };
  },
  useEvalRunQuery: ({ runId }, { skip }) => {
    if (!skip) lastActiveRun = { id: runId, status: 'finished' };
    return { data: lastActiveRun, isError: false };
  },
}));

vi.mock('../useEvalRunLiveProgress.hooks', () => ({ useEvalRunLiveProgress: () => ({ isLive: false }) }));
vi.mock('../useEvaluationExport.hooks', () => ({
  useEvaluationExport: () => ({ exportRun: vi.fn(), isExporting: false }),
}));

const { useEvalRunActions } = await import('../useEvalRunActions.hooks');

const BASE_PROPS = {
  projectId: 1,
  applicationId: 260,
  agentId: '260',
  tab: 'all',
  attachedDatasetId: 5,
  attachedDatasetDetails: { case_count: 1 },
  attachedDimensionsCount: 1,
};

describe('useEvalRunActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runsSkipped = false;
    lastActiveRun = undefined;
    refetchRuns.mockImplementation(() => {
      if (runsSkipped) throw new Error('Cannot refetch a query that has not been started yet.');
    });
    startEvalRun.mockReturnValue({ unwrap: () => Promise.resolve({ id: 42 }) });
  });

  afterEach(() => cleanup());

  it('refetches the runs list once when the active run finishes', async () => {
    const { result } = renderHook(props => useEvalRunActions(props), {
      initialProps: { ...BASE_PROPS, editingSuiteId: 3 },
    });

    await act(() => result.current.handleEvaluate());

    expect(refetchRuns).toHaveBeenCalledTimes(1);
  });

  it('does not refetch the skipped runs list when leaving the suite after a run', async () => {
    const { result, rerender } = renderHook(props => useEvalRunActions(props), {
      initialProps: { ...BASE_PROPS, editingSuiteId: 3 },
    });

    await act(() => result.current.handleEvaluate());
    refetchRuns.mockClear();

    expect(() => rerender({ ...BASE_PROPS, editingSuiteId: null })).not.toThrow();
    expect(refetchRuns).not.toHaveBeenCalled();
    expect(result.current.activeRun).toBeUndefined();
  });
});
