import YAML from 'js-yaml';
import { describe, expect, it } from 'vitest';

import { dumpYaml } from '@/[fsd]/shared/lib/helpers/dumpYaml.helpers';

import {
  applyNodeRenamesToYaml,
  getNodeNameError,
  getRenamedNodePairs,
  renameNodeInEdges,
  renameNodeInFlowNodes,
  renameNodeInYaml,
} from '../nodeRename.helpers';

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

  it('renames the transition of a node that also has an inline condition or decision', () => {
    const withCondition = rename({
      nodes: [
        {
          id: 'start_1',
          type: 'llm',
          transition: 'llm_1',
          condition: { condition_definition: 'x', conditional_outputs: ['end'], default_output: 'end' },
        },
      ],
    });
    const withDecision = rename({
      nodes: [
        {
          id: 'start_1',
          type: 'llm',
          transition: 'llm_1',
          decision: { nodes: ['end'], default_output: 'end' },
        },
      ],
    });

    expect(withCondition.nodes[0].transition).toBe('summarize');
    expect(withDecision.nodes[0].transition).toBe('summarize');
  });

  it('keeps the criteria of a decision node, since they are instructions and not references', () => {
    const description = 'If the llm_1 is complete go to end';
    const result = rename({
      nodes: [
        { id: 'decide_1', type: 'decision', description, nodes: ['llm_1', 'end'], default_output: 'end' },
        {
          id: 'decide_2',
          type: 'llm',
          decision: { description, nodes: ['llm_1'], default_output: 'end' },
        },
      ],
    });

    expect(result.nodes[0].description).toBe(description);
    expect(result.nodes[0].nodes).toEqual(['summarize', 'end']);
    expect(result.nodes[1].decision.description).toBe(description);
    expect(result.nodes[1].decision.nodes).toEqual(['summarize']);
  });

  it('only renames a string literal that is exactly the node name', () => {
    const condition = (definition, name, newName) =>
      renameNodeInYaml(
        { nodes: [{ id: 'check_1', type: 'llm', condition: { condition_definition: definition } }] },
        name,
        newName,
      ).nodes[0].condition.condition_definition;

    expect(condition("{{ 'Шаг 1' if count == '1' else 'end' }}", 'Шаг 1', 'Шаг 2')).toBe(
      "{{ 'Шаг 2' if count == '1' else 'end' }}",
    );
    expect(condition("{% if last_message != '' %}end{% endif %}", 'Узел', 'Next')).toBe(
      "{% if last_message != '' %}end{% endif %}",
    );
  });

  it('renames a node name that a Jinja condition renders or compares as a string, not a state variable', () => {
    const result = rename({
      nodes: [
        {
          id: 'check_1',
          type: 'llm',
          condition: {
            condition_definition:
              "{% if llm_1 %}llm_1{% else %}end{% endif %}{{ 'llm_1' if llm_1.output == 'llm_10' else \"end\" }}",
            conditional_outputs: ['llm_1'],
            default_output: 'end',
          },
        },
      ],
    });

    expect(result.nodes[0].condition.condition_definition).toBe(
      "{% if llm_1 %}summarize{% else %}end{% endif %}{{ 'summarize' if llm_1.output == 'llm_10' else \"end\" }}",
    );
    expect(result.nodes[0].condition.conditional_outputs).toEqual(['summarize']);
  });

  it('keeps a bare name inside a Jinja tag, since it reads a state variable', () => {
    const template = '{{ llm_1 }} {{ llm_1.output }} {% if llm_1 == "llm_10" %}end{% endif %}';

    expect(
      rename({ nodes: [{ id: 'check_1', type: 'llm', condition: { condition_definition: template } }] })
        .nodes[0].condition.condition_definition,
    ).toBe(template);
  });

  it('leaves a transition that points elsewhere alone', () => {
    const result = rename({ nodes: [{ id: 'start_1', type: 'llm', transition: 'end' }] });

    expect(result.nodes[0].transition).toBe('end');
  });

  it('keeps the template of a state modifier, since it holds data and not node references', () => {
    const template =
      "Please llm_1 the draft: {{ messages }} {% if status == 'llm_1' %}{{ 'llm_1' }}{% endif %}";
    const result = rename({
      nodes: [{ id: 'set_1', type: 'state_modifier', template, output: ['next'] }],
    });

    expect(result.nodes[0].template).toBe(template);
  });

  it('renames a node name that a router template renders, but keeps bare state names', () => {
    const result = rename({
      nodes: [
        {
          id: 'router_1',
          type: 'router',
          condition: "{{ 'llm_1' if llm_1 else 'end' }}",
          routes: ['llm_1', 'end'],
          default_output: 'end',
        },
      ],
    });

    expect(result.nodes[0].condition).toBe("{{ 'summarize' if llm_1 else 'end' }}");
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

describe('getRenamedNodePairs', () => {
  it('pairs a node whose id changed in place, with the same type', () => {
    expect(
      getRenamedNodePairs(
        [
          { id: 'Node A', type: 'llm' },
          { id: 'printer', type: 'printer' },
        ],
        [
          { id: 'Node A renamed', type: 'llm' },
          { id: 'printer', type: 'printer' },
        ],
      ),
    ).toEqual([['Node A', 'Node A renamed']]);
  });

  it('ignores nodes that were added, removed or changed type', () => {
    expect(
      getRenamedNodePairs(
        [{ id: 'a', type: 'llm' }],
        [
          { id: 'b', type: 'llm' },
          { id: 'c', type: 'llm' },
        ],
      ),
    ).toEqual([]);
    expect(getRenamedNodePairs([{ id: 'a', type: 'llm' }], [{ id: 'b', type: 'printer' }])).toEqual([]);
  });

  it('ignores a swap of ids, where both old ids are still in use', () => {
    expect(
      getRenamedNodePairs(
        [
          { id: 'a', type: 'llm' },
          { id: 'b', type: 'llm' },
        ],
        [
          { id: 'b', type: 'llm' },
          { id: 'a', type: 'llm' },
        ],
      ),
    ).toEqual([]);
  });

  it('ignores a node replaced by a different one at the same position', () => {
    expect(
      getRenamedNodePairs(
        [{ id: 'translate', type: 'llm', input: ['a'] }],
        [{ id: 'classify', type: 'llm', input: ['b'], structured_output: true }],
      ),
    ).toEqual([]);
  });

  it('pairs a renamed node whose keys are in a different order, as after the YAML view sorts them', () => {
    // The order a node gets on the canvas, and not the sorted order the YAML view writes
    const prevNode = {
      id: 'llm_1',
      type: 'llm',
      input: ['messages'],
      output: ['messages'],
      transition: 'end',
      structured_output: false,
    };
    const nextNode = YAML.load(dumpYaml({ nodes: [{ ...prevNode, id: 'summarize' }] })).nodes[0];

    expect(Object.keys(nextNode)).not.toEqual(Object.keys(prevNode));
    expect(getRenamedNodePairs([prevNode], [nextNode])).toEqual([['llm_1', 'summarize']]);
  });

  it('still ignores a node whose content changed, whatever the key order', () => {
    expect(
      getRenamedNodePairs(
        [{ id: 'a', type: 'llm', transition: 'end', input: ['x', 'y'] }],
        [{ input: ['x', 'y'], id: 'b', type: 'llm', transition: 'other' }],
      ),
    ).toEqual([]);
    expect(
      getRenamedNodePairs(
        [{ id: 'a', type: 'llm', input: ['x', 'y'] }],
        [{ input: ['y', 'x'], id: 'b', type: 'llm' }],
      ),
    ).toEqual([]);
  });

  it('tolerates missing lists and empty items', () => {
    expect(getRenamedNodePairs(undefined, [])).toEqual([]);
    expect(getRenamedNodePairs([{ id: 'a', type: 'llm' }], null)).toEqual([]);
    expect(getRenamedNodePairs([null], [{ id: 'b', type: 'llm' }])).toEqual([]);
  });
});

describe('applyNodeRenamesToYaml', () => {
  it('updates the references of a node renamed in the YAML text', () => {
    // The YAML already has the new id on the node, but the references still use the old one
    const yamlJson = {
      entry_point: 'Node A',
      nodes: [
        { id: 'Node A renamed', type: 'llm' },
        { id: 'hitl', type: 'hitl', routes: { approve: 'Node A', edit: 'hitl', reject: 'Node A' } },
      ],
    };

    const result = applyNodeRenamesToYaml(yamlJson, [['Node A', 'Node A renamed']]);

    expect(result.entry_point).toBe('Node A renamed');
    expect(result.nodes[1].routes).toEqual({
      approve: 'Node A renamed',
      edit: 'hitl',
      reject: 'Node A renamed',
    });
  });

  it('returns the pipeline as it is when there are no renames', () => {
    const yamlJson = { entry_point: 'a', nodes: [{ id: 'a', type: 'llm' }] };

    expect(applyNodeRenamesToYaml(yamlJson)).toBe(yamlJson);
  });
});

describe('renameNodeInFlowNodes', () => {
  it('renames only whole node names in the condition shown on the canvas', () => {
    const result = renameNodeInFlowNodes(
      deepFreeze([
        {
          id: 'check_1',
          data: {
            label: 'check_1',
            condition: {
              condition_definition: '{{ "llm_1" }}{{ llm_1 }}{{ llm_10 }}',
              conditional_outputs: ['llm_1'],
              default_output: 'end',
            },
          },
        },
      ]),
      'llm_1',
      'summarize',
    );

    expect(result[0].data.condition.condition_definition).toBe('{{ "summarize" }}{{ llm_1 }}{{ llm_10 }}');
    expect(result[0].data.condition.conditional_outputs).toEqual(['summarize']);
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
