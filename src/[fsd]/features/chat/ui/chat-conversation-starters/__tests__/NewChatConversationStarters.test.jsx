// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import NewChatConversationStarters from '../NewChatConversationStarters';

const theme = createTheme(getDesignTokens('light'));

const makeStarters = count => Array.from({ length: count }, (_, i) => `Starter ${i + 1}`);

const renderList = (starters, key = 'chat-1::agent-1', onSendStarter = vi.fn(() => vi.fn())) =>
  render(
    <ThemeProvider theme={theme}>
      <NewChatConversationStarters
        key={key}
        conversationStarters={starters}
        onSendStarter={onSendStarter}
      />
    </ThemeProvider>,
  );

const rowTexts = () => screen.getAllByTestId('chat-conversation-starter-tile').map(el => el.textContent);

describe('NewChatConversationStarters', () => {
  afterEach(() => cleanup());

  it('shows up to 4 rows without a link', () => {
    renderList(makeStarters(4));
    expect(rowTexts()).toEqual(makeStarters(4));
    expect(screen.queryByTestId('chat-conversation-starters-show-more-link')).not.toBeInTheDocument();
  });

  it.each([
    [5, 'Show 1 more'],
    [10, 'Show 6 more'],
  ])('K=%i collapses to rows 1-4 and "%s"', (count, label) => {
    renderList(makeStarters(count));
    expect(rowTexts()).toEqual(makeStarters(4));
    expect(screen.getByTestId('chat-conversation-starters-show-more-link')).toHaveTextContent(label);
  });

  it('expands to all K in order and collapses again', () => {
    renderList(makeStarters(10));
    const link = screen.getByTestId('chat-conversation-starters-show-more-link');
    fireEvent.click(link);
    expect(rowTexts()).toEqual(makeStarters(10));
    expect(link).toHaveTextContent('Show less');
    expect(link).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(link);
    expect(rowTexts()).toEqual(makeStarters(4));
  });

  it('sends a row on click', () => {
    const send = vi.fn();
    const onSendStarter = vi.fn(() => send);
    renderList(makeStarters(6), 'chat-1::agent-1', onSendStarter);
    fireEvent.click(screen.getByTestId('chat-conversation-starters-show-more-link'));
    fireEvent.click(screen.getAllByTestId('chat-conversation-starter-tile')[5]);
    expect(onSendStarter).toHaveBeenCalledWith('Starter 6');
    expect(send).toHaveBeenCalled();
  });

  it('starts collapsed again for another participant', () => {
    const { rerender } = renderList(makeStarters(10), 'chat-1::agent-1');
    fireEvent.click(screen.getByTestId('chat-conversation-starters-show-more-link'));
    expect(rowTexts()).toHaveLength(10);
    rerender(
      <ThemeProvider theme={theme}>
        <NewChatConversationStarters
          key="chat-1::agent-2"
          conversationStarters={makeStarters(10)}
          onSendStarter={vi.fn(() => vi.fn())}
        />
      </ThemeProvider>,
    );
    expect(rowTexts()).toHaveLength(4);
    expect(screen.getByTestId('chat-conversation-starters-show-more-link')).toHaveTextContent('Show 6 more');
  });
});
