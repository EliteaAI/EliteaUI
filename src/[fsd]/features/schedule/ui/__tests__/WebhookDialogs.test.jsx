// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import RotateSecretDialog from '../RotateSecretDialog';
import WebhookSecretDialog from '../WebhookSecretDialog';

// #7405: the secret is shown once, in these dialogs only; rotate and regenerate go to the /secret route

const mocks = vi.hoisted(() => ({
  changeSecret: vi.fn(),
  reset: vi.fn(),
  copy: vi.fn(),
  toastInfo: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastInfo: mocks.toastInfo, toastError: mocks.toastError }),
}));
vi.mock('@/[fsd]/entities/schedule', async importOriginal => ({
  ...(await importOriginal()),
  useChangeWebhookSecretMutation: () => [mocks.changeSecret, { isLoading: false, reset: mocks.reset }],
}));
vi.mock('@/common/utils', async importOriginal => ({ ...(await importOriginal()), handleCopy: mocks.copy }));

const theme = createTheme(getDesignTokens('light'));
const GITHUB = {
  id: 9,
  name: 'On push',
  trigger_kind: 'webhook',
  webhook_type: 'github',
  webhook_url: '/api/v2/elitea_core/hooks/prompt_lib/5/abc',
};
const SIGNING = { ...GITHUB, webhook_type: 'gitlab', gitlab_auth_method: 'signing_token' };
const TOKEN = `whsec_${btoa('k'.repeat(32))}`;

const wrap = node => render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);
const answer = value => mocks.changeSecret.mockReturnValue({ unwrap: () => value });

describe('WebhookSecretDialog', () => {
  afterEach(cleanup);

  it('shows the full URL and the secret with Copy and the not-shown-again warning', async () => {
    wrap(
      <WebhookSecretDialog
        open
        webhook={GITHUB}
        secret="s3cret"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByTestId('webhook-secret-dialog-url')).toHaveTextContent(
      `${window.location.origin}/api/v2/elitea_core/hooks/prompt_lib/5/abc`,
    );
    // Masked until the user asks to see it
    expect(screen.getByTestId('webhook-secret-dialog-secret')).not.toHaveTextContent('s3cret');
    fireEvent.click(screen.getByTestId('webhook-secret-dialog-secret-toggle'));
    expect(screen.getByTestId('webhook-secret-dialog-secret')).toHaveTextContent('s3cret');
    fireEvent.click(screen.getByTestId('webhook-secret-dialog-secret-copy'));
    await waitFor(() => expect(mocks.copy).toHaveBeenCalledWith('s3cret'));
    expect(screen.getByText(/The secret is not shown again/)).toBeInTheDocument();
    expect(screen.getByTestId('webhook-secret-dialog-hint')).toHaveTextContent('Payload URL');
  });

  it('a GitLab signing-token webhook shows no secret and says the token is saved', () => {
    wrap(
      <WebhookSecretDialog
        open
        webhook={SIGNING}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('webhook-secret-dialog-secret')).not.toBeInTheDocument();
    expect(screen.getByText(/signing token is saved/)).toBeInTheDocument();
  });
});

describe('RotateSecretDialog', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  const renderRotate = (webhook = GITHUB) => {
    const onClose = vi.fn();
    wrap(
      <RotateSecretDialog
        open
        webhook={webhook}
        onClose={onClose}
      />,
    );
    return { onClose };
  };

  it('rotate posts the mode and then shows the new secret once', async () => {
    answer(Promise.resolve({ ...GITHUB, secret: 'n3w' }));
    renderRotate();
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    await screen.findByTestId('webhook-secret-dialog');
    expect(mocks.changeSecret).toHaveBeenCalledWith({
      projectId: 5,
      scheduleId: 9,
      mode: 'rotate',
      signingSecretValue: undefined,
    });
    expect(screen.getByText('Secret rotated')).toBeInTheDocument();
    // The secret leaves the RTK mutation cache at once; the dialog state is its only copy
    expect(mocks.reset).toHaveBeenCalled();
  });

  it('a second rotate inside the window names its end and points to Regenerate', async () => {
    answer(Promise.reject({ status: 409, data: { previous_secret_until: '2026-11-06T10:00:00+00:00' } }));
    renderRotate();
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    expect(await screen.findByText(/A rotation is in progress until .*Use Regenerate/)).toBeInTheDocument();
  });

  it('a signing-token webhook needs a new whsec_ token before anything is sent', async () => {
    answer(Promise.resolve({ ...SIGNING }));
    renderRotate(SIGNING);
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    expect(await screen.findByText('Signing token is required')).toBeInTheDocument();
    expect(mocks.changeSecret).not.toHaveBeenCalled();
    fireEvent.change(screen.getByTestId('pipeline-webhook-signing-token-input'), {
      target: { value: TOKEN },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    await waitFor(() =>
      expect(mocks.changeSecret).toHaveBeenCalledWith(expect.objectContaining({ signingSecretValue: TOKEN })),
    );
  });

  it('a store failure closes the dialog with a toast and nothing changed', async () => {
    answer(
      Promise.reject({ status: 503, data: { error: 'The webhook secret could not be changed; try again' } }),
    );
    const { onClose } = renderRotate();
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.toastError).toHaveBeenCalled();
  });
});
