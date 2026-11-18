// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ConversationRunIndicator from '../ConversationRunIndicator';

const theme = createTheme(getDesignTokens('dark'));

const renderIndicator = props =>
  render(
    <ThemeProvider theme={theme}>
      <ConversationRunIndicator {...props} />
    </ThemeProvider>,
  );

describe('ConversationRunIndicator', () => {
  afterEach(() => cleanup());

  it('shows the spinner while the chat generates, and no dot', () => {
    renderIndicator({ isRunning: true, unread: 'new_response' });
    expect(screen.getByTestId('chat-list-item-running-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-list-item-unread-badge')).not.toBeInTheDocument();
  });

  it.each([
    ['new_response', 'New response'],
    ['waiting', 'Waiting for your answer'],
  ])('shows the %s dot', (unread, title) => {
    renderIndicator({ isRunning: false, unread });
    const dot = screen.getByTestId('chat-list-item-unread-badge');
    expect(dot).toHaveAttribute('data-reason', unread);
    expect(screen.getByLabelText(title)).toBeInTheDocument();
  });

  it('renders nothing for a chat with nothing to tell', () => {
    const { container } = renderIndicator({ isRunning: false, unread: null });
    expect(container).toBeEmptyDOMElement();
  });
});
