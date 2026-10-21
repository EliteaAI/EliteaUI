// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import CreateSchedulePage from '../CreateSchedulePage';

// EL-7011 US-31: the page wires the form to the create API and returns to returnTo

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  createSchedule: vi.fn(),
  settingsProps: null,
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
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5, useViewMode: () => 'owner' }));
vi.mock('@/[fsd]/shared/ui/schedule', () => ({
  ScheduleSettingsSection: props => {
    mocks.settingsProps = props;
    return null;
  },
  StopOnDateField: () => null,
}));
vi.mock('@/[fsd]/features/schedule', async importOriginal => {
  const { toCreateBody } = await import('@/[fsd]/features/schedule/lib/helpers');
  return {
    ...(await importOriginal()),
    ScheduleForm: props => {
      const { initialValues, onSubmit, onSaved, children } = props;
      mocks.formProps = props;
      return (
        <>
          {children({ values: initialValues, setFieldValue: vi.fn() })}
          <button onClick={async () => onSaved(await onSubmit(toCreateBody(initialValues)))}>Save</button>
        </>
      );
    },
  };
});

describe('CreateSchedulePage EL-7011', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.params = {};
    mocks.state = { returnTo: '/agents/3' };
  });

  it('R6.1 R6.5 EL-7011 sends the schedule settings with enabled and returns to returnTo', async () => {
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

  it('R2.4 R2.5 EL-7011 navigates through onSaved with the save answer, not inside onSubmit', async () => {
    mocks.createSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1, warnings: [] }) });
    render(<CreateSchedulePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledTimes(1));
    expect(mocks.createSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ approval_rule: 'pause_and_ask' }),
    );
  });

  it('TC-US35-08 R4.1 R3.5 EL-7011 nested in the agent editor, locks the agent and returns to the editor', async () => {
    mocks.params = { tab: 'all', agentId: '12' };
    mocks.state = null;
    mocks.createSchedule.mockReturnValue({ unwrap: () => Promise.resolve({ id: 1 }) });
    render(<CreateSchedulePage entityType="agent" />);

    expect(mocks.formProps.lockedEntity).toEqual({ type: 'agent', id: 12 });
    expect(mocks.formProps.initialValues).toMatchObject({ type: 'agent', application_id: 12 });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/agents/all/12?viewMode=owner'));
  });
});
