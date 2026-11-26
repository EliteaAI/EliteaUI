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

vi.mock('@/[fsd]/features/pipelines/node-ai-draft/ui/NodeAiDraftModal', () => ({
  default: props =>
    props.open ? (
      <div
        data-testid="node-ai-modal-stub"
        data-mode={props.mode}
      />
    ) : null,
}));

const { PipelineNodeTypes } = FlowEditorConstants;

const MODEL_VALUES = { version_details: { tools: [], llm_settings: { model_name: 'gpt-5-mini' } } };

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
  formikValues = { version_details: { tools: [] } },
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
    handleDuplicateNode: vi.fn(),
    isRunningPipeline: false,
    disabled: false,
    ...context,
  };
  const onClose = vi.fn();
  const onRenamed = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={formikValues}
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

  it('links to the node type documentation in a new tab', () => {
    const { onClose } = renderPanel();

    const docsLink = screen.getByTestId('pipeline-node-panel-docs');
    expect(docsLink).toHaveAttribute(
      'href',
      'https://docs.elitea.ai/how-tos/pipelines/nodes/control-flow-nodes#router-node',
    );
    expect(docsLink).toHaveAttribute('target', '_blank');
    expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(docsLink).toHaveAttribute('aria-label', 'Open Router node documentation');

    fireEvent.click(docsLink);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('links a deprecated node to its migration guide', () => {
    renderPanel({ flowNode: { id: 'function_1', type: PipelineNodeTypes.Function, data: {} } });

    const docsLink = screen.getByTestId('pipeline-node-panel-docs');
    expect(docsLink).toHaveAttribute(
      'href',
      'https://docs.elitea.ai/migration/v2.0.1/function-node-migration',
    );
    expect(docsLink).toHaveAttribute('aria-label', 'Open migration guide');
  });

  it('keeps the documentation link in read-only mode and during a run', () => {
    renderPanel({ context: { disabled: true, isRunningPipeline: true } });

    expect(screen.getByTestId('pipeline-node-panel-docs')).toHaveAttribute(
      'href',
      'https://docs.elitea.ai/how-tos/pipelines/nodes/control-flow-nodes#router-node',
    );
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

  it('duplicates through the editor with the toolkit names a copy must not take', async () => {
    const { contextValue } = renderPanel();
    const button = screen.getByTestId('pipeline-node-panel-duplicate');

    expect(button).toHaveAttribute('aria-label', 'Duplicate node');
    expect(button).not.toBeDisabled();
    fireEvent.mouseOver(button);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Duplicate node');

    fireEvent.click(button);

    expect(contextValue.handleDuplicateNode).toHaveBeenCalledWith('router_1', []);
  });

  it('enables Build with AI for an empty node when the version has a model', async () => {
    renderPanel({ formikValues: MODEL_VALUES });
    const button = screen.getByTestId('pipeline-node-panel-build-with-ai');

    expect(button).toHaveAttribute('aria-label', 'Build with AI');
    expect(button).toBeEnabled();
    fireEvent.mouseOver(button);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Build with AI');
    expect(screen.queryByText('Coming soon')).toBeNull();
  });

  it('shows Edit with AI for a configured node', () => {
    renderPanel({
      formikValues: MODEL_VALUES,
      context: {
        yamlJsonObject: {
          entry_point: 'router_1',
          nodes: [{ id: 'router_1', type: PipelineNodeTypes.Router, routes: ['END'], condition: '' }],
        },
      },
    });

    expect(screen.getByTestId('pipeline-node-panel-build-with-ai')).toHaveAttribute(
      'aria-label',
      'Edit with AI',
    );
  });

  it('opens the node AI modal on click', () => {
    renderPanel({ formikValues: MODEL_VALUES });
    fireEvent.click(screen.getByTestId('pipeline-node-panel-build-with-ai'));

    expect(screen.getByTestId('node-ai-modal-stub')).toHaveAttribute('data-mode', 'build');
  });

  it('disables the AI button without a model', async () => {
    renderPanel();
    const button = screen.getByTestId('pipeline-node-panel-build-with-ai');

    expect(button).toBeDisabled();
    fireEvent.mouseOver(button.parentElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Select a model for this pipeline to use AI',
    );
  });

  it('hides the AI button for deprecated node types', () => {
    renderPanel({
      flowNode: { id: 'loop_1', type: PipelineNodeTypes.Loop, data: {} },
      formikValues: MODEL_VALUES,
    });

    expect(screen.queryByTestId('pipeline-node-panel-build-with-ai')).toBeNull();
  });

  it.each([
    ['a deprecated type', { id: 'loop_1', type: PipelineNodeTypes.Loop, data: {} }],
    [
      'a legacy inline decision',
      {
        id: `review_decision${FlowEditorConstants.DECISION_NODE_ID_SUFFIX}`,
        type: PipelineNodeTypes.Decision,
        data: { label: 'Decision(deprecated inline decision)' },
      },
    ],
  ])('disables Duplicate for %s and explains why', async (_label, flowNode) => {
    const { contextValue } = renderPanel({ flowNode });
    const button = screen.getByTestId('pipeline-node-panel-duplicate');

    expect(button).toBeDisabled();
    fireEvent.mouseOver(button.parentElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent("Deprecated nodes can't be duplicated");
    fireEvent.click(button);
    expect(contextValue.handleDuplicateNode).not.toHaveBeenCalled();
  });

  it.each([
    ['read-only mode', { context: { disabled: true } }, "You can't edit this pipeline"],
    ['a running pipeline', { context: { isRunningPipeline: true } }, 'Wait for the run to finish'],
    [
      'a published version',
      { formikValues: { version_details: { ...MODEL_VALUES.version_details, status: 'published' } } },
      "This version can't be edited",
    ],
  ])('keeps only a disabled AI button in %s', async (_label, options, tooltip) => {
    renderPanel({ formikValues: MODEL_VALUES, ...options });
    const button = screen.getByTestId('pipeline-node-panel-build-with-ai');

    expect(button).toBeDisabled();
    fireEvent.mouseOver(button.parentElement);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(tooltip);
    if (options.context) {
      expect(screen.queryByTestId('pipeline-node-panel-duplicate')).toBeNull();
      expect(screen.getByTestId('pipeline-node-panel-name-input')).toBeDisabled();
    }
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
