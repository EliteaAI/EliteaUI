// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ScheduleDetailPage from '../ScheduleDetailPage';

// the Edit schedule page loads one schedule, saves it and starts a test run

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
  stopProps: null,
  fieldErrors: {},
  params: { scheduleId: '9' },
  state: { returnTo: '/settings/schedules' },
  cardProps: null,
  startDraftTestRun: vi.fn(),
  cancelDraftTestRun: vi.fn(),
  testRunProps: { onRunNow: () => {}, runNowPending: true, runNowError: 'Already running' },
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
  useStartDraftTestRunMutation: () => [mocks.startDraftTestRun],
  useCancelDraftTestRunMutation: () => [mocks.cancelDraftTestRun],
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
  StopOnDateField: props => {
    mocks.stopProps = props;
    return null;
  },
}));
vi.mock('@/[fsd]/features/schedule', async importOriginal => {
  const { forwardRef } = await import('react');
  // The page gives the card a ref for the scroll to it
  const ScheduleRunsCard = forwardRef(props => {
    mocks.cardProps = props;
    return null;
  });
  ScheduleRunsCard.displayName = 'ScheduleRunsCard';
  return {
    ...(await importOriginal()),
    useScheduleRunsView: (...args) => {
      mocks.runsViewArgs = args;
      return mocks.runsView;
    },
    ScheduleRunsCard,
    ScheduleForm: props => {
      mocks.formProps = props;
      return (
        <>
          <button onClick={() => props.onSubmit({ name: 'Renamed' }).then(props.onSaved)}>Save</button>
          <button onClick={() => props.onRunNow()}>Run now</button>
          <button onClick={() => props.onDraftTestRun({ name: 'Draft' })}>Test run</button>
          <button onClick={() => props.onCancel()}>Cancel</button>
          {props.headerActions}
          {props.children({
            values: props.initialValues,
            setFieldValue: mocks.setFieldValue,
            fieldError: name => mocks.fieldErrors[name] ?? '',
          })}
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
  shownRuns: [{ id: 1 }],
  total: 1,
  versionNames: { 4: 'v3' },
  expandedRunId: 1,
  onExpand: vi.fn(),
  cardRef: { current: null },
});

describe('ScheduleDetailPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.projectId = 5;
    mocks.fieldErrors = {};
    mocks.stopProps = null;
    mocks.formProps = null;
    mocks.menuProps = null;
    mocks.settingsProps = null;
    mocks.cardProps = null;
    mocks.query = {};
    mocks.params = { scheduleId: '9' };
    mocks.state = { returnTo: '/settings/schedules' };
  });
  beforeEach(() => {
    mocks.runsView = makeRunsView();
  });

  it('TC-US32-01 fills the form with the saved schedule, its name and the run list', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);

    expect(mocks.formProps.schedule).toBe(schedule);
    expect(mocks.formProps.entityName).toBe('Nightly');
    expect(mocks.formProps.initialValues.name).toBe('Nightly');
  });

  it('shows the Runs card next to the form with the view of the saved schedule', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);

    expect(mocks.runsViewArgs).toEqual([9, 3]);
    expect(mocks.cardProps).toMatchObject({
      schedule,
      entityType: 'agent',
      applicationId: 3,
      view: mocks.runsView,
      ...mocks.testRunProps,
    });
    expect(mocks.formProps.afterForm).toBeUndefined();
  });

  it('puts the schedule menu in the form header', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);

    expect(screen.getByTestId('schedule-detail-menu')).toBeInTheDocument();
    expect(mocks.menuProps).toEqual({ schedule });
  });

  it('TC-US32-01 shows a loader while the schedule loads', () => {
    mocks.query = { isLoading: true };
    render(<ScheduleDetailPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(mocks.formProps).toBeNull();
  });

  it('TC-US32-02 shows the not-found state with a link to the Schedules list on a 404', () => {
    mocks.query = { isError: true, error: { status: 404 } };
    render(<ScheduleDetailPage />);

    expect(screen.getByText(/not found/)).toBeInTheDocument();
    expect(listLink()).toHaveAttribute('href', '/settings/schedules');
    expect(mocks.formProps).toBeNull();
  });

  it('TC-US32-02 shows an error state with a link to the list on another error', () => {
    mocks.query = { isError: true, error: { status: 500 } };
    render(<ScheduleDetailPage />);

    expect(screen.getByText(/Failed to load the schedule/)).toBeInTheDocument();
    expect(listLink()).toHaveAttribute('href', '/settings/schedules');
  });

  it('TC-US32-04 opens the list when the project changes', () => {
    mocks.query = { currentData: schedule };
    const { rerender } = render(<ScheduleDetailPage />);
    expect(mocks.navigate).not.toHaveBeenCalled();

    mocks.projectId = 6;
    rerender(<ScheduleDetailPage tick={1} />);
    expect(mocks.navigate).toHaveBeenCalledWith('/settings/schedules', { replace: true });
  });

  it('TC-US32-04 waits for the first project id before it guards a project switch', () => {
    mocks.projectId = undefined;
    const { rerender } = render(<ScheduleDetailPage />);

    mocks.projectId = 5;
    mocks.query = { currentData: schedule };
    rerender(<ScheduleDetailPage tick={2} />);
    expect(mocks.navigate).not.toHaveBeenCalled();

    mocks.projectId = 6;
    rerender(<ScheduleDetailPage tick={3} />);
    expect(mocks.navigate).toHaveBeenCalledWith('/settings/schedules', { replace: true });
  });

  it('TC-US32-05 sends the update and returns to the opening page', async () => {
    mocks.query = { currentData: schedule };
    mocks.updateSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 9 }) });
    render(<ScheduleDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/settings/schedules'));
    expect(mocks.updateSchedule).toHaveBeenCalledWith({ projectId: 5, scheduleId: '9', name: 'Renamed' });
  });

  it('TC-US32-06 keeps the schedule zone in the form and shows the cron in the browser zone', () => {
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

  it('gives the stop date field the schedule timezone, not the browser one', () => {
    mocks.query = { currentData: { ...schedule, timezone: 'Asia/Tokyo' } };
    render(<ScheduleDetailPage />);

    expect(mocks.stopProps.timezone).toBe('Asia/Tokyo');
  });

  it('Run Now starts a manual run through the run endpoint', async () => {
    mocks.query = { currentData: schedule };
    mocks.runSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });
    render(<ScheduleDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Run now' }));

    await waitFor(() =>
      expect(mocks.runSchedule).toHaveBeenCalledWith({ projectId: 5, scheduleId: '9', trigger: 'manual' }),
    );
  });

  it('Test Run sends the draft body of the form with the project id', async () => {
    mocks.query = { currentData: schedule };
    mocks.startDraftTestRun.mockReturnValue({ unwrap: () => Promise.resolve({ run_id: 4 }) });
    render(<ScheduleDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Test run' }));

    await waitFor(() =>
      expect(mocks.startDraftTestRun).toHaveBeenCalledWith({ projectId: 5, name: 'Draft' }),
    );
  });

  it('Cancel drops the Test draft of the agent and returns to the opening page', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mocks.cancelDraftTestRun).toHaveBeenCalledWith({ projectId: 5, applicationId: 3 });
    expect(mocks.navigate).toHaveBeenCalledWith('/settings/schedules');
  });

  it('TC-US35-10 nested in the agent editor, locks the agent, names it in the crumbs and returns to it', async () => {
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

  it('TC-US35-10 nested in the agent editor, shows not found for a schedule of another agent', () => {
    mocks.params = { tab: 'all', agentId: '12', scheduleId: '9' };
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage entityType="agent" />);

    expect(screen.getByText(/Schedule not found/)).toBeInTheDocument();
    expect(listLink()).toHaveAttribute('href', '/settings/schedules');
    expect(mocks.formProps).toBeNull();
  });

  it('TC-US36-08 nested in the pipeline editor, shows not found for a schedule of an agent', () => {
    mocks.params = { tab: 'all', agentId: '3', scheduleId: '9' };
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage entityType="pipeline" />);

    expect(screen.getByText(/Schedule not found/)).toBeInTheDocument();
    expect(mocks.formProps).toBeNull();
  });

  it('shows the server cron error under the cron field', () => {
    mocks.fieldErrors = { cron: 'Runs must be at least 5 minutes apart' };
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);

    expect(mocks.settingsProps.error).toBe('Runs must be at least 5 minutes apart');
  });

  it('shows the server stop date error under the date field', () => {
    mocks.fieldErrors = { expires_at: 'Stop date is in the past' };
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);

    expect(mocks.stopProps.error).toBe('Stop date is in the past');
  });
});
