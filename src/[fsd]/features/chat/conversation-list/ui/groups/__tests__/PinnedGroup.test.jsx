// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import PinnedGroup from '../PinnedGroup';

const theme = createTheme(getDesignTokens('dark'));

const renderGroup = (isExpanded, onToggle = vi.fn()) =>
  render(
    <ThemeProvider theme={theme}>
      <PinnedGroup
        isExpanded={isExpanded}
        onToggle={onToggle}
      >
        <div data-testid="pinned-content">Roadmap Q1</div>
      </PinnedGroup>
    </ThemeProvider>,
  );

describe('PinnedGroup', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the Pinned header with its items when open', () => {
    renderGroup(true);

    const header = screen.getByRole('button', { name: 'Pinned' });
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('pinned-content')).toBeVisible();
    expect(screen.getByTestId('chat-conversation-group-header-pinned')).toContainElement(header);
  });

  it('marks the header folded when closed', () => {
    renderGroup(false);

    expect(screen.getByRole('button', { name: 'Pinned' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles on click and on Enter or Space', () => {
    const onToggle = vi.fn();
    renderGroup(true, onToggle);
    const header = screen.getByRole('button', { name: 'Pinned' });

    fireEvent.click(header);
    fireEvent.keyDown(header, { key: 'Enter' });
    fireEvent.keyDown(header, { key: ' ' });
    fireEvent.keyDown(header, { key: 'a' });

    expect(onToggle).toHaveBeenCalledTimes(3);
  });
});
