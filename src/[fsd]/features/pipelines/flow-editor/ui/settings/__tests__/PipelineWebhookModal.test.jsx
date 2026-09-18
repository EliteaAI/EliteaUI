// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import PipelineWebhookModal from '../PipelineWebhookModal';

vi.mock('@mui/material', () => ({
  Box: ({ children }) => <div>{children}</div>,
  Button: ({ children, onClick, disabled, ...rest }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={rest['data-testid']}
    >
      {children}
    </button>
  ),
  IconButton: ({ children, onClick, ...rest }) => (
    <button
      onClick={onClick}
      data-testid={rest['data-testid']}
    >
      {children}
    </button>
  ),
  Typography: ({ children, ...rest }) => <span data-testid={rest['data-testid']}>{children}</span>,
}));

vi.mock('@mui/icons-material/ContentCopy', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Refresh', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Visibility', () => ({ default: () => null }));
vi.mock('@mui/icons-material/VisibilityOff', () => ({ default: () => null }));

vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));

vi.mock('@/components/FormInput', () => ({
  default: ({ value, onChange, inputProps = {} }) => (
    <input
      value={value}
      onChange={onChange}
      readOnly={!onChange}
      data-testid={inputProps['data-testid']}
    />
  ),
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastSuccess: vi.fn(), toastInfo: vi.fn(), toastError: vi.fn() }),
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Checkbox: {
    RadioButtonGroup: ({ value, items, onChange, testId }) => (
      <div>
        {items.map(item => (
          <button
            key={item.value}
            disabled={item.disabled}
            data-testid={`${testId}-${item.value}`}
            data-selected={value === item.value}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    ),
  },
  Modal: {
    BaseModal: ({ open, content, actions }) =>
      open ? (
        <div>
          {content}
          {actions}
        </div>
      ) : null,
  },
}));

const VALID_TOKEN = `whsec_${btoa('a-32-byte-signing-key-goes-here!')}`;

const baseProps = {
  open: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  webhookUrl: '/api/v2/pipeline_trigger/webhook/1/2/github',
  isLoading: false,
};

const renderModal = (props = {}) =>
  render(
    <PipelineWebhookModal
      {...baseProps}
      {...props}
    />,
  );

const apply = () => fireEvent.click(screen.getByTestId('pipeline-webhook-modal-apply-button'));

describe('PipelineWebhookModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('sends no gitlab_auth_method for non-gitlab types', () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit, webhookType: 'github', secretValue: 'abc' });

    apply();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ webhookType: 'github', gitlabAuthMethod: undefined }),
    );
  });

  it('always sends the auth method for gitlab, so the server default cannot downgrade it', () => {
    const onSubmit = vi.fn();
    renderModal({
      onSubmit,
      webhookType: 'gitlab',
      gitlabAuthMethod: 'signing_token',
      secretConfigured: true,
    });

    apply();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ webhookType: 'gitlab', gitlabAuthMethod: 'signing_token' }),
    );
  });

  it('routes a pasted signing token to signingTokenValue, not secretValue', () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit, webhookType: 'gitlab', gitlabAuthMethod: 'signing_token' });

    fireEvent.change(screen.getByTestId('pipeline-webhook-signing-token-input'), {
      target: { value: VALID_TOKEN },
    });
    apply();

    expect(onSubmit).toHaveBeenCalledWith({
      webhookType: 'gitlab',
      gitlabAuthMethod: 'signing_token',
      signingTokenValue: VALID_TOKEN,
      secretValue: undefined,
    });
  });

  it('offers the paste field with nothing saved yet, and blocks Apply until a token is entered', () => {
    renderModal({ onSubmit: vi.fn(), webhookType: 'gitlab', gitlabAuthMethod: 'signing_token' });

    expect(screen.getByTestId('pipeline-webhook-signing-token-input')).toBeTruthy();
    expect(screen.getByTestId('pipeline-webhook-modal-apply-button').disabled).toBe(true);

    fireEvent.change(screen.getByTestId('pipeline-webhook-signing-token-input'), {
      target: { value: VALID_TOKEN },
    });

    expect(screen.getByTestId('pipeline-webhook-modal-apply-button').disabled).toBe(false);
  });

  it('keeps Apply enabled with an empty field when a signing token is already stored', () => {
    renderModal({
      onSubmit: vi.fn(),
      webhookType: 'gitlab',
      gitlabAuthMethod: 'signing_token',
      secretConfigured: true,
    });

    expect(screen.getByTestId('pipeline-webhook-modal-apply-button').disabled).toBe(false);
  });

  it('blocks Apply on a malformed token', () => {
    renderModal({ onSubmit: vi.fn(), webhookType: 'gitlab', gitlabAuthMethod: 'signing_token' });

    fireEvent.change(screen.getByTestId('pipeline-webhook-signing-token-input'), {
      target: { value: 'not-a-signing-token' },
    });

    expect(screen.getByTestId('pipeline-webhook-modal-apply-button').disabled).toBe(true);
  });

  // Switching the radio must not claim a signing token is on record: secretConfigured still refers
  // to the stored secret token, so Apply has to stay blocked until one is actually pasted.
  it('does not treat a stored secret token as a stored signing token', () => {
    renderModal({
      onSubmit: vi.fn(),
      webhookType: 'gitlab',
      gitlabAuthMethod: 'secret_token',
      secretConfigured: true,
      secretValue: 'stored-secret-token',
    });

    fireEvent.click(screen.getByTestId('pipeline-webhook-gitlab-auth-method-radio-signing_token'));

    expect(screen.getByTestId('pipeline-webhook-modal-apply-button').disabled).toBe(true);
  });

  // The regenerate button issues an Elitea-generated secret, which is meaningless when GitLab owns
  // the token.
  it('hides the regenerate secret control in signing mode', () => {
    renderModal({
      onSubmit: vi.fn(),
      webhookType: 'gitlab',
      gitlabAuthMethod: 'signing_token',
      secretValue: 'stored-secret-token',
    });

    expect(screen.queryByTestId('pipeline-webhook-secret-regenerate-button')).toBeNull();
  });
});
