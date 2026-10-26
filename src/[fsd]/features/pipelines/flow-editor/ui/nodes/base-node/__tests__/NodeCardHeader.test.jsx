// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import NodeCardHeader from '../NodeCardHeader';

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

  it('is view-only: no rename on double click', () => {
    renderHeader();

    fireEvent.doubleClick(screen.getByTestId('pipeline-node-name'));

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByTestId('pipeline-node-name')).toHaveTextContent('printer_1');
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

  it('shows the needs configuration icon with the reasons in its tooltip', async () => {
    renderHeader({
      status: NodeCardStatus.needsConfiguration,
      configIssues: ['Select a toolkit', 'Fill in the required input: repo'],
    });

    const icon = screen.getByTestId('pipeline-node-status-needsConfiguration');
    fireEvent.mouseOver(icon);

    expect(await screen.findByText('Select a toolkit')).toBeInTheDocument();
    expect(screen.getByText('Fill in the required input: repo')).toBeInTheDocument();
  });

  it('has no actions menu: entrypoint and delete live in the node panel', () => {
    renderHeader();

    expect(screen.queryByText('Make entrypoint')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
  });
});
