// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Box, ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import IndexActivityPanel from '../IndexActivityPanel';

vi.mock('../../RunIndexResultsPanel', () => ({
  default: () => <Box data-testid="run-index-results-panel" />,
}));

afterEach(() => cleanup());

const theme = createTheme({
  palette: { icon: { fill: { disabled: '#888' } } },
});

const renderPanel = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <IndexActivityPanel
        chatHistory={[]}
        chatConversation={null}
        {...props}
      />
    </ThemeProvider>,
  );

describe('IndexActivityPanel', () => {
  it('renders the indexing stream when the run has activity', () => {
    renderPanel({ hasActivity: true });

    expect(screen.getByTestId('run-index-results-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('index-activity-empty-state')).not.toBeInTheDocument();
  });

  it('renders the empty state when there is no activity to show', () => {
    renderPanel({ hasActivity: false });

    expect(screen.getByTestId('index-activity-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('run-index-results-panel')).not.toBeInTheDocument();
  });
});
