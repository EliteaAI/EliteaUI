// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ScheduleDetailPage from '../ScheduleDetailPage';

// EL-7011 US-32: the Edit schedule page loads one schedule, saves it and starts a test run

const BROWSER_ZONE = 'Europe/Kyiv';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  updateSchedule: vi.fn(),
  runSchedule: vi.fn(),
  setFieldValue: vi.fn(),
  projectId: 5,
  query: {},
  formProps: null,
  settingsProps: null,
  params: { scheduleId: '9' },
  state: { returnTo: '/settings/schedules' },
  panelProps: null,
  sectionProps: null,
  testRunProps: { onTestRun: () => {}, testRunPending: true, testRunError: 'Already running' },
  runsView: null,
  runsViewArgs: null,
  menuProps: null,
}));

vi.mock('../ScheduleDetailMenu', () => ({
  default: props => {
    mocks.menuProps = props;
    return <span data-testid="schedule-detail-menu" />;
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
  useLocation: () => ({ state: mocks.state }),
}));
vi.mock('@/[fsd]/entities/schedule', async importOriginal => ({
  ...(await importOriginal()),
  useGetScheduleQuery: () => mocks.query,
  useUpdateScheduleMutation: () => [mocks.updateSchedule],
  useRunScheduleMutation: () => [mocks.runSchedule],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => mocks.projectId,
  useViewMode: () => 'owner',
}));
vi.mock('@/[fsd]/shared/lib/helpers', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    ScheduleHelpers: { ...actual.ScheduleHelpers, getBrowserTimezone: () => BROWSER_ZONE },
  };
});
vi.mock('@/[fsd]/shared/ui/schedule', () => ({
  ScheduleSettingsSection: props => {
    mocks.settingsProps = props;
    return null;
  },
  StopOnDateField: () => null,
}));
vi.mock('@/[fsd]/features/schedule', async importOriginal => {
  const { forwardRef } = await import('react');
  // The page gives the panel a ref for the scroll to it
  const ScheduleRunsPanel = forwardRef(props => {
    mocks.panelProps = props;
    return null;
  });
  ScheduleRunsPanel.displayName = 'ScheduleRunsPanel';
  return {
    ...(await importOriginal()),
    useScheduleRunsView: (...args) => {
      mocks.runsViewArgs = args;
      return mocks.runsView;
    },
    ScheduleRunsSection: forwardRef(props => {
      mocks.sectionProps = props;
      return null;
    }),
    ScheduleRunsPanel,
    ScheduleForm: props => {
      mocks.formProps = props;
      return (
        <>
          <button onClick={() => props.onSubmit({ name: 'Renamed' }).then(props.onSaved)}>Save</button>
          <button onClick={() => props.onTestRun()}>Test</button>
          {props.headerActions}
          {props.children({ values: props.initialValues, setFieldValue: mocks.setFieldValue })}
          {props.sidePanel?.(mocks.testRunProps)}
        </>
      );
    },
  };
});

const schedule = {
  id: 9,
  name: 'Nightly',
  entity_type: 'agent',
  application_id: 3,
  version_id: 4,
  run_mode: 'entry_point',
  cron: '0 0 * * 6',
  timezone: 'UTC',
  expires_at: null,
};

const listLink = () => screen.getByRole('link', { name: 'Schedules' });
const makeRunsView = () => ({
  runs: [{ id: 1 }],
  viewedRun: { id: 1 },
  versionNames: { 4: 'v3' },
  runsExpanded: true,
  setRunsExpanded: vi.fn(),
  runsSectionRef: { current: null },
  panelRef: { current: null },
  openRun: vi.fn(),
  backToTest: vi.fn(),
  showRunHistory: vi.fn(),
  announcement: 'Showing run 21 Oct, 09:00, cron, Success',
  runNotFound: false,
});

describe('ScheduleDetailPage EL-7011', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.projectId = 5;
    mocks.formProps = null;
    mocks.menuProps = null;
    mocks.settingsProps = null;
    mocks.panelProps = null;
    mocks.sectionProps = null;
    mocks.query = {};
    mocks.params = { scheduleId: '9' };
    mocks.state = { returnTo: '/settings/schedules' };
  });
  beforeEach(() => {
    mocks.runsView = makeRunsView();
  });

  it('TC-US32-01 R1.1 EL-7011 fills the form with the saved schedule, its name and the run list', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);

    expect(mocks.formProps.schedule).toBe(schedule);
    expect(mocks.formProps.entityName).toBe('Nightly');
    expect(mocks.formProps.initialValues.name).toBe('Nightly');
  });

  it('TC-US32-15 R3 R4 EL-7011 shows the test panel next to the form and the Runs section under it (owner CR 2026-10-21)', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);
    const view = mocks.runsView;

    expect(mocks.runsViewArgs).toEqual([9, 3]);
    expect(mocks.panelProps).toEqual({
      schedule,
      runs: view.runs,
      viewedRun: view.viewedRun,
      versionNames: view.versionNames,
      onRunHistory: view.showRunHistory,
      onBackToTest: view.backToTest,
      ...mocks.testRunProps,
    });
  });

  it('TC-US32-20 R4.1 R4.6 EL-7011 CR-21 renders the Runs section in the right block, with no afterForm', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);
    const view = mocks.runsView;

    expect(mocks.formProps.afterForm).toBeUndefined();
    expect(mocks.sectionProps).toEqual({
      runs: view.runs,
      versionNames: view.versionNames,
      selectedRunId: 1,
      onOpen: view.openRun,
      expanded: true,
      onExpandedChange: view.setRunsExpanded,
      announcement: view.announcement,
      runNotFound: false,
      fullHistoryLink: '/agents/all/3/history?schedule_id=9', // CR-22 (US-32 R6.3)
    });
  });

  it('TC-US32-20 R4.1 EL-7011 CR-21 stacks the panel and the Runs section in one block, sticky from xl in a tall window', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);
    const block = screen.getByTestId('schedule-right-block');

    expect(getComputedStyle(block).display).toBe('flex');
    expect(getComputedStyle(block).flexDirection).toBe('column');
    // jsdom does not match media queries, so the sticky rule is read from the emitted CSS
    const css = [...document.querySelectorAll('style')].map(tag => tag.textContent).join('');
    expect(css).toMatch(
      /@media \(min-width:1536px\) and \(min-height: ?46rem\)\{[^}]*position:sticky[^}]*height:calc\(100dvh - 6rem\)/,
    );
    expect(getComputedStyle(block).position).not.toBe('sticky');
  });

  it('CR-21 R4.1 EL-7011 gives the block the full window height minus 6 rem from xl, so the runs card is 40 % of it', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);
    screen.getByTestId('schedule-right-block');

    const css = [...document.querySelectorAll('style')].map(tag => tag.textContent).join('');
    const sticky = css.match(
      /@media \(min-width:1536px\) and \(min-height: ?46rem\)\{[^}]*position:sticky[^}]*\}/,
    )[0];
    // A fixed height, not only a maximum: with max-height alone the block shrinks to its content (live check)
    expect(sticky).toMatch(/[{;]height:calc\(100dvh - 6rem\)/);
  });

  it('CR-16 R4.3 EL-7011 puts the schedule menu in the form header', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);

    expect(screen.getByTestId('schedule-detail-menu')).toBeInTheDocument();
    expect(mocks.menuProps).toEqual({ schedule, projectId: 5 });
  });

  it('TC-US32-01 R1.1 EL-7011 shows a loader while the schedule loads', () => {
    mocks.query = { isLoading: true };
    render(<ScheduleDetailPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(mocks.formProps).toBeNull();
  });

  it('TC-US32-02 R1.2 EL-7011 shows the not-found state with a link to the Schedules list on a 404', () => {
    mocks.query = { isError: true, error: { status: 404 } };
    render(<ScheduleDetailPage />);

    expect(screen.getByText(/not found/)).toBeInTheDocument();
    expect(listLink()).toHaveAttribute('href', '/settings/schedules');
    expect(mocks.formProps).toBeNull();
  });

  it('TC-US32-02 R1.2 EL-7011 shows an error state with a link to the list on another error', () => {
    mocks.query = { isError: true, error: { status: 500 } };
    render(<ScheduleDetailPage />);

    expect(screen.getByText(/Failed to load the schedule/)).toBeInTheDocument();
    expect(listLink()).toHaveAttribute('href', '/settings/schedules');
  });

  it('TC-US32-04 R1.4 EL-7011 opens the list when the project changes', () => {
    mocks.query = { currentData: schedule };
    const { rerender } = render(<ScheduleDetailPage />);
    expect(mocks.navigate).not.toHaveBeenCalled();

    mocks.projectId = 6;
    rerender(<ScheduleDetailPage />);
    expect(mocks.navigate).toHaveBeenCalledWith('/settings/schedules', { replace: true });
  });

  it('TC-US32-04 R1.4 EL-7011 waits for the first project id before it guards a project switch', () => {
    mocks.projectId = undefined;
    const { rerender } = render(<ScheduleDetailPage />);

    mocks.projectId = 5;
    mocks.query = { currentData: schedule };
    rerender(<ScheduleDetailPage />);
    expect(mocks.navigate).not.toHaveBeenCalled();

    mocks.projectId = 6;
    rerender(<ScheduleDetailPage />);
    expect(mocks.navigate).toHaveBeenCalledWith('/settings/schedules', { replace: true });
  });

  it('TC-US32-05 R2.1 EL-7011 sends the update and returns to the opening page', async () => {
    mocks.query = { currentData: schedule };
    mocks.updateSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 9 }) });
    render(<ScheduleDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/settings/schedules'));
    expect(mocks.updateSchedule).toHaveBeenCalledWith({ projectId: 5, scheduleId: '9', name: 'Renamed' });
  });

  it('TC-US32-06 R2.1 EL-7011 keeps the schedule zone in the form and shows the cron in the browser zone', () => {
    const tokyo = {
      ...schedule,
      cron: '0 9 * * 6',
      timezone: 'Asia/Tokyo',
      expires_at: '2026-12-31T20:00:00+00:00',
    };
    mocks.query = { currentData: tokyo };
    render(<ScheduleDetailPage />);

    expect(mocks.formProps.initialValues).toMatchObject({
      cron: '0 9 * * 6',
      timezone: 'Asia/Tokyo',
      expires_at: '2027-01-01',
    });
    expect(mocks.settingsProps.value).toMatch(/^0 [23] \* \* 6$/);

    mocks.settingsProps.onChange('0 3 * * 6');
    expect(mocks.setFieldValue).toHaveBeenCalledWith('cron', '0 3 * * 6');
    expect(mocks.setFieldValue).toHaveBeenCalledWith('timezone', BROWSER_ZONE);
  });

  it('TC-US32-15 R1.1 EL-7011 starts a test run through the run endpoint', async () => {
    mocks.query = { currentData: schedule };
    mocks.runSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });
    render(<ScheduleDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));

    await waitFor(() =>
      expect(mocks.runSchedule).toHaveBeenCalledWith({ projectId: 5, scheduleId: '9', trigger: 'test' }),
    );
  });

  it('TC-US35-10 R3.5 R4.1 EL-7011 nested in the agent editor, locks the agent, names it in the crumbs and returns to it', async () => {
    mocks.params = { tab: 'all', agentId: '3', scheduleId: '9' };
    mocks.state = null;
    mocks.query = { currentData: schedule };
    mocks.updateSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 9 }) });
    render(<ScheduleDetailPage entityType="agent" />);

    expect(mocks.formProps.lockedEntity).toEqual({ type: 'agent', id: 3 });
    expect(mocks.formProps.entityName).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/agents/all/3?viewMode=owner'));
  });

  it('TC-US35-10 R3.5 EL-7011 nested in the agent editor, shows not found for a schedule of another agent', () => {
    mocks.params = { tab: 'all', agentId: '12', scheduleId: '9' };
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage entityType="agent" />);

    expect(screen.getByText(/Schedule not found/)).toBeInTheDocument();
    expect(listLink()).toHaveAttribute('href', '/settings/schedules');
    expect(mocks.formProps).toBeNull();
  });

  it('TC-US36-08 R3.5 EL-7011 nested in the pipeline editor, shows not found for a schedule of an agent', () => {
    mocks.params = { tab: 'all', agentId: '3', scheduleId: '9' };
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage entityType="pipeline" />);

    expect(screen.getByText(/Schedule not found/)).toBeInTheDocument();
    expect(mocks.formProps).toBeNull();
  });
});
