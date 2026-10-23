// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/[fsd]/features/chat/ui', () => ({
  ChatButton: {
    ClearChatButton: ({ disabled, onClear }) => (
      <button
        data-testid="chat-clear-button"
        disabled={disabled}
        onClick={onClear}
      />
    ),
  },
}));

vi.mock('@/[fsd]/widgets/context-budget', () => ({
  ContextBudgetUI: {
    ContextBudgetInfo: ({ pill, conversationId }) => (
      <div
        data-testid="context-budget-info"
        data-pill={String(pill)}
        data-conversation={conversationId}
      />
    ),
  },
}));

const { default: TestPanelControls } = await import('../TestPanelControls');

const theme = createTheme({ palette: darkPalette });

const renderControls = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <TestPanelControls
        onClear={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('TestPanelControls', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('opens Run History from the icon button', () => {
    const onShowHistory = vi.fn();
    renderControls({ onShowHistory });

    const historyButton = screen.getByTestId('pipeline-history-tab');
    expect(historyButton).toHaveAttribute('aria-label', 'view run history');
    fireEvent.click(historyButton);
    expect(onShowHistory).toHaveBeenCalledTimes(1);
  });

  it('shows the context pill only for an existing conversation', () => {
    renderControls();
    expect(screen.queryByTestId('context-budget-info')).toBeNull();

    cleanup();
    renderControls({ activeConversation: { id: 11, meta: {} } });
    const info = screen.getByTestId('context-budget-info');
    expect(info).toHaveAttribute('data-pill', 'true');
    expect(info).toHaveAttribute('data-conversation', '11');
  });

  it('clears the chat and respects the disabled state', () => {
    const onClear = vi.fn();
    renderControls({ onClear, isClearDisabled: false });
    fireEvent.click(screen.getByTestId('chat-clear-button'));
    expect(onClear).toHaveBeenCalledTimes(1);

    cleanup();
    renderControls({ isClearDisabled: true });
    expect(screen.getByTestId('chat-clear-button')).toBeDisabled();
  });

  it('closes the panel', () => {
    const onClose = vi.fn();
    renderControls({ onClose });

    fireEvent.click(screen.getByTestId('pipeline-test-panel-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
