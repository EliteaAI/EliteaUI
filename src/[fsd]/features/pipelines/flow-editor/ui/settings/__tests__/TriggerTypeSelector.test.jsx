// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import TriggerTypeSelector from '../TriggerTypeSelector';

const mocks = vi.hoisted(() => ({
  formValues: {},
  triggerData: undefined,
  updateTrigger: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('formik', () => ({ useFormikContext: () => ({ values: mocks.formValues }) }));

vi.mock('@mui/icons-material/Link', () => ({ default: () => null }));
vi.mock('@mui/material', async importOriginal => ({
  ...(await importOriginal()),
  IconButton: ({ children }) => <button>{children}</button>,
}));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@/[fsd]/shared/ui/label', () => ({ InfoLabelWithTooltip: () => null }));
vi.mock('@/[fsd]/features/toolkits/lib/hooks', () => ({
  useDelegatedOauthToolkits: () => ({
    delegatedOauthToolkitNames: [],
    hasDelegatedOauthToolkit: false,
    isResolvingCredentials: false,
  }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProject: () => ({ id: 1 }),
  useToast: () => ({ toastSuccess: mocks.toastSuccess, toastError: mocks.toastError }),
}));
vi.mock('@/[fsd]/shared/ui/banner-message', () => ({
  BannerMessage: ({ children }) => <div>{children}</div>,
}));
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: ({ value, options, disabled, onValueChange }) => (
    <div
      data-testid="select"
      data-value={value}
      data-disabled={String(Boolean(disabled))}
    >
      {options.map(opt => (
        <span
          key={opt.value}
          data-testid={`option-${opt.value}`}
          data-disabled={String(Boolean(opt.disabled))}
          onClick={() => !opt.disabled && onValueChange?.(opt.value)}
        >
          {opt.label}
        </span>
      ))}
    </div>
  ),
}));
vi.mock('@/api/applications', () => ({
  useGetPipelineTriggerQuery: () => ({ data: mocks.triggerData, isLoading: false }),
  useUpdatePipelineTriggerMutation: () => [mocks.updateTrigger, { isLoading: false }],
  TAG_TYPE_GOVERNANCE_READINESS: 'GOVERNANCE_READINESS',
  withReadiness: tags => (result, error, arg) => [
    ...(typeof tags === 'function' ? tags(result, error, arg) : tags),
  ],
}));
vi.mock('@/assets/clock.svg?react', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/config/store', () => ({ store: {} }));
vi.mock('../PipelineWebhookModal', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui', () => ({
  Modal: {
    BaseModal: ({ open, onConfirm, onClose, content }) =>
      open ? (
        <div data-testid="replace-dialog">
          <span>{content}</span>
          <button onClick={onConfirm}>confirm</button>
          <button onClick={onClose}>cancel</button>
        </div>
      ) : null,
  },
}));

const HITL_YAML = 'nodes:\n  - id: a\n    type: hitl\n';
const PLAIN_YAML = 'nodes:\n  - id: a\n    type: llm\n';

const setForm = instructions => {
  mocks.formValues = { version_details: { id: 7, instructions } };
};

const renderStoredSchedule = () => {
  mocks.triggerData = { type: 'schedule', cron: '0 0 * * 6' };
  render(<TriggerTypeSelector />);
};

const confirmSwitchTo = option => {
  fireEvent.click(screen.getByTestId(`option-${option}`));
  fireEvent.click(screen.getByText('confirm'));
};

const failSwitchTo = (option, rejection) => {
  mocks.updateTrigger.mockReturnValue({ unwrap: () => Promise.reject(rejection) });
  renderStoredSchedule();
  confirmSwitchTo(option);
};

describe('TriggerTypeSelector', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.updateTrigger.mockReturnValue({ unwrap: () => Promise.resolve() });
    mocks.triggerData = { type: 'chat_message' };
    setForm(PLAIN_YAML);
  });

  it('lists only Chat Message when no legacy trigger is stored (#7402)', () => {
    render(<TriggerTypeSelector />);

    expect(screen.getByTestId('option-chat_message')).toBeTruthy();
    expect(screen.queryByTestId('option-webhook')).toBeNull();
    expect(screen.queryByTestId('option-schedule')).toBeNull();
  });

  it('keeps a stored legacy webhook selectable and shows the deprecation notice', () => {
    mocks.triggerData = { type: 'webhook', webhook_type: 'github' };
    render(<TriggerTypeSelector />);

    expect(screen.getByTestId('select').dataset.value).toBe('webhook');
    expect(screen.getByTestId('option-webhook').dataset.disabled).toBe('false');
    expect(screen.getByTestId('legacy-webhook-notice').textContent).toMatch(/deprecated URL/);
  });

  it('shows no deprecation notice without a stored webhook', () => {
    render(<TriggerTypeSelector />);

    expect(screen.queryByTestId('legacy-webhook-notice')).toBeNull();
  });

  it('asks before switching a stored legacy webhook to Chat Message', async () => {
    mocks.triggerData = { type: 'webhook', webhook_type: 'github' };
    render(<TriggerTypeSelector />);

    fireEvent.click(screen.getByTestId('option-chat_message'));
    expect(mocks.updateTrigger).not.toHaveBeenCalled();
    expect(screen.getByText(/cannot be set up here again/)).toBeTruthy();

    fireEvent.click(screen.getByText('confirm'));
    await waitFor(() =>
      expect(mocks.updateTrigger).toHaveBeenCalledWith(expect.objectContaining({ type: 'chat_message' })),
    );
  });

  it('shows a stored schedule as a disabled option in an enabled select', () => {
    renderStoredSchedule();

    expect(screen.getByTestId('select').dataset.value).toBe('schedule');
    expect(screen.getByTestId('select').dataset.disabled).toBe('false');
    expect(screen.getByTestId('option-schedule').dataset.disabled).toBe('true');
    expect(screen.getByTestId('option-schedule').textContent).toBe('Schedule');
  });

  it('asks before replacing a stored schedule with Chat Message', async () => {
    renderStoredSchedule();

    fireEvent.click(screen.getByTestId('option-chat_message'));

    expect(screen.getByTestId('replace-dialog')).toBeTruthy();
    expect(mocks.updateTrigger).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('confirm'));

    await waitFor(() => expect(mocks.updateTrigger).toHaveBeenCalledTimes(1));
    expect(mocks.updateTrigger).toHaveBeenCalledWith(expect.objectContaining({ type: 'chat_message' }));
    expect(screen.queryByTestId('replace-dialog')).toBeNull();
  });

  it('does not offer Webhook in place of a stored schedule', () => {
    renderStoredSchedule();

    expect(screen.queryByTestId('option-webhook')).toBeNull();
  });

  it('shows a success toast after a confirmed switch from a stored schedule to Chat Message', async () => {
    renderStoredSchedule();

    confirmSwitchTo('chat_message');

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith('Trigger updated to Chat Message'));
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('shows the server message in an error toast when the switch to Chat Message fails', async () => {
    failSwitchTo('chat_message', { data: { error: 'Version is locked' } });

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('Version is locked'));
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(screen.queryByTestId('replace-dialog')).toBeNull();
  });

  it('shows a generic error toast when the switch to Chat Message fails without a message', async () => {
    failSwitchTo('chat_message', new Error('network'));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('Failed to update trigger'));
  });

  it('keeps a stored schedule when the replace dialog is cancelled', () => {
    renderStoredSchedule();

    fireEvent.click(screen.getByTestId('option-chat_message'));
    fireEvent.click(screen.getByText('cancel'));

    expect(mocks.updateTrigger).not.toHaveBeenCalled();
    expect(screen.queryByTestId('replace-dialog')).toBeNull();
  });

  it('keeps a stored schedule when the disabled Schedule option is clicked', () => {
    renderStoredSchedule();

    fireEvent.click(screen.getByTestId('option-schedule'));

    expect(mocks.updateTrigger).not.toHaveBeenCalled();
  });

  it('shows the legacy schedule notice only for a stored schedule', () => {
    const { unmount } = render(<TriggerTypeSelector />);
    expect(screen.queryByText(/no longer editable here/i)).toBeNull();
    unmount();

    renderStoredSchedule();

    expect(screen.getByText(/no longer editable here/i)).toBeTruthy();
  });

  it('greys out a stored Webhook when the pipeline gains an interactive node', () => {
    mocks.triggerData = { type: 'webhook' };
    setForm(HITL_YAML);

    render(<TriggerTypeSelector />);

    expect(screen.getByTestId('option-webhook').dataset.disabled).toBe('true');
    expect(screen.getByTestId('option-chat_message').dataset.disabled).toBe('false');
  });

  it('sends no trigger update for a stored schedule when the pipeline becomes restricted', () => {
    mocks.triggerData = { type: 'schedule' };
    const { rerender } = render(<TriggerTypeSelector />);

    setForm(HITL_YAML);
    rerender(<TriggerTypeSelector disabled={false} />);

    expect(mocks.updateTrigger).not.toHaveBeenCalled();
  });

  it('keeps a stored legacy webhook, greyed out, when the pipeline becomes restricted (#7402)', () => {
    // A reset would delete it for good: the option is gone once the trigger is Chat Message
    mocks.triggerData = { type: 'webhook' };
    const { rerender } = render(<TriggerTypeSelector />);

    setForm(HITL_YAML);
    rerender(<TriggerTypeSelector disabled={false} />);

    expect(mocks.updateTrigger).not.toHaveBeenCalled();
    expect(screen.getByTestId('select').dataset.value).toBe('webhook');
    expect(screen.getByTestId('option-webhook').dataset.disabled).toBe('true');
  });

  it('shows a hint that names the Schedules section', () => {
    render(<TriggerTypeSelector />);

    expect(screen.getByText(/to run this pipeline on a timer, use the/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Schedules section' })).toBeTruthy();
  });

  it('scrolls to the Schedules section when the link is activated', () => {
    const section = document.createElement('div');
    section.id = 'entity-schedules-section';
    section.scrollIntoView = vi.fn();
    document.body.appendChild(section);

    render(<TriggerTypeSelector />);
    fireEvent.click(screen.getByRole('button', { name: 'Schedules section' }));

    expect(section.scrollIntoView).toHaveBeenCalledTimes(1);
    section.remove();
  });

  it('keeps the hint and does nothing when the Schedules section is missing', () => {
    render(<TriggerTypeSelector />);

    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Schedules section' }))).not.toThrow();
    expect(screen.getByText(/to run this pipeline on a timer/i)).toBeTruthy();
  });
});
