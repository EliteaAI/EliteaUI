// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useGetComponentWidth: () => ({ componentRef: vi.fn(), componentWidth: 300 }),
  useCheckViewScrollHorizontally: () => ({ isScrollable: false, viewRef: vi.fn() }),
  useIsSmallWindow: () => ({ isSmallWindow: false }),
  useModal: () => ({ isOpen: false, handleOpen: vi.fn(), handleClose: vi.fn() }),
  useSelectedProjectId: () => 1,
}));
vi.mock('react-redux', () => ({
  useSelector: selector => selector({ chat: {} }),
}));
vi.mock('@/[fsd]/shared/config/store', () => ({
  default: { getState: () => ({}), dispatch: vi.fn() },
}));
vi.mock('@/[fsd]/shared/lib/utils', () => ({
  isAutoSelection: () => false,
}));
vi.mock('@/api', () => ({
  useGetContextStatusQuery: () => ({
    data: {
      utilization: 0.12,
      current_tokens: 120,
      max_tokens: 1000,
      strategy_name: 'sliding_window',
    },
  }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => true }),
}));
vi.mock('@/[fsd]/shared/ui', async () => {
  const { default: BaseBtn } = await import('@/[fsd]/shared/ui/button/BaseBtn');
  const { default: EllipsisTypography } = await import('@/[fsd]/shared/ui/text/EllipsisTypography');
  return { Button: { BaseBtn }, Text: { EllipsisTypography } };
});
vi.mock('@/[fsd]/widgets/context-budget/lib/hooks/useContextUtilization.hooks', () => ({
  useContextUtilization: () => ({ percentage: 12, isHigh: false }),
}));
vi.mock('@/[fsd]/widgets/context-budget/lib/hooks/useContextWindowSwitch.hooks', () => ({
  useContextWindowSwitch: () => ({ switchMode: vi.fn(), isSwitching: false }),
}));
vi.mock('@/[fsd]/widgets/context-budget/lib/hooks', () => ({
  useSummarizeContext: () => ({
    isDialogOpen: false,
    openDialog: vi.fn(),
    closeDialog: vi.fn(),
    confirmSummarize: vi.fn(),
    isSummarizing: false,
  }),
}));
vi.mock('../collapsed-participants/CollapsedPerticapantsList', () => ({ default: () => null }));
vi.mock('../expanded-participants/ExpandedParticipantsList', () => ({ default: () => null }));
vi.mock('@/[fsd]/widgets/context-budget/ui/ContextBudgetPopover', () => ({
  default: ({ open }) => (open ? <div data-testid="budget-popover" /> : null),
}));
vi.mock('@/[fsd]/widgets/context-budget/ui/ContextStrategyModal', () => ({ default: () => null }));
vi.mock('@/[fsd]/widgets/context-budget/ui/ContextBudgetCompact', () => ({ default: () => null }));
vi.mock('@/[fsd]/widgets/context-budget/ui/SummarizeConfirmDialog', () => ({ default: () => null }));
vi.mock('@/[fsd]/widgets/context-budget/ui', async () => {
  const { default: ContextBudgetHeader } =
    await import('@/[fsd]/widgets/context-budget/ui/ContextBudgetHeader');
  return {
    ContextBudgetHeader,
    ContextBudgetDetails: () => null,
    ContextBudgetProgress: () => null,
    ContextBudgetStatsDisplay: () => null,
    ContextHighUsageBanner: () => null,
    ContextStrategyModal: () => null,
    ContextWindowModeSelector: () => null,
  };
});
vi.mock('@/[fsd]/widgets/context-budget', async () => {
  const { default: ContextBudgetInfo } = await import('@/[fsd]/widgets/context-budget/ui/ContextBudgetInfo');
  return { ContextBudgetUI: { ContextBudgetInfo } };
});

const { default: Participants } = await import('../Participants');
const theme = createTheme({ palette: darkPalette });

const renderParticipants = collapsed =>
  render(
    <ThemeProvider theme={theme}>
      <Participants
        collapsed={collapsed}
        conversationId={1}
        participants={[]}
      />
    </ThemeProvider>,
  );

describe('Participants context budget', () => {
  afterEach(cleanup);

  it('collapses and expands the budget while participants are expanded', () => {
    renderParticipants(false);

    const collapse = screen.getByRole('button', { name: 'Collapse context management' });
    collapse.focus();
    fireEvent.click(collapse);
    const ring = screen.getByRole('button', { name: 'Expand context management 12%' });
    expect(ring).not.toHaveAttribute('aria-haspopup');
    expect(ring).toHaveFocus();
    fireEvent.keyDown(ring, { key: 'Enter' });
    expect(screen.getByRole('button', { name: 'Collapse context management' })).toHaveFocus();
  });

  it('keeps the popover behavior when participants are collapsed', () => {
    const { rerender } = renderParticipants(false);
    const participantsToggle = screen.getByTestId('chat-participants-panel-toggle-button');
    participantsToggle.focus();

    rerender(
      <ThemeProvider theme={theme}>
        <Participants
          collapsed
          conversationId={1}
          participants={[]}
        />
      </ThemeProvider>,
    );
    expect(participantsToggle).toHaveFocus();
    const ring = screen.getByRole('button', { name: 'Context management 12%' });
    expect(ring).toHaveAttribute('aria-haspopup', 'dialog');
    fireEvent.click(ring);
    expect(screen.getByTestId('budget-popover')).toBeInTheDocument();
    expect(ring).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(ring);
    expect(screen.queryByTestId('budget-popover')).not.toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <Participants
          collapsed={false}
          conversationId={1}
          participants={[]}
        />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Collapse context management' })).toBeInTheDocument();
  });

  it('resets the budget to expanded after toggling the participants panel', () => {
    const onCollapsed = vi.fn();
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <Participants
          collapsed={false}
          onCollapsed={onCollapsed}
          conversationId={1}
          participants={[]}
        />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Collapse context management' }));
    fireEvent.click(screen.getByTestId('chat-participants-panel-toggle-button'));
    expect(onCollapsed).toHaveBeenCalledTimes(1);
    rerender(
      <ThemeProvider theme={theme}>
        <Participants
          collapsed
          onCollapsed={onCollapsed}
          conversationId={1}
          participants={[]}
        />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Context management 12%' })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('chat-participants-panel-toggle-button'));
    expect(onCollapsed).toHaveBeenCalledTimes(2);
    rerender(
      <ThemeProvider theme={theme}>
        <Participants
          collapsed={false}
          onCollapsed={onCollapsed}
          conversationId={1}
          participants={[]}
        />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Collapse context management' })).toBeInTheDocument();
  });
});
