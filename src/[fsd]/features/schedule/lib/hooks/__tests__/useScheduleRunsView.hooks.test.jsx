// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useScheduleRunsView } from '../useScheduleRunsView.hooks';

// EL-7011 owner CR 2026-10-21 test panel log: the Runs section on the left and the run the panel shows

const mocks = vi.hoisted(() => ({ runs: [], applicationDetails: vi.fn() }));

vi.mock('../useScheduleRuns.hooks', () => ({ useScheduleRuns: () => mocks.runs }));
vi.mock('@/api/applications', () => ({ useApplicationDetailsQuery: mocks.applicationDetails }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));

const cron = { id: 1, trigger: 'cron', status: 'success', conversation_id: 70 };
const waiting = { id: 2, trigger: 'cron', status: 'waiting_for_approval', conversation_id: 90 };

const setup = (search = '') =>
  renderHook(() => useScheduleRunsView(9, 3), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[`/${search}`]}>{children}</MemoryRouter>,
  }).result;
const withScroll = ref => {
  const scrollIntoView = vi.fn();
  ref.current = { scrollIntoView };
  return scrollIntoView;
};

describe('useScheduleRunsView EL-7011 owner CR 2026-10-21', () => {
  beforeEach(() => mocks.applicationDetails.mockReturnValue({}));
  afterEach(() => {
    vi.clearAllMocks();
    mocks.runs = [];
  });

  it('Run History opens the Runs section and scrolls to it', () => {
    const result = setup();
    const scroll = withScroll(result.current.runsSectionRef);
    act(() => result.current.setRunsExpanded(false));

    act(() => result.current.showRunHistory());

    expect(result.current.runsExpanded).toBe(true);
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('R4.6 R6.1 EL-7011 CR-21 Run History with a run id selects it, expands, scrolls and focuses the Runs section', () => {
    mocks.runs = [cron, waiting];
    const result = setup();
    const scroll = withScroll(result.current.runsSectionRef);
    const focus = vi.fn();
    result.current.runsSectionRef.current.focus = focus;
    act(() => result.current.setRunsExpanded(false));

    act(() => result.current.showRunHistory({ runId: 2 }));

    expect(result.current.runsExpanded).toBe(true);
    expect(result.current.viewedRun).toBe(waiting);
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(focus).toHaveBeenCalled();
  });

  it('R6.2 EL-7011 CR-21 the #runs entry opens the Runs section and scrolls to it', () => {
    mocks.runs = [cron];
    const scroll = vi.fn();
    const Probe = () => {
      const view = useScheduleRunsView(9, 3);
      view.runsSectionRef.current ??= { scrollIntoView: scroll, focus: vi.fn() };
      return null;
    };
    const { rerender } = renderHook(() => null, {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/#runs']}>
          <Probe />
          {children}
        </MemoryRouter>
      ),
    });
    rerender();

    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('R5.6 EL-7011 CR-21 history_run_id also opens the Runs section on the linked run', () => {
    mocks.runs = [cron, waiting];
    const result = setup('?history_run_id=90');

    expect(result.current.runsExpanded).toBe(true);
    expect(result.current.viewedRun).toBe(waiting);
  });

  it('Open shows that run in the panel and scrolls to the panel; Back to test returns', () => {
    mocks.runs = [cron, waiting];
    const result = setup();
    const scroll = withScroll(result.current.panelRef);
    expect(result.current.viewedRun).toBeUndefined();

    act(() => result.current.openRun(cron));
    expect(result.current.viewedRun).toBe(cron);
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });

    act(() => result.current.backToTest());
    expect(result.current.viewedRun).toBeUndefined();
  });

  it('R1.2 TC-US41-04 shows the run of the notice link (history_run_id) in the panel', () => {
    mocks.runs = [cron, waiting];
    expect(setup('?history_run_id=90').current.viewedRun).toBe(waiting);
    expect(setup('?history_run_id=5').current.viewedRun).toBeUndefined();
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
    const result = setup();

    expect(mocks.applicationDetails).toHaveBeenCalledWith(
      { projectId: 5, applicationId: 3 },
      { skip: false },
    );
    expect(result.current.versionNames).toEqual({ 4: 'v3', 5: 'base' });
  });
});
