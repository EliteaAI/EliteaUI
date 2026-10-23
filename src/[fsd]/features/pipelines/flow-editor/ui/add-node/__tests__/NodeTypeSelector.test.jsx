// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import NodeTypeSelector from '../NodeTypeSelector';

const { PipelineNodeTypes, PipelineNodeDescriptions, PipelineNodeDisplayNames } = FlowEditorConstants;

const theme = createTheme({ palette: darkPalette });

const renderSelector = (props = {}) => {
  const anchorEl = document.createElement('div');
  document.body.appendChild(anchorEl);

  return render(
    <ThemeProvider theme={theme}>
      <NodeTypeSelector
        open
        anchorEl={anchorEl}
        {...props}
      />
    </ThemeProvider>,
  );
};

describe('NodeTypeSelector', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('renders the title and the 10 node types with their descriptions', () => {
    renderSelector();

    expect(screen.getByText('Select node type')).toBeInTheDocument();
    const cards = screen.getAllByTestId(/^pipeline-add-node-menu-item-/);
    expect(cards).toHaveLength(10);
    expect(screen.getByText(PipelineNodeDisplayNames[PipelineNodeTypes.Hitl])).toBeInTheDocument();
    expect(screen.getByText(PipelineNodeDescriptions[PipelineNodeTypes.LLM])).toBeInTheDocument();
  });

  it('does not render deprecated node types', () => {
    renderSelector();

    expect(screen.queryByTestId(`pipeline-add-node-menu-item-${PipelineNodeTypes.Function}`)).toBeNull();
    expect(screen.queryByTestId(`pipeline-add-node-menu-item-${PipelineNodeTypes.Custom}`)).toBeNull();
  });

  it('calls onSelect with the type and then onClose when a card is clicked', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    renderSelector({ onSelect, onClose });

    fireEvent.click(screen.getByTestId(`pipeline-add-node-menu-item-${PipelineNodeTypes.Router}`));

    expect(onSelect).toHaveBeenCalledWith(PipelineNodeTypes.Router);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('selects a card with the keyboard', () => {
    const onSelect = vi.fn();
    renderSelector({ onSelect });

    fireEvent.keyDown(screen.getByTestId(`pipeline-add-node-menu-item-${PipelineNodeTypes.Code}`), {
      key: 'Enter',
    });

    expect(onSelect).toHaveBeenCalledWith(PipelineNodeTypes.Code);
  });

  it('renders one column inside a narrow canvas', () => {
    const boundaryEl = document.createElement('div');
    boundaryEl.getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      width: 400,
      height: 500,
      bottom: 500,
      right: 400,
    });
    renderSelector({ boundaryEl });

    expect(screen.getByTestId('pipeline-node-type-selector')).toHaveAttribute('data-columns', '1');
  });

  it('keeps the fitted layout while closing instead of jumping to full size', () => {
    const anchorEl = document.createElement('div');
    document.body.appendChild(anchorEl);
    const boundaryEl = document.createElement('div');
    boundaryEl.getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      width: 400,
      height: 500,
      bottom: 500,
      right: 400,
    });
    const renderWith = open => (
      <ThemeProvider theme={theme}>
        <NodeTypeSelector
          open={open}
          anchorEl={anchorEl}
          boundaryEl={boundaryEl}
        />
      </ThemeProvider>
    );
    const { rerender } = render(renderWith(true));

    rerender(renderWith(false));

    expect(screen.getByTestId('pipeline-node-type-selector')).toHaveAttribute('data-columns', '1');
  });

  it('renders only the available types when they are given', () => {
    renderSelector({ availableTypes: [PipelineNodeTypes.LLM, PipelineNodeTypes.Agent] });

    const cards = screen.getAllByTestId(/^pipeline-add-node-menu-item-/);
    expect(cards.map(card => card.dataset.testid)).toEqual([
      `pipeline-add-node-menu-item-${PipelineNodeTypes.Agent}`,
      `pipeline-add-node-menu-item-${PipelineNodeTypes.LLM}`,
    ]);
  });

  it('opens at an anchor position without an anchor element', () => {
    render(
      <ThemeProvider theme={theme}>
        <NodeTypeSelector
          open
          anchorPosition={{ top: 100, left: 200 }}
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('pipeline-node-type-selector')).toBeInTheDocument();
  });

  it('renders two columns by default', () => {
    renderSelector();

    expect(screen.getByTestId('pipeline-node-type-selector')).toHaveAttribute('data-columns', '2');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    renderSelector({ onClose });

    fireEvent.keyDown(screen.getByTestId('pipeline-node-type-selector'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
