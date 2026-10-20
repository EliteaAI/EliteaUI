// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, render, screen } from '@testing-library/react';

import TriggerTypeSelector from '../TriggerTypeSelector';

const mocks = vi.hoisted(() => ({
  formValues: {},
  triggerData: undefined,
  updateTrigger: vi.fn(),
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
  useToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
}));
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: ({ value, options, disabled }) => (
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
}));
vi.mock('@/assets/clock.svg?react', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/config/store', () => ({ store: {} }));
vi.mock('../PipelineWebhookModal', () => ({ default: () => null }));

const HITL_YAML = 'nodes:\n  - id: a\n    type: hitl\n';
const PLAIN_YAML = 'nodes:\n  - id: a\n    type: llm\n';

const setForm = instructions => {
  mocks.formValues = { version_details: { id: 7, instructions } };
};

describe('TriggerTypeSelector EL-7011 US-37', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.updateTrigger.mockReturnValue({ unwrap: () => Promise.resolve() });
    mocks.triggerData = { type: 'chat_message' };
    setForm(PLAIN_YAML);
  });

  it('R1.1 lists only Chat Message and Webhook when no schedule is stored', () => {
    render(<TriggerTypeSelector />);

    expect(screen.getByTestId('option-chat_message')).toBeTruthy();
    expect(screen.getByTestId('option-webhook')).toBeTruthy();
    expect(screen.queryByTestId('option-schedule')).toBeNull();
  });

  it('R2.1 and R2.2 show a stored schedule as a disabled value in a disabled select', () => {
    mocks.triggerData = { type: 'schedule', cron: '0 0 * * 6' };

    render(<TriggerTypeSelector />);

    expect(screen.getByTestId('select').dataset.value).toBe('schedule');
    expect(screen.getByTestId('select').dataset.disabled).toBe('true');
    expect(screen.getByTestId('option-schedule').dataset.disabled).toBe('true');
    expect(screen.getByTestId('option-schedule').textContent).toBe('Schedule');
  });

  it('R2.3 greys out Webhook when the pipeline gains an interactive node', () => {
    setForm(HITL_YAML);

    render(<TriggerTypeSelector />);

    expect(screen.getByTestId('option-webhook').dataset.disabled).toBe('true');
    expect(screen.getByTestId('option-chat_message').dataset.disabled).toBe('false');
  });

  it('R2.4 sends no trigger update for a stored schedule when the pipeline becomes restricted', () => {
    mocks.triggerData = { type: 'schedule' };
    const { rerender } = render(<TriggerTypeSelector />);

    setForm(HITL_YAML);
    rerender(<TriggerTypeSelector disabled={false} />);

    expect(mocks.updateTrigger).not.toHaveBeenCalled();
  });

  it('R2.4 still resets a stored webhook when the pipeline becomes restricted', () => {
    mocks.triggerData = { type: 'webhook' };
    const { rerender } = render(<TriggerTypeSelector />);

    setForm(HITL_YAML);
    rerender(<TriggerTypeSelector disabled={false} />);

    expect(mocks.updateTrigger).toHaveBeenCalledTimes(1);
  });
});
