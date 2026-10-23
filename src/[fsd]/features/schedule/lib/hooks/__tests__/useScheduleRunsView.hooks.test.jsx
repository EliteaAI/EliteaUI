// @vitest-environment jsdom
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useScheduleRunsView } from '../useScheduleRunsView.hooks';

// EL-7011 CR-21: the Runs section in the right block and the run the panel shows

const mocks = vi.hoisted(() => ({ runs: [], loaded: true, applicationDetails: vi.fn() }));

vi.mock('../useScheduleRuns.hooks', () => ({
  useScheduleRuns: () => mocks.runs,
  useScheduleRunsLoaded: () => mocks.loaded,
  useScheduleRunsTotal: () => mocks.runs.length,
}));
vi.mock('@/api/applications', () => ({ useApplicationDetailsQuery: mocks.applicationDetails }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));

const cron = {
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

// A section element with one button per run, like the rendered list
const makeSection = runs => {
  const section = document.createElement('div');
  section.focus = vi.fn();
  section.scrollIntoView = vi.fn();
  runs.forEach(run => {
    const row = document.createElement('button');
    row.dataset.runId = String(run.id);
    row.focus = vi.fn();
    row.scrollIntoView = vi.fn();
    section.append(row);
  });
  return section;
};
const rowOf = (section, run) => section.querySelector(`[data-run-id="${run.id}"]`);

const wrapperFor = entry =>
  function Wrapper({ children }) {
    return <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>;
  };
const setup = (entry = '/', scheduleId = 9) =>
  renderHook(() => useScheduleRunsView(scheduleId, 3), { wrapper: wrapperFor(entry) });
const mount = (result, section) => act(() => result.current.runsSectionRef(section));

describe('useScheduleRunsView EL-7011 CR-21', () => {
  beforeEach(() => mocks.applicationDetails.mockReturnValue({}));
  afterEach(() => {
    vi.clearAllMocks();
    mocks.runs = [];
    mocks.loaded = true;
  });

  it('R5.6 Run History expands a collapsed Runs section, scrolls to it and focuses the newest row', () => {
    mocks.runs = [cron, waiting];
    const section = makeSection(mocks.runs);
    const { result } = setup();
    mount(result, section);
    act(() => result.current.setRunsExpanded(false));

    act(() => result.current.showRunHistory());

    expect(result.current.runsExpanded).toBe(true);
    expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(rowOf(section, waiting).focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(result.current.viewedRun).toBeUndefined();
  });

  it('R4.6 Run History with a run id selects the run, focuses its row and announces it', () => {
    mocks.runs = [cron, waiting];
    const section = makeSection(mocks.runs);
    const { result } = setup();
    mount(result, section);

    act(() => result.current.showRunHistory({ runId: 2 }));

    expect(result.current.viewedRun).toBe(waiting);
    expect(rowOf(section, waiting).focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(rowOf(section, waiting).scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    expect(result.current.announcement).toMatch(/^Showing run .*, cron, Waiting for input$/);
  });

  it('R5.6 Run History called with a click event shows the list and selects no run', () => {
    mocks.runs = [cron];
    const section = makeSection(mocks.runs);
    const { result } = setup();
    mount(result, section);

    act(() => result.current.showRunHistory({ type: 'click', runId: undefined, target: {} }));

    expect(result.current.viewedRun).toBeUndefined();
    expect(result.current.announcement).toBe('Showing the runs of this schedule');
    expect(() => act(() => result.current.showRunHistory(null))).not.toThrow();
  });

  it('R4.7 #runs scrolls once the Runs section mounts, even when it mounts after the schedule', () => {
    mocks.runs = [cron];
    const section = makeSection(mocks.runs);
    const { result } = setup('/#runs');

    // The schedule is there, the section is not yet
    expect(section.scrollIntoView).not.toHaveBeenCalled();
    mount(result, section);

    expect(section.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(rowOf(section, cron).focus).toHaveBeenCalled();
  });

  it('R4.7 #runs waits for the schedule, then scrolls only once', () => {
    mocks.runs = [cron];
    const section = makeSection(mocks.runs);
    const { result, rerender } = renderHook(({ id }) => useScheduleRunsView(id, 3), {
      initialProps: { id: undefined },
      wrapper: wrapperFor('/#runs'),
    });
    mount(result, section);
    expect(section.scrollIntoView).not.toHaveBeenCalled();

    rerender({ id: 9 });
    rerender({ id: 9 });

    expect(section.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('R4.7 #runs waits for the runs to load before it picks a row', () => {
    mocks.loaded = false;
    mocks.runs = [];
    const section = makeSection([cron]);
    const { result, rerender } = setup('/#runs');
    mount(result, section);
    expect(section.scrollIntoView).not.toHaveBeenCalled();

    mocks.loaded = true;
    mocks.runs = [cron];
    rerender();

    expect(rowOf(section, cron).focus).toHaveBeenCalled();
  });

  it('does not scroll or move focus without #runs and without history_run_id', () => {
    mocks.runs = [cron];
    const section = makeSection(mocks.runs);
    const { result } = setup('/');
    mount(result, section);

    expect(section.scrollIntoView).not.toHaveBeenCalled();
    expect(rowOf(section, cron).focus).not.toHaveBeenCalled();
  });

  it('R5.6 history_run_id selects the linked run, scrolls to its row and announces it', () => {
    mocks.runs = [cron, waiting];
    const section = makeSection(mocks.runs);
    const { result } = setup('/?history_run_id=90');
    expect(result.current.viewedRun).toBe(waiting);
    mount(result, section);

    expect(section.scrollIntoView).toHaveBeenCalled();
    expect(rowOf(section, waiting).focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(result.current.announcement).toMatch(/^Showing run .*, cron, Waiting for input$/);
    expect(result.current.runNotFound).toBe(false);
  });

  it('R4.6 an unknown history_run_id shows no run, flags it and focuses the section', () => {
    mocks.runs = [cron, waiting];
    const section = makeSection(mocks.runs);
    const { result } = setup('/?history_run_id=5');
    mount(result, section);

    expect(result.current.viewedRun).toBeUndefined();
    expect(result.current.runNotFound).toBe(true);
    expect(section.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(rowOf(section, cron).focus).not.toHaveBeenCalled();
  });

  it('R4.7 a new #runs request after the hash changes scrolls again', () => {
    mocks.runs = [cron];
    const section = makeSection(mocks.runs);
    const holder = { current: null };
    const { result } = renderHook(() => useScheduleRunsView(9, 3), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/#runs']}>
          <HashLink holder={holder} />
          {children}
        </MemoryRouter>
      ),
    });
    mount(result, section);
    expect(section.scrollIntoView).toHaveBeenCalledTimes(1);

    act(() => holder.current('/'));
    act(() => holder.current('/#runs'));

    expect(section.scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('Open shows that run in the panel and scrolls to the panel below xl; Back to test returns', () => {
    mocks.runs = [cron, waiting];
    const { result } = setup();
    const scrollIntoView = vi.fn();
    result.current.panelRef.current = { scrollIntoView };
    expect(result.current.viewedRun).toBeUndefined();

    act(() => result.current.openRun(cron));
    expect(result.current.viewedRun).toBe(cron);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    act(() => result.current.backToTest());
    expect(result.current.viewedRun).toBeUndefined();
  });

  it('Open does not scroll the page at xl, where the panel and the list are both in view', () => {
    mocks.runs = [cron];
    window.matchMedia = vi.fn(query => ({ matches: query.includes('min-width') }));
    const { result } = setup();
    const scrollIntoView = vi.fn();
    result.current.panelRef.current = { scrollIntoView };

    act(() => result.current.openRun(cron));

    expect(scrollIntoView).not.toHaveBeenCalled();
    delete window.matchMedia;
  });

  it('uses no smooth scroll when the person prefers reduced motion', () => {
    mocks.runs = [cron];
    window.matchMedia = vi.fn(query => ({ matches: query.includes('prefers-reduced-motion') }));
    const section = makeSection(mocks.runs);
    const { result } = setup();
    mount(result, section);

    act(() => result.current.showRunHistory());

    expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    delete window.matchMedia;
  });

  it('R1.2 TC-US41-04 shows the run of the notice link (history_run_id) in the panel', () => {
    mocks.runs = [cron, waiting];
    expect(setup('/?history_run_id=90').result.current.viewedRun).toBe(waiting);
    expect(setup('/?history_run_id=5').result.current.viewedRun).toBeUndefined();
  });

  it('names the versions of the schedule agent for the Version column and the prompt chip', () => {
    mocks.applicationDetails.mockReturnValue({
      currentData: {
        versions: [
          { id: 4, name: 'v3' },
          { id: 5, name: 'base' },
        ],
      },
    });
    const { result } = setup();

    expect(mocks.applicationDetails).toHaveBeenCalledWith(
      { projectId: 5, applicationId: 3 },
      { skip: false },
    );
    expect(result.current.versionNames).toEqual({ 4: 'v3', 5: 'base' });
  });
});

// Navigates the test router, as a menu entry does on the open page
function HashLink({ holder }) {
  const navigate = useNavigate();
  holder.current = navigate;
  return null;
}
