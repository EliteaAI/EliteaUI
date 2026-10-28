// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, render, waitFor } from '@testing-library/react';

import TriggerTypeSelector from '../TriggerTypeSelector';

// A webhook saved on a version that governance has not bound yet is kept, and the
// backend answers with `governance_notice`; the editor shows that warning in place of the success toast
// (the toast provider holds one toast at a time, so showing both would hide the success).

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastWarning = vi.fn();
const unwrap = vi.fn();
const updateTrigger = vi.fn(() => ({ unwrap }));
let webhookModalProps = null;

vi.mock('formik', () => ({
  useFormikContext: () => ({ values: { version_details: { id: 70, instructions: 'nodes: []', tools: [] } } }),
}));

vi.mock('@mui/icons-material/Link', () => ({ default: () => null }));
vi.mock('@/assets/clock.svg?react', () => ({ default: () => null }));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@mui/material', async importOriginal => ({
  ...(await importOriginal()),
  Box: ({ children }) => <div>{children}</div>,
  IconButton: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('@/[fsd]/shared/ui/banner-message', () => ({
  BannerMessage: ({ children }) => <div>{children}</div>,
}));
vi.mock('@/[fsd]/shared/ui', () => ({ Modal: { BaseModal: () => null } }));
vi.mock('@/[fsd]/features/schedule', () => ({ LegacyScheduleNotice: () => null }));
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
vi.mock('../PipelineWebhookModal', () => ({
  default: props => {
    webhookModalProps = props;
    return null;
  },
}));

const NOTICE =
  "Credential governance is on and this version has no active identity binding: runs started by this trigger will be refused until an operator binds the version and approves a mandate for it. The editor's test chat is not affected.";

describe('TriggerTypeSelector under credential governance (EL-7213)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    webhookModalProps = null;
  });

  it('shows the warning instead of the success toast when a webhook is saved on an unbound version', async () => {
    unwrap.mockResolvedValue({ type: 'webhook', webhook_type: 'github', governance_notice: NOTICE });
    render(<TriggerTypeSelector />);

    await act(async () => {
      await webhookModalProps.onSubmit({ webhookType: 'github', secretValue: 'new-secret' });
    });

    await waitFor(() => expect(updateTrigger).toHaveBeenCalledTimes(1));
    expect(updateTrigger.mock.calls[0][0]).toMatchObject({
      projectId: 1,
      versionId: 70,
      type: 'webhook',
      webhook_type: 'github',
      webhook_secret_value: 'new-secret',
    });
    expect(toastWarning).toHaveBeenCalledTimes(1);
    expect(toastWarning).toHaveBeenCalledWith(NOTICE);
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('keeps the webhook success wording when the backend sends no notice', async () => {
    unwrap.mockResolvedValue({ type: 'webhook', webhook_type: 'github' });
    render(<TriggerTypeSelector />);

    await act(async () => {
      await webhookModalProps.onSubmit({ webhookType: 'github', secretValue: 'new-secret' });
    });

    expect(toastSuccess).toHaveBeenCalledWith('Webhook configured with new secret');
    expect(toastWarning).not.toHaveBeenCalled();
  });
});
