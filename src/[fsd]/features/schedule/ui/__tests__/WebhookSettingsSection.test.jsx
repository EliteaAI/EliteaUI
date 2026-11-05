// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import WebhookSettingsSection from '../WebhookSettingsSection';

// #7405: the sender is picked on create; a saved webhook shows its URL and, while rotating, the end of the window

vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastInfo: vi.fn(), toastError: vi.fn() }),
}));

const theme = createTheme(getDesignTokens('light'));
const HOUR = 60 * 60 * 1000;
const SAVED = {
  id: 9,
  webhook_type: 'github',
  webhook_url: '/api/v2/elitea_core/hooks/prompt_lib/5/abc',
};

const renderSection = props =>
  render(
    <ThemeProvider theme={theme}>
      <WebhookSettingsSection
        values={{ webhook_type: 'github', gitlab_auth_method: null, signing_secret_value: '' }}
        setFieldValue={vi.fn()}
        fieldError={() => ''}
        {...props}
      />
    </ThemeProvider>,
  );

describe('WebhookSettingsSection', () => {
  afterEach(cleanup);

  it('a new webhook offers the sender and no URL yet', () => {
    renderSection();
    expect(screen.getByTestId('webhook-settings-new')).toBeInTheDocument();
    expect(screen.queryByTestId('webhook-settings-url')).not.toBeInTheDocument();
  });

  it('a new GitLab signing-token webhook asks for the token', () => {
    renderSection({
      values: { webhook_type: 'gitlab', gitlab_auth_method: 'signing_token', signing_secret_value: '' },
    });
    expect(screen.getByTestId('pipeline-webhook-signing-token-input')).toBeInTheDocument();
  });

  it('a saved webhook shows its URL and no rotation notice outside the window', () => {
    renderSection({
      webhook: { ...SAVED, previous_secret_until: new Date(Date.now() - HOUR).toISOString() },
    });
    expect(screen.getByTestId('webhook-settings-url')).toHaveTextContent('/hooks/prompt_lib/5/abc');
    expect(screen.queryByTestId('webhook-rotation-banner')).not.toBeInTheDocument();
  });

  it('while the previous secret is still accepted, the notice names its end', () => {
    renderSection({
      webhook: { ...SAVED, previous_secret_until: new Date(Date.now() + HOUR).toISOString() },
    });
    expect(screen.getByTestId('webhook-rotation-banner')).toHaveTextContent(
      'previous secret stays valid until',
    );
  });
});
