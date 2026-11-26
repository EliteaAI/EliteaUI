// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useGetComponentWidth: () => ({ componentRef: vi.fn(), componentWidth: 300 }),
  useIsSmallWindow: () => ({ isSmallWindow: false }),
}));
vi.mock('../collapsed-participants/CollapsedPerticapantsList', () => ({ default: () => null }));
vi.mock('../expanded-participants/ExpandedParticipantsList', () => ({ default: () => null }));

const { default: Participants } = await import('../Participants');
const theme = createTheme({ palette: darkPalette });

describe('Participants context budget', () => {
  afterEach(cleanup);

  it.each([
    ['unfolded', false],
    ['folded', true],
  ])('has no context block when %s (the ring is in the field)', (_, collapsed) => {
    render(
      <ThemeProvider theme={theme}>
        <Participants
          collapsed={collapsed}
          conversationId={1}
          participants={[]}
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('chat-participants-panel-toggle-button')).toBeInTheDocument();
    expect(screen.queryByTestId('context-budget-ring')).not.toBeInTheDocument();
    expect(screen.queryByTestId('context-budget-title')).not.toBeInTheDocument();
  });
});
