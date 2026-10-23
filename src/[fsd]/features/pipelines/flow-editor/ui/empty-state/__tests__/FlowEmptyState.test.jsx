// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import FlowEmptyState from '../FlowEmptyState';

const theme = createTheme({ palette: darkPalette });

const renderEmptyState = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <FlowEmptyState {...props} />
    </ThemeProvider>,
  );

describe('FlowEmptyState', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('renders the empty-state message and the Add Node button', () => {
    renderEmptyState({ onAddNode: vi.fn() });

    expect(screen.getByText('Start by adding your first node to the canvas!')).toBeInTheDocument();
    expect(screen.getByTestId('pipeline-empty-state-add-node-button')).toBeInTheDocument();
  });

  it('hides the Add Node button when disabled', () => {
    renderEmptyState({ onAddNode: vi.fn(), disabled: true });

    expect(screen.queryByTestId('pipeline-empty-state-add-node-button')).toBeNull();
  });

  it('opens the node type selector and adds the chosen node', () => {
    const onAddNode = vi.fn();
    renderEmptyState({ onAddNode });

    fireEvent.click(screen.getByTestId('pipeline-empty-state-add-node-button'));
    expect(screen.getByTestId('pipeline-node-type-selector')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pipeline-add-node-menu-item-llm'));
    expect(onAddNode).toHaveBeenCalledWith('llm');
  });
});
