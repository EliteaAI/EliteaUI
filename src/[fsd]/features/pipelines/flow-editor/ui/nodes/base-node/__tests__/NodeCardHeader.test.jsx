// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import NodeCardHeader from '../NodeCardHeader';

const onStartEditing = vi.fn();

vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/hooks', () => ({
  useNodeRename: ({ name }) => ({
    isEditingName: false,
    inputtedName: name,
    onStartEditing,
    onChange: vi.fn(),
    onBlur: vi.fn(),
  }),
}));

vi.mock('@/components/DotMenu', () => ({
  default: ({ children }) => (
    <div data-testid="node-menu">
      {children.map(item => (
        <button
          key={item.label}
          disabled={item.disabled}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

const { PipelineNodeTypes, NodeCardStatus } = FlowEditorConstants;

const theme = createTheme({ palette: darkPalette });

const renderHeader = (props = {}, contextOverrides = {}) => {
  const context = {
    yamlJsonObject: { entry_point: 'llm_1', nodes: [] },
    setYamlJsonObject: vi.fn(),
    handleDeleteNode: vi.fn(),
    ...contextOverrides,
  };
  render(
    <ThemeProvider theme={theme}>
      <FlowEditorContext.Provider value={context}>
        <NodeCardHeader
          name="printer_1"
          id="printer_1"
          type={PipelineNodeTypes.Printer}
          {...props}
        />
      </FlowEditorContext.Provider>
    </ThemeProvider>,
  );
  return context;
};

describe('NodeCardHeader', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the icon tile, the node name and the node type', () => {
    renderHeader();

    expect(screen.getByTestId('pipeline-node-icon-tile')).toBeInTheDocument();
    expect(screen.getByTestId('pipeline-node-name')).toHaveTextContent('printer_1');
    expect(screen.getByTestId('pipeline-node-type')).toHaveTextContent('Printer');
  });

  it('starts renaming on double click', () => {
    renderHeader();

    fireEvent.doubleClick(screen.getByTestId('pipeline-node-name'));

    expect(onStartEditing).toHaveBeenCalled();
  });

  it('shows the Entrypoint badge only on the entry node', () => {
    renderHeader({ isEntrypoint: true });
    expect(screen.getByTestId('pipeline-node-entrypoint-badge')).toHaveTextContent('Entrypoint');

    cleanup();
    renderHeader();
    expect(screen.queryByTestId('pipeline-node-entrypoint-badge')).toBeNull();
  });

  it('shows the Deprecated badge on deprecated node types', () => {
    renderHeader({ type: PipelineNodeTypes.Loop });
    expect(screen.getByTestId('pipeline-node-deprecated-badge')).toHaveTextContent('Deprecated!');

    cleanup();
    renderHeader();
    expect(screen.queryByTestId('pipeline-node-deprecated-badge')).toBeNull();
  });

  it('shows the running status icon', () => {
    renderHeader({ status: NodeCardStatus.running });

    expect(screen.getByTestId('pipeline-node-status-running')).toBeInTheDocument();
  });

  it('offers Make entrypoint and Delete for a regular node', () => {
    const context = renderHeader();

    fireEvent.click(screen.getByText('Make entrypoint'));
    expect(context.setYamlJsonObject).toHaveBeenCalledWith({
      ...context.yamlJsonObject,
      entry_point: 'printer_1',
    });

    fireEvent.click(screen.getByText('Delete'));
    expect(context.handleDeleteNode).toHaveBeenCalledWith('printer_1');
  });

  it('offers only Delete on the entry node and on Decision', () => {
    renderHeader({ isEntrypoint: true });
    expect(screen.queryByText('Make entrypoint')).toBeNull();
    expect(screen.getByText('Delete')).toBeInTheDocument();

    cleanup();
    renderHeader({ type: PipelineNodeTypes.Decision });
    expect(screen.queryByText('Make entrypoint')).toBeNull();
  });

  it('disables the menu actions in read-only mode', () => {
    renderHeader({ disabled: true });

    expect(screen.getByText('Make entrypoint')).toBeDisabled();
    expect(screen.getByText('Delete')).toBeDisabled();
  });

  it('keeps the menu available on a collapsed card', () => {
    renderHeader();

    expect(screen.getByTestId('node-menu')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
