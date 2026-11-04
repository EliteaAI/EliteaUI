// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useScheduleRunsView } from '../useScheduleRunsView.hooks';

// the Runs card state: merged runs, filters and the one open run

const mocks = vi.hoisted(() => ({
  saved: [],
  draft: [],
  draftLoaded: true,
  draftFailed: false,
  draftSkip: null,
  loaded: true,
  applicationDetails: vi.fn(),
}));

vi.mock('../useScheduleRuns.hooks', () => ({
  useScheduleRuns: () => mocks.saved,
  useScheduleRunsLoaded: () => mocks.loaded,
  useScheduleRunsTotal: () => mocks.saved.length,
  useDraftTestRuns: (applicationId, skip) => {
    mocks.draftSkip = skip;
    return { rows: mocks.draft, loaded: mocks.draftLoaded, failed: mocks.draftFailed, settled: true };
  },
}));
vi.mock('@/[fsd]/features/settings', async () => ({
  AnalyticCommonHelpers: await import('@/[fsd]/features/settings/lib/helpers/analyticsCommon.helpers'),
}));
vi.mock('@/[fsd]/entities/schedule', async () => await import('@/[fsd]/entities/schedule/lib/helpers'));
vi.mock('@/[fsd]/entities/run-history', async () => await import('@/[fsd]/entities/run-history/lib/helpers'));
vi.mock('@/api/applications', () => ({ useApplicationDetailsQuery: mocks.applicationDetails }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));

const saved = {
  id: 1,
  trigger: 'cron',
  status: 'success',
  conversation_id: 70,
  started_at: '2026-10-21T09:00:00Z',
};
const waiting = {
  id: 2,
  trigger: 'cron',
  status: 'waiting_for_approval',
  conversation_id: 90,
  started_at: '2026-10-21T10:00:00Z',
};
const testRun = (id, startedAt) => ({
  id,
  trigger: 'test',
  status: 'success',
  isDraftRun: true,
  started_at: startedAt,
});

const wrapperFor = entry =>
  function Wrapper({ children }) {
    return <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>;
  };
const setup = (entry = '/', scheduleId = 9, applicationId = 3) =>
  renderHook(() => useScheduleRunsView(scheduleId, applicationId), { wrapper: wrapperFor(entry) });

describe('useScheduleRunsView', () => {
  beforeEach(() => {
    mocks.applicationDetails.mockReturnValue({
      currentData: { versions: [{ id: 4, name: 'base' }] },
    });
  });
  afterEach(() => {
    vi.clearAllMocks();
    mocks.saved = [];
    mocks.draft = [];
    mocks.draftLoaded = true;
    mocks.draftFailed = false;
    mocks.loaded = true;
  });

  it('names the versions of the application', () => {
    const { result } = setup();

    expect(result.current.versionNames).toEqual({ 4: 'base' });
  });

  it('opens the run that waits for a decision when nothing is chosen', () => {
    mocks.saved = [waiting, saved];
    const { result } = setup();

    expect(result.current.expandedRunId).toBe(2);
  });

  it('opens the run named by the history_run_id link', () => {
    mocks.saved = [waiting, saved];
    const { result } = setup('/?history_run_id=70');

    expect(result.current.expandedRunId).toBe(1);
  });

  it('closes the open card on a second click and opens another on a click', () => {
    mocks.saved = [waiting, saved];
    const { result } = setup();

    act(() => result.current.onExpand(1));
    expect(result.current.expandedRunId).toBe(1);
    act(() => result.current.onExpand(1));
    expect(result.current.expandedRunId).toBeNull();
  });

  it('keeps the Test runs of an earlier visit out of the card and shows new ones', () => {
    mocks.draft = [testRun(3, '2026-10-20T09:00:00Z')];
    const { result, rerender } = setup();
    expect(result.current.runs).toEqual([]);

    mocks.draft = [testRun(4, '2026-10-22T09:00:00Z'), testRun(3, '2026-10-20T09:00:00Z')];
    rerender();

    expect(result.current.runs.map(run => run.id)).toEqual([4]);
    expect(result.current.total).toBe(1);
  });

  it('opens a new Test run by itself after the user started it', () => {
    mocks.saved = [saved];
    const { result, rerender } = setup('/', null);

    act(() => result.current.expectRun());
    mocks.draft = [testRun(8, '2026-10-23T09:00:00Z')];
    rerender();

    expect(result.current.expandedRunId).toBe(8);
  });

  it('does not open a later run after the start failed', () => {
    mocks.saved = [saved];
    const { result, rerender } = setup();

    act(() => result.current.expectRun());
    act(() => result.current.cancelExpectRun());
    mocks.saved = [{ ...waiting, status: 'running' }, saved];
    rerender();

    expect(result.current.expandedRunId).toBeUndefined();
  });

  it('counts a failed first draft list as empty, so the next Test run shows', () => {
    mocks.draftLoaded = false;
    mocks.draftFailed = true;
    const { result, rerender } = setup('/', null);

    mocks.draftLoaded = true;
    mocks.draftFailed = false;
    mocks.draft = [testRun(5, '2026-10-23T09:00:00Z')];
    rerender();

    expect(result.current.runs.map(run => run.id)).toEqual([5]);
  });

  it('keeps the open card when a scheduled run starts that the user did not ask for', () => {
    mocks.saved = [saved];
    const { result, rerender } = setup();
    act(() => result.current.onExpand(1));

    mocks.saved = [{ ...waiting, status: 'running' }, saved];
    rerender();

    expect(result.current.expandedRunId).toBe(1);
  });

  it('opens the run that Run Now started', () => {
    mocks.saved = [saved];
    const { result, rerender } = setup();

    act(() => result.current.expectRun());
    mocks.saved = [{ ...waiting, status: 'running' }, saved];
    rerender();

    expect(result.current.expandedRunId).toBe(2);
  });

  it('asks for no draft runs on a saved schedule', () => {
    setup('/', 9);
    expect(mocks.draftSkip).toBe(true);

    setup('/', null);
    expect(mocks.draftSkip).toBe(false);
  });

  it('scrolls the card into view for a #runs link once the runs are loaded', () => {
    const card = { scrollIntoView: vi.fn(), focus: vi.fn() };
    mocks.loaded = false;
    const { result, rerender } = setup('/#runs');
    result.current.cardRef.current = card;

    mocks.loaded = true;
    rerender();

    expect(card.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(card.focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});
