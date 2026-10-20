// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ScheduleDetailPage from '../ScheduleDetailPage';

// EL-7011 US-32: the Edit schedule page loads one schedule, saves it and starts a test run

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  updateSchedule: vi.fn(),
  runSchedule: vi.fn(),
  projectId: 5,
  query: { data: undefined, isError: false, error: undefined, isLoading: false },
  formProps: null,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => ({ scheduleId: '9' }),
  useLocation: () => ({ state: { returnTo: '/schedules' } }),
}));
vi.mock('@/[fsd]/entities/schedule', () => ({
  useGetScheduleQuery: () => mocks.query,
  useUpdateScheduleMutation: () => [mocks.updateSchedule],
  useRunScheduleMutation: () => [mocks.runSchedule],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => mocks.projectId }));
vi.mock('@/[fsd]/shared/ui/schedule', () => ({
  ScheduleSettingsSection: () => null,
  StopOnDateField: () => null,
}));
vi.mock('@/pages/Page404.jsx', () => ({ default: () => <div>not found</div> }));
vi.mock('@/[fsd]/features/schedule', async importOriginal => ({
  ...(await importOriginal()),
  ScheduleRunList: () => null,
  ScheduleForm: props => {
    mocks.formProps = props;
    return (
      <>
        <button onClick={() => props.onSubmit({ name: 'Renamed' }).then(props.onSaved)}>Save</button>
        <button onClick={() => props.onTestRun()}>Test</button>
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

describe('ScheduleDetailPage EL-7011', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.projectId = 5;
    mocks.formProps = null;
    mocks.query = { data: undefined, isError: false, error: undefined, isLoading: false };
  });

  it('TC-US32-01 R1.1 EL-7011 fills the form with the saved schedule, its name and the run list', () => {
    mocks.query = { ...mocks.query, data: schedule };
    render(<ScheduleDetailPage />);

    expect(mocks.formProps.schedule).toBe(schedule);
    expect(mocks.formProps.entityName).toBe('Nightly');
    expect(mocks.formProps.initialValues.name).toBe('Nightly');
    expect(mocks.formProps.extraSections[0].title).toBe('RUNS OF THIS SCHEDULE');
  });

  it('TC-US32-02 R1.2 EL-7011 shows the not-found page on a 404', () => {
    mocks.query = { ...mocks.query, isError: true, error: { status: 404 } };
    render(<ScheduleDetailPage />);

    expect(screen.getByText('not found')).toBeInTheDocument();
    expect(mocks.formProps).toBeNull();
  });

  it('TC-US32-04 R1.4 EL-7011 opens the list when the project changes', () => {
    mocks.query = { ...mocks.query, data: schedule };
    const { rerender } = render(<ScheduleDetailPage />);
    expect(mocks.navigate).not.toHaveBeenCalled();

    mocks.projectId = 6;
    rerender(<ScheduleDetailPage />);
    expect(mocks.navigate).toHaveBeenCalledWith('/schedules', { replace: true });
  });

  it('TC-US32-05 R2.1 EL-7011 sends the update and returns to the opening page', async () => {
    mocks.query = { ...mocks.query, data: schedule };
    mocks.updateSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 9 }) });
    render(<ScheduleDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/schedules'));
    expect(mocks.updateSchedule).toHaveBeenCalledWith({ projectId: 5, scheduleId: '9', name: 'Renamed' });
  });

  it('TC-US32-15 R1.1 EL-7011 starts a test run through the run endpoint', async () => {
    mocks.query = { ...mocks.query, data: schedule };
    mocks.runSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });
    render(<ScheduleDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));

    await waitFor(() =>
      expect(mocks.runSchedule).toHaveBeenCalledWith({ projectId: 5, scheduleId: '9', trigger: 'test' }),
    );
  });
});
