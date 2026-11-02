// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import CreateSchedulePage from '../CreateSchedulePage';

// the page wires the form to the create API and returns to returnTo

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  createSchedule: vi.fn(),
  startDraftTestRun: vi.fn(),
  cancelDraftTestRun: vi.fn(),
  draftRunsProps: null,
  settingsProps: null,
  stopProps: null,
  fieldErrors: {},
  formProps: null,
  params: {},
  state: { returnTo: '/agents/3' },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams('')],
  useLocation: () => ({ state: mocks.state }),
  useParams: () => mocks.params,
}));
vi.mock('@/[fsd]/entities/schedule', async importOriginal => ({
  ...(await importOriginal()),
  useCreateScheduleMutation: () => [mocks.createSchedule],
  useStartDraftTestRunMutation: () => [mocks.startDraftTestRun],
  useCancelDraftTestRunMutation: () => [mocks.cancelDraftTestRun],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5, useViewMode: () => 'owner' }));
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
  const { toCreateBody } = await import('@/[fsd]/features/schedule/lib/helpers');
  return {
    ...(await importOriginal()),
    ScheduleDraftRuns: props => {
      mocks.draftRunsProps = props;
      return null;
    },
    ScheduleForm: props => {
      const { initialValues, onSubmit, onSaved, children } = props;
      mocks.formProps = props;
      return (
        <>
          {children({
            values: initialValues,
            setFieldValue: vi.fn(),
            fieldError: name => mocks.fieldErrors[name] ?? '',
          })}
          {props.sidePanel({ values: initialValues, onTestRun: 'test-run', testRunPending: false })}
          <button onClick={() => props.onCancel(initialValues)}>Cancel</button>
          <button onClick={() => props.onDraftTestRun({ name: 'Draft' })}>Test run</button>
          <button onClick={async () => onSaved(await onSubmit(toCreateBody(initialValues)))}>Save</button>
        </>
      );
    },
  };
});

describe('CreateSchedulePage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.params = {};
    mocks.fieldErrors = {};
    mocks.stopProps = null;
    mocks.draftRunsProps = null;
    mocks.state = { returnTo: '/agents/3' };
  });

  it('sends the schedule settings with enabled and returns to returnTo', async () => {
    mocks.createSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });
    render(<CreateSchedulePage />);

    expect(mocks.settingsProps.value).toBe('0 0 * * 6');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/agents/3'));
    expect(mocks.createSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 5,
        cron: '0 0 * * 6',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        expires_at: null,
        enabled: true,
      }),
    );
  });

  it('gives the stop date field the schedule timezone', () => {
    render(<CreateSchedulePage />);

    expect(mocks.stopProps.timezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it('navigates through onSaved with the save answer, not inside onSubmit', async () => {
    mocks.createSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1, warnings: [] }) });
    render(<CreateSchedulePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledTimes(1));
    expect(mocks.createSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ approval_rule: 'pause_and_ask' }),
    );
  });

  it('TC-US35-08 nested in the agent editor, locks the agent and returns to the editor', async () => {
    mocks.params = { tab: 'all', agentId: '12' };
    mocks.state = null;
    mocks.createSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });
    render(<CreateSchedulePage entityType="agent" />);

    expect(mocks.formProps.lockedEntity).toEqual({ type: 'agent', id: 12 });
    expect(mocks.formProps.initialValues).toMatchObject({ type: 'agent', application_id: 12 });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/agents/all/12?viewMode=owner'));
  });

  it('shows the server cron error under the cron field', () => {
    mocks.fieldErrors = { cron: 'Runs must be at least 5 minutes apart' };
    render(<CreateSchedulePage />);

    expect(mocks.settingsProps.error).toBe('Runs must be at least 5 minutes apart');
  });

  it('shows the server stop date error under the date field', () => {
    mocks.fieldErrors = { expires_at: 'Stop date is in the past' };
    render(<CreateSchedulePage />);

    expect(mocks.stopProps.error).toBe('Stop date is in the past');
  });

  it('shows the Runs card of the form entity with the Test Run handler', () => {
    mocks.params = { tab: 'all', agentId: '12' };
    render(<CreateSchedulePage entityType="agent" />);

    expect(mocks.draftRunsProps).toMatchObject({
      entityType: 'agent',
      applicationId: 12,
      onTestRun: 'test-run',
    });
  });

  it('Test Run sends the draft body with the project id', async () => {
    mocks.startDraftTestRun.mockReturnValue({ unwrap: () => Promise.resolve({ run_id: 1 }) });
    render(<CreateSchedulePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Test run' }));

    await waitFor(() =>
      expect(mocks.startDraftTestRun).toHaveBeenCalledWith({ projectId: 5, name: 'Draft' }),
    );
  });

  it('Cancel drops the Test draft of the chosen agent and returns', () => {
    mocks.params = { tab: 'all', agentId: '12' };
    mocks.state = null;
    render(<CreateSchedulePage entityType="agent" />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mocks.cancelDraftTestRun).toHaveBeenCalledWith({ projectId: 5, applicationId: 12 });
    expect(mocks.navigate).toHaveBeenCalledWith('/agents/all/12?viewMode=owner');
  });

  it('Cancel without a chosen entity only returns', () => {
    render(<CreateSchedulePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mocks.cancelDraftTestRun).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith('/agents/3');
  });
});
