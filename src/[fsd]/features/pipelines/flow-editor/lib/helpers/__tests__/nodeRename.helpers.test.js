import { describe, expect, it } from 'vitest';

import { getNodeNameError, renameNodeInEdges, renameNodeInYaml } from '../nodeRename.helpers';

// Redux state is frozen by Immer, so the rename must not write into the objects it was given
const deepFreeze = value => {
  if (value && typeof value === 'object') Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

const nodes = [{ id: 'llm_1' }, { id: 'printer_1' }];

describe('getNodeNameError', () => {
  it('accepts an unchanged or a free name', () => {
    expect(getNodeNameError({ newName: 'llm_1', currentName: 'llm_1', nodes })).toBeNull();
    expect(getNodeNameError({ newName: 'summarize', currentName: 'llm_1', nodes })).toBeNull();
  });

  it('rejects empty names', () => {
    expect(getNodeNameError({ newName: ' ', currentName: 'llm_1', nodes })).toBe('Name is required');
  });

  it('rejects names of other nodes and toolkits, ignoring spaces', () => {
    expect(getNodeNameError({ newName: 'printer_ 1', currentName: 'llm_1', nodes })).toBe(
      'The name has been used by other nodes, please input a new name!',
    );
    expect(getNodeNameError({ newName: 'git hub', currentName: 'llm_1', nodes, toolNames: ['github'] })).toBe(
      'The name conflicts with an existing toolkit name "github", please input a new name!',
    );
  });
});

describe('renameNodeInYaml', () => {
  // Every input is frozen, so a write into any object that came from state throws instead of passing silently
  const rename = (prev, name = 'llm_1', newName = 'summarize') =>
    renameNodeInYaml(deepFreeze(prev), name, newName);

  it('renames the node id and the top-level entry point and interrupt lists', () => {
    const result = rename({
      entry_point: 'llm_1',
      nodes: [{ id: 'llm_1', type: 'llm' }],
      interrupt_before: ['llm_1', 'other'],
      interrupt_after: ['llm_1'],
    });

    expect(result.nodes).toEqual([{ id: 'summarize', type: 'llm' }]);
    expect(result.entry_point).toBe('summarize');
    expect(result.interrupt_before).toEqual(['summarize', 'other']);
    expect(result.interrupt_after).toEqual(['summarize']);
  });

  it('keeps interrupt lists that are not arrays as they are', () => {
    const result = rename({ entry_point: 'start', nodes: [], interrupt_before: null });

    expect(result.interrupt_before).toBeNull();
    expect(result.interrupt_after).toBeUndefined();
  });

  it('renames the condition, its outputs, and the default output of a condition node', () => {
    const result = rename({
      nodes: [
        {
          id: 'check_1',
          type: 'condition',
          condition: {
            condition_definition: 'if llm_1 is done',
            conditional_outputs: ['llm_1', 'end'],
            default_output: 'llm_1',
          },
        },
      ],
    });

    expect(result.nodes[0].condition).toEqual({
      condition_definition: 'if summarize is done',
      conditional_outputs: ['summarize', 'end'],
      default_output: 'summarize',
    });
  });

  it('renames the decision targets and the default output of a decision object', () => {
    const result = rename({
      nodes: [
        {
          id: 'decide_1',
          type: 'llm',
          decision: { nodes: ['llm_1', 'end'], default_output: 'llm_1' },
        },
      ],
    });

    expect(result.nodes[0].decision).toEqual({ nodes: ['summarize', 'end'], default_output: 'summarize' });
  });

  it('renames the targets and default output of a decision-type node', () => {
    const result = rename({
      nodes: [{ id: 'decide_1', type: 'decision', nodes: ['llm_1', 'end'], default_output: 'llm_1' }],
    });

    expect(result.nodes[0].nodes).toEqual(['summarize', 'end']);
    expect(result.nodes[0].default_output).toBe('summarize');
  });

  it('renames the transition of a plain node', () => {
    const result = rename({ nodes: [{ id: 'start_1', type: 'llm', transition: 'llm_1' }] });

    expect(result.nodes[0].transition).toBe('summarize');
  });

  it('leaves a transition that points elsewhere alone', () => {
    const result = rename({ nodes: [{ id: 'start_1', type: 'llm', transition: 'end' }] });

    expect(result.nodes[0].transition).toBe('end');
  });

  it('renames the condition, routes, and default output of a router node', () => {
    const result = rename({
      nodes: [
        {
          id: 'router_1',
          type: 'router',
          condition: 'route llm_1 first',
          routes: ['llm_1', 'end'],
          default_output: 'llm_1',
        },
      ],
    });

    expect(result.nodes[0]).toMatchObject({
      condition: 'route summarize first',
      routes: ['summarize', 'end'],
      default_output: 'summarize',
    });
  });

  it('renames the approve, edit and reject routes of a Hitl node without writing into frozen state', () => {
    const prev = {
      nodes: [
        { id: 'hitl_1', type: 'hitl', routes: { approve: 'llm_1', edit: 'llm_1', reject: 'end' } },
        { id: 'llm_1', type: 'llm' },
      ],
    };

    const result = rename(prev);

    expect(result.nodes[0].routes).toEqual({ approve: 'summarize', edit: 'summarize', reject: 'end' });
    expect(prev.nodes[0].routes).toEqual({ approve: 'llm_1', edit: 'llm_1', reject: 'end' });
  });

  it('keeps a Hitl node without routes as it is', () => {
    const result = rename({ nodes: [{ id: 'hitl_1', type: 'hitl' }] });

    expect(result.nodes[0]).toEqual({ id: 'hitl_1', type: 'hitl' });
  });

  it('does not change the nodes or lists it was given', () => {
    const prev = {
      entry_point: 'llm_1',
      nodes: [{ id: 'llm_1', type: 'llm', transition: 'llm_1' }],
      interrupt_before: ['llm_1'],
    };

    rename(prev);

    expect(prev).toEqual({
      entry_point: 'llm_1',
      nodes: [{ id: 'llm_1', type: 'llm', transition: 'llm_1' }],
      interrupt_before: ['llm_1'],
    });
  });
});

describe('renameNodeInEdges', () => {
  it('renames sources and targets', () => {
    expect(
      renameNodeInEdges(
        [
          { id: 'e1', source: 'a', target: 'b' },
          { id: 'e2', source: 'c', target: 'a' },
        ],
        'a',
        'z',
      ),
    ).toEqual([
      { id: 'e1', source: 'z', target: 'b' },
      { id: 'e2', source: 'c', target: 'z' },
    ]);
  });
});
