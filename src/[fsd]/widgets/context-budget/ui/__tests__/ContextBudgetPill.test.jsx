// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../ContextBudgetPopover', () => ({
  default: ({ open, placement, conversationId }) =>
    open ? (
      <div
        data-testid="context-budget-popover"
        data-placement={placement}
        data-conversation={conversationId}
      />
    ) : null,
}));

const { default: ContextBudgetPill } = await import('../ContextBudgetPill');

const theme = createTheme({ palette: darkPalette });

const baseStats = {
  utilizationPercentage: 12,
  maxTokens: 1000,
  messageGroups: 2,
  summariesGenerated: 1,
};

const renderPill = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ContextBudgetPill
        stats={baseStats}
        isHighUtilization={false}
        utilizationColor="#00ff00"
        conversationId={5}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ContextBudgetPill', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the utilization percentage', () => {
    renderPill();
    expect(screen.getByTestId('context-budget-pill')).toHaveTextContent('12%');
  });

  it('shows a dash when there is no token limit', () => {
    renderPill({ stats: { ...baseStats, maxTokens: 0 } });
    expect(screen.getByTestId('context-budget-pill')).toHaveTextContent('-');
  });

  it('shows the short summary tooltip on hover', async () => {
    renderPill();
    fireEvent.mouseOver(screen.getByTestId('context-budget-pill'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Context 12% · Messages 2 · Summaries 1');
  });

  it('toggles the full context popover below the pill on click', () => {
    renderPill();
    const pill = screen.getByTestId('context-budget-pill');

    fireEvent.click(pill);
    const popover = screen.getByTestId('context-budget-popover');
    expect(popover).toHaveAttribute('data-placement', 'bottom-end');
    expect(popover).toHaveAttribute('data-conversation', '5');
    expect(pill).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(pill);
    expect(screen.queryByTestId('context-budget-popover')).toBeNull();
  });

  it('opens with the keyboard', () => {
    renderPill();
    fireEvent.keyDown(screen.getByTestId('context-budget-pill'), { key: 'Enter' });
    expect(screen.getByTestId('context-budget-popover')).toBeInTheDocument();
  });
});
