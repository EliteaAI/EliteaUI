// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import UsersMentionDropdown from '../UsersMentionDropdown';

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { id: 1 } }),
}));

const theme = createTheme(getDesignTokens('dark'));

describe('UsersMentionDropdown', () => {
  let anchorEl;

  beforeEach(() => {
    vi.clearAllMocks();
    anchorEl = document.createElement('button');
    document.body.append(anchorEl);
  });

  afterEach(() => {
    cleanup();
    anchorEl.remove();
  });

  const renderDropdown = onClose =>
    render(
      <ThemeProvider theme={theme}>
        <button
          type="button"
          data-testid="outside-menu-button"
          onClick={event => event.stopPropagation()}
        >
          Row menu
        </button>
        <UsersMentionDropdown
          open
          anchorEl={anchorEl}
          users={[]}
          currentUserId={1}
          onClose={onClose}
        />
      </ThemeProvider>,
    );

  it('closes when a click outside stops its propagation before reaching the document', () => {
    const onClose = vi.fn();
    renderDropdown(onClose);

    const outsideButton = screen.getByTestId('outside-menu-button');
    fireEvent.pointerDown(outsideButton);
    fireEvent.click(outsideButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('stays open for a press inside the dropdown', () => {
    const onClose = vi.fn();
    renderDropdown(onClose);

    fireEvent.pointerDown(screen.getByTestId('chat-users-mention-dropdown'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('leaves toggling to the anchor when the anchor is pressed', () => {
    const onClose = vi.fn();
    renderDropdown(onClose);

    fireEvent.pointerDown(anchorEl);

    expect(onClose).not.toHaveBeenCalled();
  });
});
