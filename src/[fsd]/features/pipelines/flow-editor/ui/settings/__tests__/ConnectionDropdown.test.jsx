// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ConnectionDropdown from '../ConnectionDropdown';

const { PipelineNodeTypes } = FlowEditorConstants;

const theme = createTheme({ palette: darkPalette });

const targetNodes = [{ id: 'llm_1', type: PipelineNodeTypes.LLM, data: { label: 'llm_1' } }];

const renderDropdown = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ConnectionDropdown
        open
        anchorPosition={{ x: 100, y: 100 }}
        onNodeSelect={vi.fn()}
        onNodeCreate={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ConnectionDropdown', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('opens the node type selector directly when there are no targets', () => {
    renderDropdown({ targetNodes: [] });

    expect(screen.getByTestId('pipeline-node-type-selector')).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-connection-dropdown-menu')).toBeNull();
  });

  it('switches from the targets menu to the node type selector on "Create new node"', () => {
    renderDropdown({ targetNodes });

    expect(screen.getByText('llm_1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Create new node'));

    expect(screen.getByTestId('pipeline-node-type-selector')).toBeInTheDocument();
  });

  it('opens the node type selector when node creation is forced, even with targets', () => {
    renderDropdown({ targetNodes, forceNodeCreation: true });

    expect(screen.getByTestId('pipeline-node-type-selector')).toBeInTheDocument();
    expect(screen.queryByText('llm_1')).toBeNull();
  });

  it('limits the selector to the available node types', () => {
    renderDropdown({
      targetNodes: [],
      availableNodeTypes: [PipelineNodeTypes.Code, PipelineNodeTypes.Router],
    });

    expect(screen.getAllByTestId(/^pipeline-add-node-menu-item-/)).toHaveLength(2);
  });

  it('creates the selected node type and closes', () => {
    const onNodeCreate = vi.fn();
    const onClose = vi.fn();
    renderDropdown({ targetNodes: [], onNodeCreate, onClose });

    fireEvent.click(screen.getByTestId(`pipeline-add-node-menu-item-${PipelineNodeTypes.Printer}`));

    expect(onNodeCreate).toHaveBeenCalledWith(PipelineNodeTypes.Printer);
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the last open content while closing after the parent clears its state', () => {
    const renderWith = dropdownProps => (
      <ThemeProvider theme={theme}>
        <ConnectionDropdown
          onNodeSelect={vi.fn()}
          onNodeCreate={vi.fn()}
          onClose={vi.fn()}
          {...dropdownProps}
        />
      </ThemeProvider>
    );
    const { rerender } = render(
      renderWith({
        open: true,
        anchorPosition: { x: 100, y: 100 },
        targetNodes: [],
        availableNodeTypes: [PipelineNodeTypes.Code, PipelineNodeTypes.Router],
      }),
    );

    rerender(renderWith({ open: false, anchorPosition: null, targetNodes: [], availableNodeTypes: [] }));

    expect(screen.getAllByTestId(/^pipeline-add-node-menu-item-/)).toHaveLength(2);
  });

  it('connects to an existing target node', () => {
    const onNodeSelect = vi.fn();
    renderDropdown({ targetNodes, onNodeSelect });

    fireEvent.click(screen.getByText('llm_1'));

    expect(onNodeSelect).toHaveBeenCalledWith(targetNodes[0]);
  });
});
