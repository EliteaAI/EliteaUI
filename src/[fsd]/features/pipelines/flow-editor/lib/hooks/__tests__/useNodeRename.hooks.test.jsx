// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { act, cleanup, renderHook } from '@testing-library/react';

import { useNodeRename } from '../useNodeRename.hooks';

const toastError = vi.fn();

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastError }),
}));

const { PipelineNodeTypes } = FlowEditorConstants;

const createContext = (overrides = {}) => ({
  yamlJsonObject: {
    entry_point: 'llm_1',
    interrupt_before: ['llm_1'],
    nodes: [
      { id: 'llm_1', type: PipelineNodeTypes.LLM, transition: 'printer_1' },
      { id: 'printer_1', type: PipelineNodeTypes.Printer, transition: 'llm_1' },
      { id: 'decision_1', type: PipelineNodeTypes.Decision, nodes: ['llm_1'], default_output: 'llm_1' },
    ],
  },
  setYamlJsonObject: vi.fn(),
  setFlowNodes: vi.fn(),
  setFlowEdges: vi.fn(),
  isRunningPipeline: false,
  ...overrides,
});

const renderRename = ({ context = createContext(), name = 'llm_1', type = PipelineNodeTypes.LLM } = {}) => {
  const wrapper = ({ children }) => (
    <Formik
      initialValues={{ version_details: { tools: [{ toolkit_name: 'github' }] } }}
      onSubmit={vi.fn()}
    >
      <FlowEditorContext.Provider value={context}>{children}</FlowEditorContext.Provider>
    </Formik>
  );
  return { context, ...renderHook(() => useNodeRename({ name, type }), { wrapper }) };
};

const typeName = (result, value) => {
  act(() => result.current.onChange({ target: { value } }));
  act(() => result.current.onBlur());
};

describe('useNodeRename', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('starts editing on request, but not while the pipeline runs', () => {
    const { result } = renderRename();
    act(() => result.current.onStartEditing());
    expect(result.current.isEditingName).toBe(true);

    const { result: running } = renderRename({ context: createContext({ isRunningPipeline: true }) });
    act(() => running.current.onStartEditing());
    expect(running.current.isEditingName).toBe(false);
  });

  it('renames the node and every YAML reference to it', () => {
    const { result, context } = renderRename();

    typeName(result, 'summarize');

    const updater = context.setYamlJsonObject.mock.calls[0][0];
    const next = updater(context.yamlJsonObject);
    expect(next.entry_point).toBe('summarize');
    expect(next.interrupt_before).toEqual(['summarize']);
    expect(next.nodes.map(node => node.id)).toEqual(['summarize', 'printer_1', 'decision_1']);
    expect(next.nodes[1].transition).toBe('summarize');
    expect(next.nodes[2].nodes).toEqual(['summarize']);
    expect(next.nodes[2].default_output).toBe('summarize');

    const edgeUpdater = context.setFlowEdges.mock.calls[0][0];
    expect(edgeUpdater([{ id: 'e1', source: 'llm_1', target: 'printer_1' }])).toEqual([
      { id: 'e1', source: 'summarize', target: 'printer_1' },
    ]);
    expect(result.current.isEditingName).toBe(false);
  });

  it('rejects a name used by another node', () => {
    const { result, context } = renderRename();

    // Spaces are ignored when comparing names
    typeName(result, 'printer _1');

    expect(toastError).toHaveBeenCalledWith(
      'The name has been used by other nodes, please input a new name!',
    );
    expect(context.setYamlJsonObject).not.toHaveBeenCalled();
    expect(result.current.inputtedName).toBe('llm_1');
  });

  it('rejects a name used by a toolkit', () => {
    const { result, context } = renderRename();

    typeName(result, 'github');

    expect(toastError).toHaveBeenCalledWith(
      'The name conflicts with an existing toolkit name "github", please input a new name!',
    );
    expect(context.setYamlJsonObject).not.toHaveBeenCalled();
  });
});
