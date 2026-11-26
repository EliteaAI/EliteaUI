// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../ContextBudgetPopover', () => ({
  default: ({ open, placement, conversationId, isHighUtilization }) =>
    open ? (
      <div
        data-testid="context-budget-popover"
        data-placement={placement}
        data-conversation={conversationId}
        data-high={String(isHighUtilization)}
      />
    ) : null,
}));

const { default: ContextBudgetRing } = await import('../ContextBudgetRing');

const theme = createTheme({ palette: darkPalette });
const ALERT_COLOR = 'rgb(255, 0, 0)';

const baseStats = {
  utilizationPercentage: 12,
  currentTokens: 7300,
  maxTokens: 64000,
  windowMode: 'balanced',
};

const renderRing = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ContextBudgetRing
        stats={baseStats}
        isHighUtilization={false}
        utilizationColor={ALERT_COLOR}
        conversationId={5}
        {...props}
      />
    </ThemeProvider>,
  );

const progressColor = () => getComputedStyle(screen.getByTestId('context-budget-ring-progress')).color;

describe('ContextBudgetRing', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the number without «%»', () => {
    renderRing();

    const ring = screen.getByTestId('context-budget-ring');
    expect(ring).toHaveTextContent(/^12$/);
    expect(ring).toHaveAttribute('aria-label', 'Context 12% used');
  });

  it('shows the three-line tooltip on hover', async () => {
    renderRing();
    fireEvent.mouseOver(screen.getByTestId('context-budget-ring'));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Context window · Balanced');
    expect(tooltip).toHaveTextContent('12% used (88% left)');
    expect(tooltip).toHaveTextContent('7k / 64k tokens used');
  });

  it('names the Full window in the tooltip', async () => {
    renderRing({ stats: { ...baseStats, windowMode: 'full' } });
    fireEvent.mouseOver(screen.getByTestId('context-budget-ring'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Context window · Full');
  });

  it('stays grey far from the limit and takes the alert colour near it', () => {
    renderRing();
    expect(progressColor()).not.toBe(ALERT_COLOR);

    cleanup();
    renderRing({ isHighUtilization: true });
    expect(progressColor()).toBe(ALERT_COLOR);
  });

  it('toggles the card above the ring on click', () => {
    renderRing({ isHighUtilization: true });
    const ring = screen.getByTestId('context-budget-ring');

    fireEvent.click(ring);
    const popover = screen.getByTestId('context-budget-popover');
    expect(popover).toHaveAttribute('data-placement', 'top-end');
    expect(popover).toHaveAttribute('data-conversation', '5');
    expect(popover).toHaveAttribute('data-high', 'true');
    expect(ring).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(ring);
    expect(screen.queryByTestId('context-budget-popover')).toBeNull();
  });

  it('opens with Enter and closes with Escape', () => {
    renderRing();
    const ring = screen.getByTestId('context-budget-ring');

    fireEvent.keyDown(ring, { key: 'Enter' });
    expect(screen.getByTestId('context-budget-popover')).toBeInTheDocument();

    fireEvent.keyDown(ring, { key: 'Escape' });
    expect(screen.queryByTestId('context-budget-popover')).toBeNull();
  });
});
