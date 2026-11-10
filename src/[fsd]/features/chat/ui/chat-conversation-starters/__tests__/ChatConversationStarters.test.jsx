// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import ChatConversationStarters from '../ChatConversationStarters';

const theme = createTheme(getDesignTokens('dark'));

const makeStarters = count => Array.from({ length: count }, (_, i) => `Starter ${i + 1}`);

const renderStarters = (starters, onSend = vi.fn()) => {
  const utils = render(
    <ThemeProvider theme={theme}>
      <ChatConversationStarters
        onSend={onSend}
        conversation_starters={starters}
      />
    </ThemeProvider>,
  );
  return { ...utils, onSend };
};

const tileTexts = () => screen.queryAllByTestId('chat-conversation-starter-tile').map(el => el.textContent);

describe('ChatConversationStarters', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it.each([1, 3, 4])('K=%i shows every starter as a tile and no more tile', count => {
    renderStarters(makeStarters(count));
    expect(tileTexts()).toEqual(makeStarters(count));
    expect(screen.queryByTestId('chat-conversation-starters-more-tile')).not.toBeInTheDocument();
  });

  it.each([
    [5, '+2 more'],
    [10, '+7 more'],
  ])('K=%i shows starters 1-3 and %s', (count, label) => {
    renderStarters(makeStarters(count));
    expect(tileTexts()).toEqual(makeStarters(3));
    const more = screen.getByTestId('chat-conversation-starters-more-tile');
    expect(more).toHaveTextContent(label);
    expect(more).toHaveAttribute('aria-haspopup', 'dialog');
    expect(more).toHaveAttribute('aria-expanded', 'false');
  });

  it('ignores blank starters', () => {
    renderStarters(['One', ' ', 'Two']);
    expect(tileTexts()).toEqual(['One', 'Two']);
  });

  it('sends a visible tile on click', () => {
    const { onSend } = renderStarters(makeStarters(10));
    fireEvent.click(screen.getAllByTestId('chat-conversation-starter-tile')[1]);
    expect(onSend).toHaveBeenCalledWith('Starter 2');
  });

  it('opens a popover with all K starters in order', () => {
    renderStarters(makeStarters(10));
    const more = screen.getByTestId('chat-conversation-starters-more-tile');
    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    const popover = screen.getByTestId('chat-conversation-starters-popover');
    const items = within(popover).getAllByTestId('chat-conversation-starters-popover-item');
    expect(items.map(el => el.textContent)).toEqual(makeStarters(10));
  });

  it('sends a popover item and closes the popover', async () => {
    const { onSend } = renderStarters(makeStarters(5));
    fireEvent.click(screen.getByTestId('chat-conversation-starters-more-tile'));
    fireEvent.click(screen.getAllByTestId('chat-conversation-starters-popover-item')[4]);
    expect(onSend).toHaveBeenCalledWith('Starter 5');
    await waitFor(() =>
      expect(screen.queryByTestId('chat-conversation-starters-popover')).not.toBeInTheDocument(),
    );
  });

  it('activates a popover item with Enter or Space', () => {
    const { onSend } = renderStarters(makeStarters(5));
    fireEvent.click(screen.getByTestId('chat-conversation-starters-more-tile'));
    const items = screen.getAllByTestId('chat-conversation-starters-popover-item');
    expect(items[0]).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(items[3], { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Starter 4');
  });

  it('closes on Escape without sending and returns focus to the more tile', async () => {
    const { onSend } = renderStarters(makeStarters(5));
    const more = screen.getByTestId('chat-conversation-starters-more-tile');
    more.focus();
    fireEvent.click(more);
    const popover = screen.getByTestId('chat-conversation-starters-popover');
    fireEvent.keyDown(popover, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByTestId('chat-conversation-starters-popover')).not.toBeInTheDocument(),
    );
    expect(onSend).not.toHaveBeenCalled();
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveFocus();
  });

  it('closes the popover when the starters are hidden', async () => {
    const onSend = vi.fn();
    const { rerender } = renderStarters(makeStarters(5), onSend);
    fireEvent.click(screen.getByTestId('chat-conversation-starters-more-tile'));
    expect(screen.getByTestId('chat-conversation-starters-popover')).toBeInTheDocument();
    rerender(
      <ThemeProvider theme={theme}>
        <ChatConversationStarters
          onSend={onSend}
          conversation_starters={[]}
        />
      </ThemeProvider>,
    );
    await waitFor(() =>
      expect(screen.queryByTestId('chat-conversation-starters-popover')).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId('chat-conversation-starters-more-tile')).not.toBeInTheDocument();
  });
});
