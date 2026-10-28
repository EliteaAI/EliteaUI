// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FlowEditorConstants,
  NodePanelConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { act, cleanup, renderHook } from '@testing-library/react';

import { useNodeYamlEditor } from '../useNodeYamlEditor.hooks';

const { PipelineNodeTypes } = FlowEditorConstants;
const { NODE_YAML_APPLY_DELAY_MS, NODE_YAML_ERRORS } = NodePanelConstants;

const createPipeline = () => ({
  entry_point: 'llm_1',
  nodes: [
    { id: 'llm_1', type: PipelineNodeTypes.LLM, transition: 'printer_1' },
    { id: 'printer_1', type: PipelineNodeTypes.Printer, transition: 'END' },
  ],
});

const renderEditor = ({ flowNodeId = 'llm_1', isReadOnly = false, context = {} } = {}) => {
  const contextValue = {
    yamlJsonObject: createPipeline(),
    setYamlJsonObject: vi.fn(),
    setFlowNodes: vi.fn(),
    setFlowEdges: vi.fn(),
    resyncFlowFromYaml: vi.fn(),
    registerNodeLeaveGuard: vi.fn(() => () => {}),
    ...context,
  };
  const onRenamed = vi.fn();
  const current = { value: contextValue };
  const wrapper = ({ children }) => (
    <Formik
      initialValues={{ version_details: { tools: [] } }}
      onSubmit={vi.fn()}
    >
      <FlowEditorContext.Provider value={current.value}>{children}</FlowEditorContext.Provider>
    </Formik>
  );
  const hook = renderHook(() => useNodeYamlEditor({ flowNodeId, onRenamed, isReadOnly }), { wrapper });
  const setPipeline = yamlJsonObject => {
    current.value = { ...contextValue, yamlJsonObject };
    hook.rerender();
  };
  return { ...hook, contextValue, onRenamed, setPipeline };
};

const type = (result, code) => {
  act(() => result.current.onChangeCode(code));
  act(() => vi.advanceTimersByTime(NODE_YAML_APPLY_DELAY_MS));
};

describe('useNodeYamlEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('shows the node YAML and writes nothing on open', () => {
    const { result, contextValue } = renderEditor();

    expect(result.current.draft).toBe('- id: llm_1\n  type: llm\n  transition: printer_1\n');
    expect(contextValue.setYamlJsonObject).not.toHaveBeenCalled();
  });

  it('applies a valid edit once, after the typing pause', () => {
    const { result, contextValue } = renderEditor();

    act(() => result.current.onChangeCode('- id: llm_1\n  type: llm\n  transition: END\n  extra: 1\n'));
    expect(contextValue.setYamlJsonObject).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(NODE_YAML_APPLY_DELAY_MS));

    expect(contextValue.setYamlJsonObject).toHaveBeenCalledTimes(1);
    const next = contextValue.setYamlJsonObject.mock.calls[0][0];
    expect(next.nodes[0]).toEqual({ id: 'llm_1', type: 'llm', transition: 'END', extra: 1 });
    expect(next.nodes[1]).toEqual(createPipeline().nodes[1]);
    expect(contextValue.resyncFlowFromYaml).toHaveBeenCalledWith(next);
    expect(contextValue.setFlowNodes).not.toHaveBeenCalled();
  });

  it('does not apply a re-formatted but equal node', () => {
    const { result, contextValue } = renderEditor();

    type(result, 'transition: printer_1\ntype: llm\nid: llm_1\n');

    expect(contextValue.setYamlJsonObject).not.toHaveBeenCalled();
    expect(result.current.error).toBe('');
  });

  it('keeps invalid YAML in the draft and applies nothing', () => {
    const { result, contextValue } = renderEditor();

    type(result, '- id: llm_1\n  type: printer\n');

    expect(result.current.error).toBe(NODE_YAML_ERRORS.typeChange);
    expect(contextValue.setYamlJsonObject).not.toHaveBeenCalled();
  });

  it('renames the node and its references through one YAML write', () => {
    const { result, contextValue, onRenamed } = renderEditor({ flowNodeId: 'printer_1' });

    type(result, '- id: final\n  type: printer\n  transition: END\n');

    expect(contextValue.setYamlJsonObject).toHaveBeenCalledTimes(1);
    const next = contextValue.setYamlJsonObject.mock.calls[0][0];
    expect(next.nodes[0].transition).toBe('final');
    expect(contextValue.setFlowNodes).toHaveBeenCalledTimes(1);
    expect(contextValue.setFlowEdges).toHaveBeenCalledTimes(1);
    expect(onRenamed).toHaveBeenCalledWith('final');
  });

  it('refreshes a clean draft from outside changes, but keeps unapplied edits', () => {
    const { result, setPipeline } = renderEditor();
    const changed = createPipeline();
    changed.nodes[0].transition = 'END';

    setPipeline(changed);
    expect(result.current.draft).toContain('transition: END');

    type(result, '- id: llm_1\n  type: [broken');
    const changedAgain = createPipeline();
    setPipeline(changedAgain);

    expect(result.current.draft).toBe('- id: llm_1\n  type: [broken');
  });

  it('blocks leaving with an invalid draft until it is discarded', () => {
    const { result } = renderEditor();

    type(result, '- id: llm_1\n  type: [broken');
    expect(result.current.shouldBlockLeave()).toBe(true);

    act(() => result.current.discard());

    expect(result.current.shouldBlockLeave()).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.draft).toBe('- id: llm_1\n  type: llm\n  transition: printer_1\n');
  });

  it('applies a pending edit when leaving', () => {
    const { result, contextValue } = renderEditor();

    act(() => result.current.onChangeCode('- id: llm_1\n  type: llm\n  transition: END\n'));
    let blocked;
    act(() => {
      blocked = result.current.shouldBlockLeave();
    });

    expect(blocked).toBe(false);
    expect(contextValue.setYamlJsonObject).toHaveBeenCalledTimes(1);
  });

  it('applies a pending edit when the editor loses focus', () => {
    const { result, contextValue } = renderEditor();

    act(() => result.current.onChangeCode('- id: llm_1\n  type: llm\n  transition: END\n'));
    act(() => result.current.onEditorBlur());

    expect(contextValue.setYamlJsonObject).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(NODE_YAML_APPLY_DELAY_MS));
    expect(contextValue.setYamlJsonObject).toHaveBeenCalledTimes(1);
  });

  it('ignores edits when read-only', () => {
    const { result, contextValue } = renderEditor({ isReadOnly: true });

    type(result, '- id: llm_1\n  type: llm\n');

    expect(contextValue.setYamlJsonObject).not.toHaveBeenCalled();
    expect(result.current.shouldBlockLeave()).toBe(false);
  });
});
