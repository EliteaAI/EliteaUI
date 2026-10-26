// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import DecisionDefaultOutputSelect from '../DecisionDefaultOutputSelect';
import DecisionOutputsSelect from '../DecisionOutputsSelect';

// The select reports the next value through onValueChange; the stub exposes it as buttons
vi.mock('@/[fsd]/shared/ui', () => ({
  Select: {
    SingleSelect: ({ options, onValueChange, value, multiple, ...rest }) => (
      <div data-testid={rest['data-testid']}>
        {options.map(option => (
          <button
            key={option.value}
            onClick={() =>
              onValueChange(
                multiple
                  ? value.includes(option.value)
                    ? value.filter(item => item !== option.value)
                    : [...value, option.value]
                  : option.value,
              )
            }
          >
            {option.label}
          </button>
        ))}
        <button onClick={() => rest.onClear?.()}>clear</button>
      </div>
    ),
  },
}));

const { PipelineNodeTypes, DEFAULT_OUTPUT } = FlowEditorConstants;

const yamlJsonObject = {
  nodes: [
    { id: 'decision_1', type: PipelineNodeTypes.Decision, nodes: ['llm_1'], default_output: 'llm_1' },
    { id: 'llm_1', type: PipelineNodeTypes.LLM },
    { id: 'printer_1', type: PipelineNodeTypes.Printer },
    { id: 'decision_2', type: PipelineNodeTypes.Decision },
  ],
};

const renderWithContext = element => {
  const context = {
    yamlJsonObject,
    setYamlJsonObject: vi.fn(),
    setFlowEdges: vi.fn(),
    onConnectNodes: vi.fn(),
  };
  render(<FlowEditorContext.Provider value={context}>{element}</FlowEditorContext.Provider>);
  return context;
};

describe('DecisionOutputsSelect', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('offers every node except itself and other decisions, plus END', () => {
    renderWithContext(
      <DecisionOutputsSelect
        id="decision_1"
        decisionOutput={['llm_1']}
        onRemoveOutput={vi.fn()}
      />,
    );

    expect(screen.getByText('llm_1')).toBeInTheDocument();
    expect(screen.getByText('printer_1')).toBeInTheDocument();
    expect(screen.getByText('END')).toBeInTheDocument();
    expect(screen.queryByText('decision_1')).toBeNull();
    expect(screen.queryByText('decision_2')).toBeNull();
  });

  it('adds an output through the canvas connect logic', () => {
    const context = renderWithContext(
      <DecisionOutputsSelect
        id="decision_1"
        decisionOutput={['llm_1']}
        onRemoveOutput={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('printer_1'));

    expect(context.onConnectNodes).toHaveBeenCalledWith({
      source: 'decision_1',
      sourceHandle: 'nodes',
      target: 'printer_1',
      targetHandle: null,
    });
  });

  it('removes an output through the chip removal logic', () => {
    const removeOutput = vi.fn();
    const onRemoveOutput = vi.fn(() => removeOutput);
    const context = renderWithContext(
      <DecisionOutputsSelect
        id="decision_1"
        decisionOutput={['llm_1']}
        onRemoveOutput={onRemoveOutput}
      />,
    );

    fireEvent.click(screen.getByText('llm_1'));

    expect(onRemoveOutput).toHaveBeenCalledWith('llm_1');
    expect(removeOutput).toHaveBeenCalled();
    expect(context.onConnectNodes).not.toHaveBeenCalled();
  });
});

describe('DecisionDefaultOutputSelect', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('replaces the default-output edge and connects the new target', () => {
    const context = renderWithContext(
      <DecisionDefaultOutputSelect
        id="decision_1"
        value="llm_1"
      />,
    );

    fireEvent.click(screen.getByText('printer_1'));

    const edgeUpdater = context.setFlowEdges.mock.calls[0][0];
    expect(
      edgeUpdater([
        { id: 'e1', source: 'decision_1', sourceHandle: DEFAULT_OUTPUT, target: 'llm_1' },
        { id: 'e2', source: 'decision_1', sourceHandle: 'nodes', target: 'llm_1' },
      ]),
    ).toEqual([{ id: 'e2', source: 'decision_1', sourceHandle: 'nodes', target: 'llm_1' }]);
    expect(context.onConnectNodes).toHaveBeenCalledWith({
      source: 'decision_1',
      sourceHandle: DEFAULT_OUTPUT,
      target: 'printer_1',
      targetHandle: null,
    });
  });

  it('clears the default output the way deleting its edge does', () => {
    const context = renderWithContext(
      <DecisionDefaultOutputSelect
        id="decision_1"
        value="llm_1"
      />,
    );

    fireEvent.click(screen.getByText('clear'));

    expect(context.onConnectNodes).not.toHaveBeenCalled();
    expect(context.setYamlJsonObject).toHaveBeenCalled();
    const written = context.setYamlJsonObject.mock.calls[0][0];
    const nextYaml = typeof written === 'function' ? written(yamlJsonObject) : written;
    expect(nextYaml.nodes[0].default_output).toBe('');
  });
});
