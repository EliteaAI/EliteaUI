// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

import TriggerTypeSelector from '../TriggerTypeSelector';

// EL-7213: a schedule or webhook saved on a version that governance has not bound yet is kept, and the
// backend answers with `governance_notice`; the editor shows it as a warning after the success toast.

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastWarning = vi.fn();
const unwrap = vi.fn();
const updateTrigger = vi.fn(() => ({ unwrap }));
let scheduleModalProps = null;

vi.mock('formik', () => ({
  useFormikContext: () => ({ values: { version_details: { id: 70, instructions: 'nodes: []', tools: [] } } }),
}));

vi.mock('@mui/icons-material/Link', () => ({ default: () => null }));
vi.mock('@/assets/clock.svg?react', () => ({ default: () => null }));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@mui/material', () => ({
  Box: ({ children }) => <div>{children}</div>,
  IconButton: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProject: () => ({ id: 1 }),
  useToast: () => ({ toastSuccess, toastError, toastWarning }),
}));
vi.mock('@/[fsd]/shared/ui/label', () => ({ InfoLabelWithTooltip: ({ label }) => <span>{label}</span> }));
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: ({ value, onValueChange, options }) => (
    <select
      data-testid="trigger-select"
      value={value}
      onChange={event => onValueChange(event.target.value)}
    >
      {options.map(option => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  ),
}));
vi.mock('@/[fsd]/features/toolkits/lib/hooks', () => ({
  useDelegatedOauthToolkits: () => ({
    delegatedOauthToolkitNames: [],
    hasDelegatedOauthToolkit: false,
    isResolvingCredentials: false,
  }),
}));
vi.mock('@/api/applications', () => ({
  useGetPipelineTriggerQuery: () => ({ data: { type: 'chat_message' }, isLoading: false }),
  useUpdatePipelineTriggerMutation: () => [updateTrigger, { isLoading: false }],
}));
vi.mock('../PipelineScheduleModal', () => ({
  default: props => {
    scheduleModalProps = props;
    return null;
  },
}));
vi.mock('../PipelineWebhookModal', () => ({ default: () => null }));

const NOTICE =
  "Credential governance is on and this version has no active identity binding: runs started by this trigger will be refused until an operator binds the version and approves a mandate for it. The editor's test chat is not affected.";

describe('TriggerTypeSelector under credential governance (EL-7213)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    scheduleModalProps = null;
  });

  it('warns after a schedule is saved on a version that is not bound, and keeps the success toast', async () => {
    unwrap.mockResolvedValue({ type: 'schedule', cron: '0 0 * * 6', governance_notice: NOTICE });
    render(<TriggerTypeSelector />);

    await act(async () => {
      await scheduleModalProps.onSubmit('0 0 * * 6');
    });

    await waitFor(() => expect(updateTrigger).toHaveBeenCalledTimes(1));
    expect(updateTrigger.mock.calls[0][0]).toMatchObject({
      projectId: 1,
      versionId: 70,
      type: 'schedule',
      cron: '0 0 * * 6',
    });
    expect(toastSuccess).toHaveBeenCalledWith('Schedule configured successfully');
    expect(toastWarning).toHaveBeenCalledWith(NOTICE);
    expect(toastError).not.toHaveBeenCalled();
    expect(screen.getByTestId('trigger-select')).toBeTruthy();
  });

  it('shows no warning when the backend sends none (governance off, or the version is bound)', async () => {
    unwrap.mockResolvedValue({ type: 'schedule', cron: '0 0 * * 6' });
    render(<TriggerTypeSelector />);

    await act(async () => {
      await scheduleModalProps.onSubmit('0 0 * * 6');
    });

    expect(toastSuccess).toHaveBeenCalledWith('Schedule configured successfully');
    expect(toastWarning).not.toHaveBeenCalled();
  });
});
