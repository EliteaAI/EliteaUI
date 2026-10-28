// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { PipelineEditorMode } from '@/common/constants';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import CanvasToolbar from '../CanvasToolbar';

const theme = createTheme({ palette: darkPalette });

const renderToolbar = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <CanvasToolbar
        mode={PipelineEditorMode.Flow}
        onModeChange={vi.fn()}
        onAddNode={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('CanvasToolbar', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the + Node button in Flow mode', () => {
    renderToolbar();

    expect(screen.getByTestId('pipeline-add-node-button')).toBeInTheDocument();
  });

  it('hides + Node in Yaml mode; copy lives in the YAML editor', () => {
    renderToolbar({ mode: PipelineEditorMode.Yaml });

    expect(screen.queryByTestId('pipeline-add-node-button')).toBeNull();
    expect(screen.queryByTestId('pipeline-yaml-copy-button')).toBeNull();
  });

  it('opens the node type selector and adds the chosen node', () => {
    const onAddNode = vi.fn();
    renderToolbar({ onAddNode });

    fireEvent.click(screen.getByTestId('pipeline-add-node-button'));
    fireEvent.click(screen.getByTestId('pipeline-add-node-menu-item-agent'));

    expect(onAddNode).toHaveBeenCalledWith('agent');
  });

  it('renders Test Pipeline only when onTestPipeline is provided', () => {
    renderToolbar();
    expect(screen.queryByTestId('pipeline-test-button')).toBeNull();

    cleanup();
    renderToolbar({ onTestPipeline: vi.fn() });
    expect(screen.getByTestId('pipeline-test-button')).toBeEnabled();
  });

  it('disables Test Pipeline when a disabled reason is given', () => {
    renderToolbar({ onTestPipeline: vi.fn(), testDisabledReason: 'Connect the entry point to End' });

    expect(screen.getByTestId('pipeline-test-button')).toBeDisabled();
  });
});
