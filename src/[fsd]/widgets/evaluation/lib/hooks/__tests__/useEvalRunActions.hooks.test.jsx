// @vitest-environment jsdom
//
// RTK Query keeps returning a query's last data after it switches to `skip`, and throws if a
// skipped query is refetched. Leaving a suite skips both the runs list and the active run, so the
// "run reached a terminal state" effect must not mistake the retained run for a fresh one (#7106).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

// jsdom does not always provide a usable localStorage (it depends on the Node version), so the test brings its own
vi.hoisted(() => {
  const entries = new Map();
  const storage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
  globalThis.localStorage = storage;
  globalThis.window = Object.assign(globalThis.window ?? globalThis, { localStorage: storage });
});

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
    data: { versions: [{ id: 11 }, { id: 12 }], version_details: { id: 11 } },
    isLoading: false,
  }),
}));

vi.mock('../../../api', () => ({
  useCancelEvalRunMutation: () => [vi.fn()],
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

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('keeps a chosen version across a remount of the same suite', () => {
    const first = renderHook(props => useEvalRunActions(props), {
      initialProps: { ...BASE_PROPS, editingSuiteId: 3 },
    });
    expect(first.result.current.selectedVersionId).toBe(11);
    act(() => first.result.current.handleVersionChange(12));
    expect(first.result.current.selectedVersionId).toBe(12);
    first.unmount();

    const second = renderHook(props => useEvalRunActions(props), {
      initialProps: { ...BASE_PROPS, editingSuiteId: 3 },
    });
    expect(second.result.current.selectedVersionId).toBe(12);
  });

  it('drops the pick on the first render after switching suites', () => {
    const seen = [];
    const { result, rerender } = renderHook(
      props => {
        const value = useEvalRunActions(props);
        seen.push([props.editingSuiteId, value.selectedVersionId]);
        return value;
      },
      { initialProps: { ...BASE_PROPS, editingSuiteId: 3 } },
    );
    act(() => result.current.handleVersionChange(12));
    seen.length = 0;

    rerender({ ...BASE_PROPS, editingSuiteId: 5 });
    expect(seen.filter(([suite]) => suite === 5).every(([, version]) => version === 11)).toBe(true);
  });

  it('does not leak a stored version into another suite or a version that no longer exists', () => {
    window.localStorage.setItem('evaluation:version:1:260:3', '12');
    window.localStorage.setItem('evaluation:version:1:260:4', '99');

    const other = renderHook(props => useEvalRunActions(props), {
      initialProps: { ...BASE_PROPS, editingSuiteId: 5 },
    });
    expect(other.result.current.selectedVersionId).toBe(11);

    const stale = renderHook(props => useEvalRunActions(props), {
      initialProps: { ...BASE_PROPS, editingSuiteId: 4 },
    });
    expect(stale.result.current.selectedVersionId).toBe(11);
  });

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
