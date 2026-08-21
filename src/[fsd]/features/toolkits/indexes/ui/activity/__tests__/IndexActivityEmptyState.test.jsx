// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import IndexActivityEmptyState from '../IndexActivityEmptyState';

afterEach(() => cleanup());

const theme = createTheme({
  palette: { icon: { fill: { disabled: '#888' } } },
});

const renderEmptyState = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <IndexActivityEmptyState {...props} />
    </ThemeProvider>,
  );

describe('IndexActivityEmptyState', () => {
  it('states that there is no activity and how to start one', () => {
    renderEmptyState();

    expect(screen.getByText('No indexing activity')).toBeInTheDocument();
    expect(screen.getByText('You may start reindexing with the current settings.')).toBeInTheDocument();
  });

  it('drops the heading when a status banner above already names the outcome', () => {
    renderEmptyState({ statusShownAbove: true });

    expect(screen.queryByText('No indexing activity')).not.toBeInTheDocument();
    expect(screen.getByText('You may start reindexing with the current settings.')).toBeInTheDocument();
  });

  it('sends the Configuration link to the other tab', () => {
    const onOpenConfiguration = vi.fn();
    renderEmptyState({ onOpenConfiguration });

    fireEvent.click(screen.getByTestId('index-activity-configuration-link'));

    expect(onOpenConfiguration).toHaveBeenCalledTimes(1);
  });
});
