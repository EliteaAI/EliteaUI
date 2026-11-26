// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AttachmentButton from '../AttachmentButton';

vi.mock('@/[fsd]/features/chat/lib/hooks', () => ({
  useAllowedExtensions: () => ['.txt'],
  useAllowedFileTypes: () => ['text/plain'],
  useFileTypes: () => ({ isLoading: false }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastInfo: vi.fn(), toastError: vi.fn(), toastWarning: vi.fn() }),
}));

const theme = createTheme(getDesignTokens('dark'));

const renderButton = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <AttachmentButton
        testId="attach"
        {...props}
      />
    </ThemeProvider>,
  );

describe('AttachmentButton', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('labels the menu row «Attach Files» without the files left', () => {
    renderButton({ showLabel: true });

    const row = screen.getByTestId('attach');
    expect(row).toHaveTextContent('Attach Files');
    expect(row).not.toHaveTextContent('left');
  });

  it('keeps the files left in the icon button tooltip', async () => {
    renderButton();

    fireEvent.mouseOver(screen.getByTestId('attach'));

    expect(await screen.findByTestId('chat-attach-button-tooltip')).toHaveTextContent(
      /^Attach Files \(\d+ left\)$/,
    );
  });
});
