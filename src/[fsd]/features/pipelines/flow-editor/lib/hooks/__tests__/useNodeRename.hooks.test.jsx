// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { act, cleanup, renderHook } from '@testing-library/react';

import { useNodeRename } from '../useNodeRename.hooks';

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

const renderRename = ({
  context = createContext(),
  name = 'llm_1',
  type = PipelineNodeTypes.LLM,
  onRenamed,
  isLocked,
} = {}) => {
  const wrapper = ({ children }) => (
    <Formik
      initialValues={{ version_details: { tools: [{ toolkit_name: 'github' }] } }}
      onSubmit={vi.fn()}
    >
      <FlowEditorContext.Provider value={context}>{children}</FlowEditorContext.Provider>
    </Formik>
  );
  return { context, ...renderHook(() => useNodeRename({ name, type, onRenamed, isLocked }), { wrapper }) };
};

const rename = (result, value) => {
  let error;
  act(() => {
    error = result.current.renameNode(value);
  });
  return error;
};

describe('useNodeRename', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('allows renaming, but not while the pipeline runs, in read-only mode or for Condition', () => {
    expect(renderRename().result.current.canRename).toBe(true);
    expect(
      renderRename({ context: createContext({ isRunningPipeline: true }) }).result.current.canRename,
    ).toBe(false);
    expect(renderRename({ context: createContext({ disabled: true }) }).result.current.canRename).toBe(false);
    expect(renderRename({ type: PipelineNodeTypes.Condition }).result.current.canRename).toBe(false);
  });

  it('does nothing when the node is locked', () => {
    const onRenamed = vi.fn();
    const { result, context } = renderRename({ isLocked: true, onRenamed });

    expect(result.current.canRename).toBe(false);
    expect(rename(result, 'summarize')).toBeNull();
    expect(context.setYamlJsonObject).not.toHaveBeenCalled();
    expect(onRenamed).not.toHaveBeenCalled();
  });

  it('renames the node and every YAML reference to it', () => {
    const onRenamed = vi.fn();
    const { result, context } = renderRename({ onRenamed });

    expect(rename(result, 'summarize')).toBeNull();

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
    expect(onRenamed).toHaveBeenCalledWith('summarize');
  });

  it('rejects an empty name', () => {
    const { result, context } = renderRename();

    expect(rename(result, '  ')).toBe('Name is required');
    expect(context.setYamlJsonObject).not.toHaveBeenCalled();
  });

  it('rejects a name used by another node', () => {
    const { result, context } = renderRename();

    // Spaces are ignored when comparing names
    expect(rename(result, 'printer _1')).toBe(
      'The name has been used by other nodes, please input a new name!',
    );
    expect(context.setYamlJsonObject).not.toHaveBeenCalled();
  });

  it('rejects a name used by a toolkit', () => {
    const { result, context } = renderRename();

    expect(rename(result, 'github')).toBe(
      'The name conflicts with an existing toolkit name "github", please input a new name!',
    );
    expect(context.setYamlJsonObject).not.toHaveBeenCalled();
  });
});
