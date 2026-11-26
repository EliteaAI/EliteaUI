// @vitest-environment jsdom
import { useContext } from 'react';

import { Formik, useFormikContext } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowEditorContext, NodeConfigPanelContext, ToastContext } from '@/[fsd]/shared/lib/context';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEdges } from '@xyflow/react';

import NodeDraftSandbox from '../NodeDraftSandbox';

const DRAFT = {
  id: 'summarize',
  type: 'llm',
  transition: 'END',
  input_mapping: { task: { type: 'fixed', value: 'A' } },
};
const PIPELINE = {
  entry_point: 'fetch',
  state: { issues: { type: 'list' } },
  nodes: [
    { id: 'fetch', type: 'toolkit' },
    { id: 'summarize', type: 'llm' },
  ],
};
const REAL_TOOLS = [{ name: 'github_elitea' }];

// Stands in for a node component: reads and writes the node like LLMNode does
const FieldsStub = props => {
  const { yamlJsonObject, setYamlJsonObject, setFlowEdges, disabled } = useContext(FlowEditorContext);
  const panel = useContext(NodeConfigPanelContext);
  const { values, setFieldValue } = useFormikContext();
  const edges = useEdges();
  const node = yamlJsonObject.nodes.find(item => item.id === props.id);
  return (
    <>
      <span data-testid="stub-task">{node.input_mapping.task.value}</span>
      <span data-testid="stub-node-count">{yamlJsonObject.nodes.length}</span>
      <span data-testid="stub-state">{Object.keys(yamlJsonObject.state || {}).join(',')}</span>
      <span data-testid="stub-tools">{values.version_details.tools.map(tool => tool.name).join(',')}</span>
      <span data-testid="stub-edges">{edges.length}</span>
      <span data-testid="stub-panel">{String(Boolean(panel))}</span>
      <span data-testid="stub-disabled">{String(Boolean(disabled))}</span>
      <button
        data-testid="stub-edit"
        onClick={() =>
          setYamlJsonObject(prev => ({
            ...prev,
            nodes: prev.nodes.map(item =>
              item.id === props.id
                ? { ...item, input_mapping: { task: { type: 'fixed', value: 'B' } } }
                : item,
            ),
          }))
        }
      />
      <button
        data-testid="stub-pick"
        onClick={() =>
          setFieldValue('version_details.tools', [...values.version_details.tools, { name: 'jira' }])
        }
      />
      <button
        data-testid="stub-edges-write"
        onClick={() => setFlowEdges(prev => [...prev, { id: 'e' }])}
      />
    </>
  );
};

const renderSandbox = (props = {}) => {
  const outer = { setYamlJsonObject: vi.fn(), setFlowNodes: vi.fn(), setFlowEdges: vi.fn() };
  const onChange = vi.fn();
  const onToolsChange = vi.fn();
  let outerValues;
  const Spy = () => {
    outerValues = useFormikContext().values;
    return null;
  };
  const tree = nodeProps => (
    <Formik
      initialValues={{ version_details: { tools: REAL_TOOLS } }}
      onSubmit={vi.fn()}
    >
      <FlowEditorContext.Provider value={{ ...outer, yamlJsonObject: PIPELINE, disabled: false }}>
        <Spy />
        <NodeDraftSandbox
          node={DRAFT}
          pipeline={PIPELINE}
          NodeComponent={FieldsStub}
          onChange={onChange}
          onToolsChange={onToolsChange}
          {...nodeProps}
        />
      </FlowEditorContext.Provider>
    </Formik>
  );
  const view = render(tree(props));
  return {
    outer,
    onChange,
    onToolsChange,
    getOuterValues: () => outerValues,
    rerender: nextProps => view.rerender(tree({ ...props, ...nextProps })),
  };
};

describe('NodeDraftSandbox', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('renders the node component on the draft inside the real pipeline', () => {
    renderSandbox();
    expect(screen.getByTestId('stub-task')).toHaveTextContent('A');
    expect(screen.getByTestId('stub-node-count')).toHaveTextContent('2');
    expect(screen.getByTestId('stub-state')).toHaveTextContent('issues');
    expect(screen.getByTestId('stub-panel')).toHaveTextContent('true');
    expect(screen.getByTestId('stub-edges')).toHaveTextContent('0');
  });

  it('reports field edits and never writes the real pipeline', () => {
    const { outer, onChange } = renderSandbox();
    act(() => fireEvent.click(screen.getByTestId('stub-edit')));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ input_mapping: { task: { type: 'fixed', value: 'B' } } }),
    );
    expect(outer.setYamlJsonObject).not.toHaveBeenCalled();
  });

  it('keeps tool picks in the sandbox until Apply', () => {
    const { onToolsChange, getOuterValues } = renderSandbox();
    act(() => fireEvent.click(screen.getByTestId('stub-pick')));
    expect(screen.getByTestId('stub-tools')).toHaveTextContent('github_elitea,jira');
    expect(getOuterValues().version_details.tools).toEqual(REAL_TOOLS);
    expect(onToolsChange).toHaveBeenCalledWith([...REAL_TOOLS, { name: 'jira' }]);
  });

  it('ignores canvas edge writes', () => {
    const { outer } = renderSandbox();
    act(() => fireEvent.click(screen.getByTestId('stub-edges-write')));
    expect(outer.setFlowEdges).not.toHaveBeenCalled();
  });

  it('follows a new draft from outside (YAML view edit or regenerate)', () => {
    const { rerender, onChange } = renderSandbox();
    rerender({ node: { ...DRAFT, input_mapping: { task: { type: 'fixed', value: 'C' } } } });
    expect(screen.getByTestId('stub-task')).toHaveTextContent('C');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('starts from the tools already picked for this draft (review #3)', () => {
    renderSandbox({ tools: [...REAL_TOOLS, { name: 'jira' }] });
    expect(screen.getByTestId('stub-tools')).toHaveTextContent('github_elitea,jira');
  });

  it('passes read-only through', () => {
    renderSandbox({ disabled: true });
    expect(screen.getByTestId('stub-disabled')).toHaveTextContent('true');
  });
});

describe('NodeDraftSandbox with a real node component', () => {
  afterEach(() => cleanup());

  it('edits a real StateModifierNode field without writing the pipeline', { timeout: 60000 }, async () => {
    const { ThemeProvider, createTheme } = await import('@mui/material');
    const { default: darkPalette } = await import('@/darkPalette');
    const { default: StateModifierNode } =
      await import('@/[fsd]/features/pipelines/flow-editor/ui/nodes/StateModifierNode');
    const node = { id: 'join', type: 'state_modifier', template: '{{ a }}', input: [], output: ['report'] };
    const pipeline = { entry_point: 'join', nodes: [node] };
    const outerSet = vi.fn();
    const onChange = vi.fn();

    // Real node components (and the inputs they use) read the toast context
    const toast = {
      toastHandlers: {
        toastError: vi.fn(),
        toastSuccess: vi.fn(),
        toastInfo: vi.fn(),
        toastWarning: vi.fn(),
      },
      clearToast: vi.fn(),
      setTopPosition: vi.fn(),
      setIcon: vi.fn(),
      setOnCloseToast: vi.fn(),
    };
    render(
      <ThemeProvider theme={createTheme({ palette: darkPalette })}>
        <ToastContext.Provider value={toast}>
          <Formik
            initialValues={{ version_details: { tools: [], llm_settings: { model_name: 'm' } } }}
            onSubmit={vi.fn()}
          >
            <FlowEditorContext.Provider value={{ yamlJsonObject: pipeline, setYamlJsonObject: outerSet }}>
              <NodeDraftSandbox
                node={node}
                pipeline={pipeline}
                NodeComponent={StateModifierNode}
                onChange={onChange}
              />
            </FlowEditorContext.Provider>
          </Formik>
        </ToastContext.Provider>
      </ThemeProvider>,
    );

    const input = screen.getByTestId('pipeline-state-modifier-node-template-input');
    expect(input).toHaveValue('{{ a }}');
    // StateModifierNode writes the template on `input`, not `change`
    fireEvent.input(input, { target: { value: '{{ a }} and {{ b }}' } });

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ template: '{{ a }} and {{ b }}' }));
    expect(outerSet).not.toHaveBeenCalled();
  });
});
