// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import RunHistoryActionsMenu from '../RunHistoryActionsMenu';

const theme = createTheme({
  palette: {
    text: { secondary: '#ccc' },
    border: { lines: '#333' },
    icon: { default: '#aaa' },
    background: {
      default: { secondary: '#111' },
      surface: { interactive: { default: '#222' } },
    },
  },
});

const RUN = { id: 9, created_at: '2026-09-30T10:00:00Z' };

const renderMenu = (props = {}) => {
  render(
    <ThemeProvider theme={theme}>
      <RunHistoryActionsMenu
        run={RUN}
        canDelete
        onShare={vi.fn()}
        onExport={vi.fn()}
        onDelete={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByTestId('run-history-actions-9'));
};

afterEach(() => cleanup());

describe('RunHistoryActionsMenu', () => {
  it('orders the actions Share, Export to Excel, Analytics, Delete', () => {
    renderMenu({ onOpenAnalytics: vi.fn() });

    const labels = screen.getAllByRole('menuitem').map(item => item.textContent);
    expect(labels).toEqual(['Share', 'Export to Excel', 'Analytics', 'Delete']);
  });

  it('opens analytics for the row it belongs to', () => {
    const onOpenAnalytics = vi.fn();
    renderMenu({ onOpenAnalytics });

    fireEvent.click(screen.getByTestId('run-history-analytics'));

    expect(onOpenAnalytics).toHaveBeenCalledWith(RUN);
  });

  it('hides Analytics for runs from before run-level tracking', () => {
    renderMenu({ run: { id: 9, created_at: '2026-09-29T23:59:00Z' }, onOpenAnalytics: vi.fn() });

    expect(screen.queryByTestId('run-history-analytics')).not.toBeInTheDocument();
  });

  it('hides Analytics when the screen does not offer it', () => {
    renderMenu();

    expect(screen.queryByTestId('run-history-analytics')).not.toBeInTheDocument();
  });
});
