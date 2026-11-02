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
  loaded: true,
  applicationDetails: vi.fn(),
}));

vi.mock('../useScheduleRuns.hooks', () => ({
  useScheduleRuns: () => mocks.saved,
  useScheduleRunsLoaded: () => mocks.loaded,
  useScheduleRunsTotal: () => mocks.saved.length,
  useDraftTestRuns: () => ({ rows: mocks.draft, loaded: mocks.draftLoaded }),
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

  it('filters by trigger and status and clears the filters', () => {
    mocks.saved = [waiting, saved];
    const { result } = setup();

    act(() => result.current.onFilterChange('status', 'success'));
    expect(result.current.shownRuns.map(run => run.id)).toEqual([1]);
    expect(result.current.runs).toHaveLength(2);
    act(() => result.current.onClearFilters());
    expect(result.current.shownRuns).toHaveLength(2);
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

  it('opens a new Test run by itself', () => {
    mocks.saved = [saved];
    const { result, rerender } = setup();

    mocks.draft = [testRun(8, '2026-10-23T09:00:00Z')];
    rerender();

    expect(result.current.expandedRunId).toBe(8);
  });

  it('takes no baseline before the draft list has loaded', () => {
    mocks.draftLoaded = false;
    mocks.draft = [];
    const { result, rerender } = setup();

    mocks.draftLoaded = true;
    mocks.draft = [testRun(3, '2026-10-20T09:00:00Z')];
    rerender();

    expect(result.current.runs).toEqual([]);
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
