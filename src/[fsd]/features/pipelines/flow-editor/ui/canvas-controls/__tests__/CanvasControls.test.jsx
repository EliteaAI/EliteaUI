// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import CanvasControls from '../CanvasControls';

const zoomIn = vi.fn();
const zoomOut = vi.fn();
const fitView = vi.fn();

vi.mock('@xyflow/react', async importOriginal => ({
  ...(await importOriginal()),
  Panel: ({ children }) => <div data-testid="rf-panel">{children}</div>,
  useReactFlow: () => ({ zoomIn, zoomOut, fitView }),
}));

const theme = createTheme({ palette: darkPalette });

const renderControls = (props = {}) => {
  const handlers = { onToggleLock: vi.fn(), onArrange: vi.fn(), onToggleMinimap: vi.fn() };
  render(
    <ThemeProvider theme={theme}>
      <CanvasControls
        isLocked={false}
        orientation="vertical"
        isMinimapVisible={false}
        {...handlers}
        {...props}
      />
    </ThemeProvider>,
  );
  return handlers;
};

describe('CanvasControls', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the six controls in order with their tooltips', () => {
    renderControls();

    const labels = within(screen.getByTestId('pipeline-canvas-controls'))
      .getAllByRole('button')
      .map(button => button.getAttribute('aria-label'));
    expect(labels).toEqual([
      'Zoom in',
      'Zoom out',
      'Fit view',
      'Lock canvas',
      'Auto-arrange',
      'Show minimap',
    ]);
  });

  it('zooms and fits through React Flow', () => {
    renderControls();

    fireEvent.click(screen.getByTestId('pipeline-canvas-zoom-in'));
    fireEvent.click(screen.getByTestId('pipeline-canvas-zoom-out'));
    fireEvent.click(screen.getByTestId('pipeline-canvas-fit-view'));

    expect(zoomIn).toHaveBeenCalledTimes(1);
    expect(zoomOut).toHaveBeenCalledTimes(1);
    expect(fitView).toHaveBeenCalledTimes(1);
  });

  it('reflects the lock state and toggles it', () => {
    const { onToggleLock } = renderControls({ isLocked: true });
    const lockButton = screen.getByTestId('pipeline-canvas-lock');

    expect(lockButton).toHaveAttribute('aria-label', 'Unlock canvas');
    expect(lockButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(lockButton);
    expect(onToggleLock).toHaveBeenCalledTimes(1);
  });

  it('reflects the minimap state and toggles it', () => {
    const { onToggleMinimap } = renderControls({ isMinimapVisible: true });
    const minimapButton = screen.getByTestId('pipeline-canvas-minimap-toggle');

    expect(minimapButton).toHaveAttribute('aria-label', 'Hide minimap');

    fireEvent.click(minimapButton);
    expect(onToggleMinimap).toHaveBeenCalledTimes(1);
  });

  it('marks the current orientation in the Arrange menu', () => {
    renderControls({ orientation: 'horizontal' });

    fireEvent.click(screen.getByTestId('pipeline-canvas-arrange'));

    expect(screen.getByTestId('pipeline-canvas-arrange-lr')).toHaveAttribute('data-current', 'true');
    expect(screen.getByTestId('pipeline-canvas-arrange-tb')).not.toHaveAttribute('data-current');
  });

  it.each([
    ['pipeline-canvas-arrange-tb', 'vertical'],
    ['pipeline-canvas-arrange-lr', 'horizontal'],
  ])('arranges from the menu (%s)', (testId, orientation) => {
    const { onArrange } = renderControls();

    fireEvent.click(screen.getByTestId('pipeline-canvas-arrange'));
    fireEvent.click(screen.getByTestId(testId));

    expect(onArrange).toHaveBeenCalledWith(orientation);
  });

  it('disables Arrange when the pipeline can not be arranged', () => {
    renderControls({ canArrange: false });

    expect(screen.getByTestId('pipeline-canvas-arrange')).toBeDisabled();
  });
});
