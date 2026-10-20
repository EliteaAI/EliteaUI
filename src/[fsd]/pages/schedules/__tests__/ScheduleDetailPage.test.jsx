// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

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
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
  useNavigate: () => mocks.navigate,
  useParams: () => ({ scheduleId: '9' }),
  useLocation: () => ({ state: { returnTo: '/settings/schedules' } }),
}));
vi.mock('@/[fsd]/entities/schedule', () => ({
  useGetScheduleQuery: () => mocks.query,
  useUpdateScheduleMutation: () => [mocks.updateSchedule],
  useRunScheduleMutation: () => [mocks.runSchedule],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => mocks.projectId }));
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
vi.mock('@/[fsd]/features/schedule', async importOriginal => ({
  ...(await importOriginal()),
  ScheduleRunList: () => null,
  ScheduleForm: props => {
    mocks.formProps = props;
    return (
      <>
        <button onClick={() => props.onSubmit({ name: 'Renamed' }).then(props.onSaved)}>Save</button>
        <button onClick={() => props.onTestRun()}>Test</button>
        {props.children({ values: props.initialValues, setFieldValue: mocks.setFieldValue })}
      </>
    );
  },
}));

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

describe('ScheduleDetailPage EL-7011', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.projectId = 5;
    mocks.formProps = null;
    mocks.settingsProps = null;
    mocks.query = {};
  });

  it('TC-US32-01 R1.1 EL-7011 fills the form with the saved schedule, its name and the run list', () => {
    mocks.query = { currentData: schedule };
    render(<ScheduleDetailPage />);

    expect(mocks.formProps.schedule).toBe(schedule);
    expect(mocks.formProps.entityName).toBe('Nightly');
    expect(mocks.formProps.initialValues.name).toBe('Nightly');
    expect(mocks.formProps.extraSections[0].title).toBe('RUNS OF THIS SCHEDULE');
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
});
