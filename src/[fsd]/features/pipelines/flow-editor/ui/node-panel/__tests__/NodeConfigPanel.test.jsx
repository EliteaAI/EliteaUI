// @vitest-environment jsdom
import { useContext } from 'react';

import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext, NodeConfigPanelContext } from '@/[fsd]/shared/lib/context';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import NodeConfigPanel from '../NodeConfigPanel';

const { toastSuccess } = vi.hoisted(() => ({ toastSuccess: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastSuccess, toastError: vi.fn() }),
}));

vi.mock('@/[fsd]/features/pipelines/yaml-editor/ui', () => ({
  YamlCodeEditor: props => (
    <textarea
      data-testid="node-yaml-editor-stub"
      value={props.code}
      readOnly={props.disabled}
      onChange={event => props.onChangeCode(event.target.value)}
    />
  ),
}));

const { PipelineNodeTypes } = FlowEditorConstants;

const theme = createTheme({ palette: darkPalette });

// Stands in for a node component rendered in panel mode
const NodeFieldsStub = props => {
  const panelContext = useContext(NodeConfigPanelContext);
  const flowEditorContext = useContext(FlowEditorContext);
  return (
    <div
      data-testid="node-fields-stub"
      data-node-id={props.id}
      data-entrypoint={String(panelContext?.isEntrypoint)}
      data-disabled={String(Boolean(flowEditorContext?.disabled))}
    />
  );
};

const renderPanel = ({
  flowNode = { id: 'router_1', type: PipelineNodeTypes.Router, data: {} },
  context,
} = {}) => {
  const contextValue = {
    yamlJsonObject: {
      entry_point: 'llm_1',
      nodes: [
        { id: 'llm_1', type: PipelineNodeTypes.LLM },
        { id: 'router_1', type: PipelineNodeTypes.Router },
      ],
    },
    setYamlJsonObject: vi.fn(),
    setFlowNodes: vi.fn(),
    setFlowEdges: vi.fn(),
    handleDeleteNode: vi.fn(),
    isRunningPipeline: false,
    disabled: false,
    ...context,
  };
  const onClose = vi.fn();
  const onRenamed = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={{ version_details: { tools: [] } }}
        onSubmit={vi.fn()}
      >
        <FlowEditorContext.Provider value={contextValue}>
          <NodeConfigPanel
            flowNode={flowNode}
            NodeComponent={NodeFieldsStub}
            onClose={onClose}
            onRenamed={onRenamed}
          />
        </FlowEditorContext.Provider>
      </Formik>
    </ThemeProvider>,
  );
  return { contextValue, onClose, onRenamed };
};

describe('NodeConfigPanel', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the node type, its description, the Flow view and the node fields', () => {
    renderPanel();

    expect(screen.getByTestId('pipeline-node-panel-type')).toHaveTextContent('Router');
    expect(screen.getByTestId('pipeline-node-panel-description')).toHaveTextContent(
      'Directs flow to different paths based on conditions.',
    );
    expect(screen.getByTestId('pipeline-node-panel-view-flow')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('pipeline-node-panel-view-yaml')).toBeEnabled();
    expect(screen.getByTestId('pipeline-node-panel-name-input')).toHaveValue('router_1');
    expect(screen.getByTestId('node-fields-stub')).toHaveAttribute('data-node-id', 'router_1');
    expect(screen.getByTestId('pipeline-node-panel')).toHaveClass('nokey');
  });

  it('closes from ✕', () => {
    const { onClose } = renderPanel();

    fireEvent.click(screen.getByTestId('pipeline-node-panel-close'));

    expect(onClose).toHaveBeenCalled();
  });

  it('makes the node the entrypoint and confirms it with a toast', () => {
    const { contextValue } = renderPanel();

    fireEvent.click(screen.getByTestId('pipeline-node-panel-make-entrypoint'));

    const updater = contextValue.setYamlJsonObject.mock.calls[0][0];
    expect(updater(contextValue.yamlJsonObject).entry_point).toBe('router_1');
    expect(toastSuccess).toHaveBeenCalledWith('router_1 is set as entrypoint');
  });

  it('shows a non-clickable Entrypoint state on the entry node', () => {
    renderPanel({ flowNode: { id: 'llm_1', type: PipelineNodeTypes.LLM, data: {} } });

    expect(screen.getByTestId('pipeline-node-panel-entrypoint-state')).toHaveTextContent('Entrypoint');
    expect(screen.queryByTestId('pipeline-node-panel-make-entrypoint')).toBeNull();
    expect(screen.getByTestId('node-fields-stub')).toHaveAttribute('data-entrypoint', 'true');
  });

  it('never offers Make Entrypoint on a Decision', () => {
    renderPanel({
      flowNode: { id: 'decision_1', type: PipelineNodeTypes.Decision, data: { label: 'decision_1' } },
    });

    expect(screen.queryByTestId('pipeline-node-panel-make-entrypoint')).toBeNull();
    expect(screen.getByTestId('pipeline-node-panel-delete')).toBeInTheDocument();
  });

  it('deletes through the canvas delete flow', () => {
    const { contextValue } = renderPanel();

    fireEvent.click(screen.getByTestId('pipeline-node-panel-delete'));

    expect(contextValue.handleDeleteNode).toHaveBeenCalledWith('router_1');
  });

  it('hides the footer and disables the name in read-only mode and while running', () => {
    renderPanel({ context: { disabled: true } });
    expect(screen.queryByTestId('pipeline-node-panel-footer')).toBeNull();
    expect(screen.getByTestId('pipeline-node-panel-name-input')).toBeDisabled();

    cleanup();
    renderPanel({ context: { isRunningPipeline: true } });
    expect(screen.queryByTestId('pipeline-node-panel-footer')).toBeNull();
  });

  it('renames on blur and reports the new id', () => {
    const { contextValue, onRenamed } = renderPanel();
    const input = screen.getByTestId('pipeline-node-panel-name-input');

    fireEvent.change(input, { target: { value: 'route_request' } });
    fireEvent.blur(input);

    expect(contextValue.setYamlJsonObject).toHaveBeenCalled();
    expect(onRenamed).toHaveBeenCalledWith('router_1', 'route_request');
  });

  it('shows an inline error for a duplicate name and does not rename', () => {
    const { contextValue, onRenamed } = renderPanel();
    const input = screen.getByTestId('pipeline-node-panel-name-input');

    fireEvent.change(input, { target: { value: 'llm_1' } });
    fireEvent.blur(input);

    expect(
      screen.getByText('The name has been used by other nodes, please input a new name!'),
    ).toBeInTheDocument();
    expect(contextValue.setYamlJsonObject).not.toHaveBeenCalled();
    expect(onRenamed).not.toHaveBeenCalled();
  });

  it('shows a legacy inline decision by its caption and does not let it be renamed', () => {
    renderPanel({
      flowNode: {
        id: `review_decision${FlowEditorConstants.DECISION_NODE_ID_SUFFIX}`,
        type: PipelineNodeTypes.Decision,
        data: { label: 'Decision(deprecated inline decision)' },
      },
    });

    const input = screen.getByTestId('pipeline-node-panel-name-input');
    expect(input).toHaveValue('Decision(deprecated inline decision)');
    expect(input).toBeDisabled();
  });

  it('keeps a regular Decision renamable by its label', () => {
    renderPanel({
      flowNode: { id: 'decision_1', type: PipelineNodeTypes.Decision, data: { label: 'decision_1' } },
    });

    expect(screen.getByTestId('pipeline-node-panel-name-input')).not.toBeDisabled();
  });

  it('shows the deprecation banner for deprecated types', () => {
    renderPanel({ flowNode: { id: 'loop_1', type: PipelineNodeTypes.Loop, data: {} } });

    expect(screen.getByTestId('pipeline-node-panel-deprecation-banner')).toHaveTextContent(
      'View Migration Guide',
    );
    expect(screen.getByTestId('pipeline-node-panel-deprecation-read-only')).toHaveTextContent(
      'Edit this node in the YAML view',
    );
  });

  it('makes a deprecated node read-only in the form, but keeps Delete', () => {
    renderPanel({ flowNode: { id: 'loop_1', type: PipelineNodeTypes.Loop, data: {} } });

    expect(screen.getByTestId('node-fields-stub')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('pipeline-node-panel-name-input')).toBeDisabled();
    expect(screen.queryByTestId('pipeline-node-panel-make-entrypoint')).toBeNull();
    expect(screen.getByTestId('pipeline-node-panel-delete')).toBeInTheDocument();
  });

  it('keeps the form editable for supported node types', () => {
    renderPanel();

    expect(screen.getByTestId('node-fields-stub')).toHaveAttribute('data-disabled', 'false');
    expect(screen.getByTestId('pipeline-node-panel-name-input')).not.toBeDisabled();
  });

  describe('YAML view', () => {
    it('replaces the form with the YAML of this node only', () => {
      renderPanel();

      fireEvent.click(screen.getByTestId('pipeline-node-panel-view-yaml'));

      expect(screen.queryByTestId('node-fields-stub')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pipeline-node-panel-name-input')).not.toBeInTheDocument();
      expect(screen.getByTestId('node-yaml-editor-stub')).toHaveValue('- id: router_1\n  type: router\n');
    });

    it('hides the deprecation banner of a deprecated node', () => {
      renderPanel({ flowNode: { id: 'loop_1', type: PipelineNodeTypes.Loop, data: {} } });

      fireEvent.click(screen.getByTestId('pipeline-node-panel-view-yaml'));

      expect(screen.queryByTestId('pipeline-node-panel-deprecation-banner')).not.toBeInTheDocument();
    });

    it('asks the editor before going back to Flow', () => {
      const requestNodeLeave = vi.fn();
      renderPanel({ context: { requestNodeLeave } });

      fireEvent.click(screen.getByTestId('pipeline-node-panel-view-yaml'));
      fireEvent.click(screen.getByTestId('pipeline-node-panel-view-flow'));

      expect(requestNodeLeave).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('node-yaml-editor-stub')).toBeInTheDocument();

      act(() => requestNodeLeave.mock.calls[0][0]());

      expect(screen.getByTestId('node-fields-stub')).toBeInTheDocument();
    });

    it('is read-only while the pipeline runs', () => {
      renderPanel({ context: { isRunningPipeline: true } });

      fireEvent.click(screen.getByTestId('pipeline-node-panel-view-yaml'));

      expect(screen.getByTestId('node-yaml-editor-stub')).toHaveAttribute('readonly');
    });
  });
});
