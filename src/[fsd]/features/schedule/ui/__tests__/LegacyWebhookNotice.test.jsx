// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import LegacyWebhookNotice from '../LegacyWebhookNotice';

const renderNotice = props =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
      <LegacyWebhookNotice {...props} />
    </ThemeProvider>,
  );

describe('LegacyWebhookNotice', () => {
  afterEach(cleanup);

  it('says the URL is deprecated and where to create the new webhook', () => {
    renderNotice({ onOpenWebhooks: vi.fn() });

    expect(screen.getByTestId('legacy-webhook-notice')).toHaveTextContent(
      /deprecated URL\. Create a webhook in Settings → Webhooks .*switch the sender to the new URL/,
    );
  });

  it('calls onOpenWebhooks from the Webhooks section link', () => {
    const onOpenWebhooks = vi.fn();
    renderNotice({ onOpenWebhooks });

    fireEvent.click(screen.getByRole('button', { name: 'Webhooks section' }));

    expect(onOpenWebhooks).toHaveBeenCalledTimes(1);
  });

  it('shows plain text without a link when there is no section to open', () => {
    renderNotice({});

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByTestId('legacy-webhook-notice')).toHaveTextContent(/Webhooks section/);
  });
});
