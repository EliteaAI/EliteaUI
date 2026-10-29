// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ContextWindowModeSelector from '../ContextWindowModeSelector';

const theme = createTheme({ palette: darkPalette });

const renderSelector = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ContextWindowModeSelector
        value="balanced"
        onChange={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ContextWindowModeSelector', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the tokens of each mode for a large model window', () => {
    renderSelector({ balancedWindowTokens: 272000, fullWindowTokens: 400000 });
    expect(screen.getByTestId('context-window-mode-balanced')).toHaveTextContent('Balanced \xB7 272K');
    expect(screen.getByTestId('context-window-mode-full')).toHaveTextContent('Full \xB7 400K');
    expect(screen.queryByTestId('context-window-mode-identical-hint')).not.toBeInTheDocument();
  });

  it('shows the same message and equal tokens when the model window is below the Balanced cap', () => {
    renderSelector({ balancedWindowTokens: 128000, fullWindowTokens: 128000 });
    expect(screen.getByTestId('context-window-mode-balanced')).toHaveTextContent('Balanced \xB7 128K');
    expect(screen.getByTestId('context-window-mode-full')).toHaveTextContent('Full \xB7 128K');
    expect(screen.getByTestId('context-window-mode-identical-hint')).toHaveTextContent(
      'This model’s window is 128K, so Balanced and Full are the same.',
    );
  });

  it('falls back to plain labels when the model window is unknown', () => {
    renderSelector();
    expect(screen.getByTestId('context-window-mode-balanced')).toHaveTextContent(/^Balanced$/);
    expect(screen.getByTestId('context-window-mode-full')).toHaveTextContent(/^Full$/);
  });

  it('reports the newly selected mode', () => {
    const onChange = vi.fn();
    renderSelector({ onChange, balancedWindowTokens: 272000, fullWindowTokens: 400000 });
    fireEvent.click(screen.getByTestId('context-window-mode-full'));
    expect(onChange).toHaveBeenCalledWith('full');
  });

  it('does not report a change while disabled', () => {
    const onChange = vi.fn();
    renderSelector({ onChange, balancedWindowTokens: 272000, fullWindowTokens: 400000, disabled: true });
    fireEvent.click(screen.getByTestId('context-window-mode-full'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
